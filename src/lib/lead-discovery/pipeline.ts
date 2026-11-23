import { normalizeDomain, slug } from "./domain.ts"
import { enrichCandidate, type Enriched } from "./enrich.ts"
import { mapWithConcurrency } from "./fetch-page.ts"
import { groqConfigured, groqJson } from "./groq.ts"
import { DRAFT_SYSTEM, QUALIFY_SYSTEM, draftUser, qualifyUser } from "./prompts.ts"
import {
  counterEvidence,
  draftSchema,
  fallbackDraft,
  finalizeDraft,
  normalizeServices,
  qualificationSchema,
  verifiedPersonName,
  type Draft,
  type Qualification,
} from "./qualify.ts"
import { MAX_SAVED_PER_RUN, QUALIFY_THRESHOLD, computeScore, confidenceFor, rankQualified, type ContactFacts } from "./scoring.ts"
import { ageInDays, preScore } from "./signals.ts"
import { allSources } from "./sources/index.ts"
import { finishRun, insertProspects, loadKnownDomains, recordScreened, startRun, type NewProspect, type ScreenedRow } from "./store.ts"
import type { Candidate, RunSummary, ScoreBreakdown, Service } from "./types.ts"

/**
 * Daily lead discovery:
 *   sources (30-50 dated public signals) -> de-duplicate against everything we already know -> cheap pre-score ->
 *   read the evidence and the company's own site -> model sub-scores + counter-evidence -> deterministic score ->
 *   save at most 5 with score >= 70, each with a source-grounded draft. Nothing is ever sent.
 */

export type RunOptions = {
  trigger: "cron" | "manual"
  now?: Date
  maxCandidates?: number
  maxAgeDays?: number
  /** Candidates whose pages are read. */
  enrichLimit?: number
  /** Candidates sent to the model. */
  qualifyLimit?: number
  /** Whole run budget; must stay under the function's maxDuration (300 s). */
  budgetMs?: number
}

export type RunResult =
  | { ok: true; runId: string; summary: RunSummary }
  | { ok: false; status: 409 | 503 | 500; error: string; runId?: string; summary?: Partial<RunSummary> }

type Scored = {
  enriched: Enriched
  q: Qualification
  services: Service[]
  breakdown: ScoreBreakdown
  score: number
  decisionMakerName: string | null
  contact: ContactFacts
  signalAgeDays: number
  domain: string
}

function interleave(groups: Candidate[][], max: number): Candidate[] {
  const out: Candidate[] = []
  const seenUrl = new Set<string>()
  const seenCompany = new Set<string>()
  for (let round = 0; out.length < max; round += 1) {
    let added = false
    for (const group of groups) {
      const item = group[round]
      if (!item) continue
      added = true
      const company = item.companyHint ? slug(item.companyHint) : ""
      if (seenUrl.has(item.evidenceUrl) || (company && seenCompany.has(company))) continue
      seenUrl.add(item.evidenceUrl)
      if (company) seenCompany.add(company)
      out.push(item)
      if (out.length >= max) break
    }
    if (!added) break
  }
  return out
}

function contactRoute(enriched: Enriched) {
  if (enriched.publicEmail) return `Public email on ${enriched.contactPageUrl ?? enriched.website}`
  if (enriched.contactPageUrl) return `Contact page: ${enriched.contactPageUrl}`
  return `Website: ${enriched.website}`
}

async function qualify(enriched: Enriched, deadline: number, now: Date): Promise<{ scored: Scored } | { rejected: string }> {
  const c = enriched.candidate
  const reply = await groqJson({
    system: QUALIFY_SYSTEM,
    user: qualifyUser({
      companyHint: c.companyHint,
      website: enriched.website,
      signalKind: c.signalKind,
      signalDate: c.signalDate,
      region: c.region,
      evidenceUrl: c.evidenceUrl,
      sourceText: enriched.sourceText,
      siteText: enriched.siteText,
    }),
    maxTokens: 650,
    deadline,
  })
  if (!reply.ok) return { rejected: `Not scored: ${reply.error}` }
  const parsed = qualificationSchema.safeParse(reply.json)
  if (!parsed.success) return { rejected: "Model reply did not match the schema" }
  const q = parsed.data
  const services = normalizeServices(q.service_fit)
  const hard = counterEvidence(q, services)
  const decisionMakerName = verifiedPersonName(q.decision_maker_name, q.company, [enriched.sourceText, enriched.siteText, c.summary])
  const contact: ContactFacts = {
    publicEmail: Boolean(enriched.publicEmail),
    contactPage: Boolean(enriched.contactPageUrl),
    namedDecisionMaker: Boolean(decisionMakerName),
  }
  const signalAgeDays = ageInDays(c.signalDate, now)
  const breakdown = computeScore({ model: q.scores, contact, signalAgeDays, rationale: q.rationale })
  if (hard.length) return { rejected: `${hard.join("; ")} (score ${breakdown.total})` }
  return {
    scored: { enriched, q, services, breakdown, score: breakdown.total, decisionMakerName, contact, signalAgeDays, domain: enriched.domain },
  }
}

