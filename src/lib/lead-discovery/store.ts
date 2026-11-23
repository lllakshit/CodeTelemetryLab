import { createSupabaseAdminClient } from "@/lib/supabase"
import { normalizeDomain } from "./domain.ts"
import {
  PROSPECT_STATUSES,
  type Confidence,
  type Prospect,
  type ProspectStatus,
  type RunSummary,
  type ScoreBreakdown,
  type SignalKind,
} from "./types.ts"

/** Supabase persistence for prospects, screened domains and runs. Server only (service role). */

type ProspectRow = {
  id: string
  created_at: string
  updated_at: string
  company: string
  website: string
  domain: string
  industry: string | null
  location: string | null
  signal_kind: SignalKind
  signal_summary: string
  signal_date: string
  evidence_url: string
  source: string
  potential_need: string
  service_fit: unknown
  decision_maker_name: string | null
  decision_maker_role: string | null
  contact_route: string | null
  contact_email: string | null
  score: number
  score_breakdown: unknown
  confidence: Confidence
  draft_subject: string
  draft_body: string
  status: ProspectStatus
  notes: string | null
  email_log_id: string | null
  contacted_at: string | null
}

export type NewProspect = Omit<ProspectRow, "id" | "created_at" | "updated_at" | "status" | "notes" | "email_log_id" | "contacted_at"> & {
  run_id: string
}

export type RunRow = {
  id: string
  trigger: "cron" | "manual"
  status: "running" | "done" | "failed"
  started_at: string
  finished_at: string | null
  summary: Partial<RunSummary>
  error: string | null
}

function fromRow(row: ProspectRow): Prospect {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    company: row.company,
    website: row.website,
    domain: row.domain,
    industry: row.industry,
    location: row.location,
    signalKind: row.signal_kind,
    signalSummary: row.signal_summary,
    signalDate: row.signal_date,
    evidenceUrl: row.evidence_url,
    source: row.source,
    potentialNeed: row.potential_need,
    serviceFit: Array.isArray(row.service_fit) ? row.service_fit.map(String) : [],
    decisionMakerName: row.decision_maker_name,
    decisionMakerRole: row.decision_maker_role,
    contactRoute: row.contact_route,
    contactEmail: row.contact_email,
    score: row.score,
    scoreBreakdown: row.score_breakdown && typeof row.score_breakdown === "object" ? (row.score_breakdown as ScoreBreakdown) : null,
    confidence: row.confidence,
    draftSubject: row.draft_subject,
    draftBody: row.draft_body,
    status: PROSPECT_STATUSES.includes(row.status) ? row.status : "new",
    notes: row.notes,
    emailLogId: row.email_log_id,
    contactedAt: row.contacted_at,
  }
}

function isMissingTable(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : ""
  const message = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message).toLowerCase() : ""
  return code === "42P01" || code === "PGRST205" || message.includes("could not find the table") || message.includes("does not exist")
}

/** Reads every page of a query (PostgREST returns at most 1,000 rows per request). */
async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, max = 20_000): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await query(from, from + 999)
    if (error) {
      if (isMissingTable(error)) return out
      throw error
    }
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

/**
 * Every company domain we already know: saved prospects, recently screened domains, inbound leads (website and email
 * domain), and everyone emailed from the Email and Outreach screens. Used to skip a company before spending tokens.
 */
export async function loadKnownDomains(screenedWithinDays = 60): Promise<Set<string>> {
  const supabase = createSupabaseAdminClient()
  const since = new Date(Date.now() - screenedWithinDays * 86_400_000).toISOString()
  const [prospects, screened, leads, logs, messages] = await Promise.all([
    readAll<{ domain: string }>((from, to) => supabase.from("prospects").select("domain").range(from, to)),
    readAll<{ domain: string }>((from, to) => supabase.from("prospect_screened").select("domain").gte("screened_at", since).range(from, to)),
    readAll<{ email: string | null; website_url: string | null }>((from, to) => supabase.from("leads").select("email, website_url").range(from, to)),
    readAll<{ recipient: string | null }>((from, to) => supabase.from("email_logs").select("recipient").range(from, to)),
    readAll<{ to_emails: unknown }>((from, to) => supabase.from("outreach_messages").select("to_emails").range(from, to)),
  ])
  const domains = new Set<string>()
  const add = (value: string | null | undefined) => {
    const domain = normalizeDomain(value)
    if (domain) domains.add(domain)
  }
  prospects.forEach((row) => add(row.domain))
  screened.forEach((row) => add(row.domain))
  leads.forEach((row) => {
    add(row.email)
    add(row.website_url)
  })
  logs.forEach((row) => String(row.recipient ?? "").split(/[,;\s]+/).forEach(add))
  messages.forEach((row) => (Array.isArray(row.to_emails) ? row.to_emails : []).forEach((email) => add(String(email))))
  return domains
}

/**
 * Starts a run. Returns null when another run is in progress. A run left "running" for more than 10 minutes
 * (a crashed function) is closed as failed first, so it can never block discovery for good.
 */
export async function startRun(trigger: "cron" | "manual"): Promise<RunRow | null> {
  const supabase = createSupabaseAdminClient()
  const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString()
  await supabase
    .from("prospect_runs")
    .update({ status: "failed", finished_at: new Date().toISOString(), error: "Run did not finish (timed out)" })
    .eq("status", "running")
    .lt("started_at", staleBefore)
  const { data, error } = await supabase.from("prospect_runs").insert({ trigger, status: "running" }).select("*").single()
  if (error) {
    if ((error as { code?: string }).code === "23505") return null
    throw error
  }
  return data as RunRow
}

export async function finishRun(id: string, outcome: { status: "done" | "failed"; summary: Partial<RunSummary>; error?: string | null }) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("prospect_runs")
    .update({ status: outcome.status, summary: outcome.summary, error: outcome.error ?? null, finished_at: new Date().toISOString() })
    .eq("id", id)
  if (error) console.error("Lead discovery: could not close run", error)
}

export async function listRuns(limit = 5): Promise<RunRow[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("prospect_runs").select("*").order("started_at", { ascending: false }).limit(limit)
  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data ?? []) as RunRow[]
}

/** Inserts prospects; a domain that already exists is skipped (unique index), never overwritten. */
export async function insertProspects(rows: NewProspect[]): Promise<string[]> {
  if (!rows.length) return []
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("prospects")
    .upsert(rows, { onConflict: "domain", ignoreDuplicates: true })
    .select("domain")
  if (error) throw error
  return (data ?? []).map((row) => (row as { domain: string }).domain)
}

export type ScreenedRow = {
  domain: string
  company: string | null
  evidence_url: string | null
  verdict: "saved" | "qualified_not_saved" | "rejected"
  score: number | null
  reason: string | null
}

export async function recordScreened(rows: ScreenedRow[]) {
  if (!rows.length) return
  const unique = [...new Map(rows.map((row) => [row.domain, row])).values()]
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("prospect_screened")
    .upsert(unique.map((row) => ({ ...row, screened_at: new Date().toISOString() })), { onConflict: "domain" })
  if (error) console.error("Lead discovery: could not record screened domains", error)
}

export async function listProspects(status?: ProspectStatus | null): Promise<Prospect[]> {
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(200)
  if (status) query = query.eq("status", status)
  const { data, error } = await query
  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data as ProspectRow[]).map(fromRow)
}

export async function countProspectsByStatus(): Promise<Record<ProspectStatus, number>> {
  const counts = Object.fromEntries(PROSPECT_STATUSES.map((status) => [status, 0])) as Record<ProspectStatus, number>
  const supabase = createSupabaseAdminClient()
  const rows = await readAll<{ status: ProspectStatus }>((from, to) => supabase.from("prospects").select("status").range(from, to))
  for (const row of rows) if (row.status in counts) counts[row.status] += 1
  return counts
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("prospects").select("*").eq("id", id).maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return data ? fromRow(data as ProspectRow) : null
}

export async function updateProspect(id: string, patch: { status?: ProspectStatus; notes?: string | null }) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("prospects").update(patch).eq("id", id)
  if (error) throw error
}

/** Called after a successful send from /admin/email. Never moves a won/replied prospect backwards. */
export async function markProspectContacted(id: string, emailLogId: string | null) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("prospects")
    .update({ status: "contacted", email_log_id: emailLogId, contacted_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["new", "approved", "follow_up_due", "contacted"])
    .select("id")
  if (error) throw error
  return (data ?? []).length > 0
}