async function writeDraft(item: Scored, deadline: number): Promise<Draft> {
  const firstName = item.decisionMakerName ? item.decisionMakerName.split(/\s+/)[0] : null
  const reply = await groqJson({
    system: DRAFT_SYSTEM,
    user: draftUser({
      company: item.q.company,
      firstName,
      role: item.decisionMakerName ? item.q.decision_maker_role : null,
      signalSummary: item.q.signal_summary,
      signalDate: item.enriched.candidate.signalDate,
      potentialNeed: item.q.potential_need,
      services: item.services,
    }),
    maxTokens: 450,
    deadline,
    temperature: 0.4,
  })
  if (reply.ok) {
    const parsed = draftSchema.safeParse(reply.json)
    if (parsed.success) {
      const finalDraft = finalizeDraft(parsed.data, [item.enriched.candidate.evidenceUrl, item.enriched.website])
      if (finalDraft) return finalDraft
    }
  }
  return fallbackDraft({
    company: item.q.company,
    firstName,
    signalSummary: item.q.signal_summary,
    potentialNeed: item.q.potential_need,
    services: item.services,
  })
}

export async function runDiscovery(options: RunOptions): Promise<RunResult> {
  const started = Date.now()
  const now = options.now ?? new Date()
  const maxCandidates = options.maxCandidates ?? 50
  const maxAgeDays = options.maxAgeDays ?? 45
  const enrichLimit = options.enrichLimit ?? 18
  const qualifyLimit = options.qualifyLimit ?? 10
  const deadline = started + (options.budgetMs ?? 270_000)

  if (!groqConfigured()) {
    return { ok: false, status: 503, error: "GROQ_API_KEY is not set, so candidates cannot be qualified. Add it in Vercel (see docs/LEAD-DISCOVERY.md)." }
  }

  const run = await startRun(options.trigger)
  if (!run) return { ok: false, status: 409, error: "A discovery run is already in progress. Try again in a few minutes." }

  const summary: RunSummary = {
    trigger: options.trigger,
    sources: {},
    sourceErrors: {},
    candidates: 0,
    tooOld: 0,
    deduplicated: 0,
    noWebsite: 0,
    enriched: 0,
    qualifiedByModel: 0,
    qualified: 0,
    inserted: 0,
    rejected: 0,
    notScoredInTime: 0,
    insertedCompanies: [],
    rejections: [],
    durationMs: 0,
    stoppedEarly: false,
  }

  try {
    // 1. Gather dated signals from every enabled source, in parallel, each with its share of the budget.
    const sources = allSources().filter((source) => source.enabled())
    const perSource = Math.max(4, Math.ceil(maxCandidates / Math.max(1, sources.length)) + 2)
    const gathered = await Promise.all(
      sources.map(async (source) => {
        try {
          const items = await source.discover({ now, maxAgeDays, limit: perSource, signal: AbortSignal.timeout(25_000) })
          summary.sources[source.id] = items.length
          return items
        } catch (error) {
          summary.sources[source.id] = 0
          summary.sourceErrors[source.id] = error instanceof Error ? error.message.slice(0, 200) : "failed"
          return []
        }
      }),
    )
    // Rank inside each source first, so the round-robin takes each source's strongest signals.
    const ranked = gathered.map((items) => [...items].sort((a, b) => preScore(b, now) - preScore(a, now)))
    const fresh = interleave(ranked, maxCandidates).filter((candidate) => {
      const ok = ageInDays(candidate.signalDate, now) <= maxAgeDays && /^https?:\/\//.test(candidate.evidenceUrl)
      if (!ok) summary.tooOld += 1
      return ok
    })
    summary.candidates = fresh.length + summary.tooOld

    // 2. Skip companies we already know before reading any page or spending tokens.
    const known = await loadKnownDomains()
    const unknown = fresh.filter((candidate) => {
      const domain = candidate.websiteUrl ? normalizeDomain(candidate.websiteUrl) : null
      if (domain && known.has(domain)) {
        summary.deduplicated += 1
        return false
      }
      return true
    })

    // 3. Read the evidence and the company site for the most promising candidates.
    const toEnrich = [...unknown].sort((a, b) => preScore(b, now) - preScore(a, now)).slice(0, enrichLimit + 8)
    const enrichAbort = AbortSignal.timeout(Math.max(20_000, Math.min(90_000, deadline - Date.now() - 120_000)))
    const results = await mapWithConcurrency(toEnrich, 6, (candidate) => enrichCandidate(candidate, enrichAbort))
    const ready: Enriched[] = []
    const seenDomains = new Set<string>()
    for (const result of results) {
      if (!("website" in result)) {
        if (result.reason === "no_website") summary.noWebsite += 1
        if (result.domain && known.has(result.domain)) summary.deduplicated += 1
        continue
      }
      if (known.has(result.domain) || seenDomains.has(result.domain)) {
        summary.deduplicated += 1
        continue
      }
      seenDomains.add(result.domain)
      ready.push(result)
    }
    summary.enriched = ready.length

    // 4. Model sub-scores and counter-evidence, then the deterministic score. Leave time for drafts and saving.
    const toQualify = ready.slice(0, Math.min(qualifyLimit, enrichLimit))
    const qualifyDeadline = deadline - 45_000
    const scored: Scored[] = []
    const screened: ScreenedRow[] = []
    for (const enriched of toQualify) {
      if (Date.now() > qualifyDeadline - 8000) {
        summary.notScoredInTime += 1
        summary.stoppedEarly = true
        continue
      }
      const outcome = await qualify(enriched, qualifyDeadline, now)
      const company = enriched.candidate.companyHint ?? enriched.domain
      if ("rejected" in outcome) {
        if (outcome.rejected.startsWith("Not scored")) {
          summary.notScoredInTime += 1
          continue
        }
        summary.rejected += 1
        summary.rejections.push({ company, reason: outcome.rejected })
        screened.push({ domain: enriched.domain, company, evidence_url: enriched.candidate.evidenceUrl, verdict: "rejected", score: null, reason: outcome.rejected.slice(0, 500) })
        continue
      }
      summary.qualifiedByModel += 1
      if (outcome.scored.score < QUALIFY_THRESHOLD) {
        summary.rejected += 1
        const reason = `Score ${outcome.scored.score} is below ${QUALIFY_THRESHOLD}`
        summary.rejections.push({ company: outcome.scored.q.company, reason })
        screened.push({ domain: enriched.domain, company: outcome.scored.q.company, evidence_url: enriched.candidate.evidenceUrl, verdict: "rejected", score: outcome.scored.score, reason })
        continue
      }
      scored.push(outcome.scored)
    }
    summary.qualified = scored.length

    // 5. Keep the best five, write their drafts, save.
    const best = rankQualified(scored).slice(0, MAX_SAVED_PER_RUN)
    for (const extra of rankQualified(scored).slice(MAX_SAVED_PER_RUN)) {
      screened.push({ domain: extra.domain, company: extra.q.company, evidence_url: extra.enriched.candidate.evidenceUrl, verdict: "qualified_not_saved", score: extra.score, reason: "Qualified but outside today's top five" })
    }
    const rows: NewProspect[] = []
    for (const item of best) {
      const draft = await writeDraft(item, deadline)
      const c = item.enriched.candidate
      rows.push({
        run_id: run.id,
        company: item.q.company,
        website: item.enriched.website,
        domain: item.domain,
        industry: item.q.industry,
        location: item.q.location,
        signal_kind: c.signalKind,
        signal_summary: item.q.signal_summary,
        signal_date: c.signalDate.slice(0, 10),
        evidence_url: c.evidenceUrl,
        source: c.source,
        potential_need: item.q.potential_need,
        service_fit: item.services,
        decision_maker_name: item.decisionMakerName,
        decision_maker_role: item.decisionMakerName ? item.q.decision_maker_role : null,
        contact_route: contactRoute(item.enriched),
        contact_email: item.enriched.publicEmail,
        score: item.score,
        score_breakdown: item.breakdown,
        confidence: confidenceFor(item.score, item.contact, item.signalAgeDays),
        draft_subject: draft.subject,
        draft_body: draft.body,
      })
    }
    const insertedDomains = await insertProspects(rows)
    summary.inserted = insertedDomains.length
    summary.insertedCompanies = rows.filter((row) => insertedDomains.includes(row.domain)).map((row) => row.company)
    for (const row of rows) {
      screened.push({ domain: row.domain, company: row.company, evidence_url: row.evidence_url, verdict: "saved", score: row.score, reason: null })
    }
    await recordScreened(screened)

    summary.rejections = summary.rejections.slice(0, 20)
    summary.durationMs = Date.now() - started
    await finishRun(run.id, { status: "done", summary })
    return { ok: true, runId: run.id, summary }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    summary.durationMs = Date.now() - started
    await finishRun(run.id, { status: "failed", summary, error: message.slice(0, 1000) })
    return { ok: false, status: 500, error: message, runId: run.id, summary }
  }
}
