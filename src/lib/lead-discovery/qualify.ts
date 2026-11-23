/**
 * What the model may say about a candidate, how its answer is checked against the source text, and the email
 * draft rules. Pure (zod only), so it is unit-tested without the network.
 */
import { z } from "zod"
import { SERVICES, type Service } from "./types.ts"

const score = z.coerce.number().min(0).max(10)
/** Booleans as JSON or as "true"/"false" strings ("false" must not coerce to true). */
const bool = z.preprocess((value) => (typeof value === "string" ? value.trim().toLowerCase() === "true" : Boolean(value)), z.boolean())
const shortText = (max: number) => z.string().trim().max(max * 2).transform((value) => value.slice(0, max))
const nullableText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const text = (value ?? "").trim()
      return text && !/^(null|none|n\/a|unknown|not (stated|found|mentioned|available))$/i.test(text) ? text.slice(0, max) : null
    })

export const qualificationSchema = z.object({
  company: shortText(120).pipe(z.string().min(1)),
  is_real_company: bool,
  industry: nullableText(120),
  location: nullableText(120),
  signal_summary: shortText(400).pipe(z.string().min(10)),
  potential_need: shortText(500).pipe(z.string().min(10)),
  service_fit: z.array(z.string()).max(6).default([]),
  decision_maker_name: nullableText(120),
  decision_maker_role: nullableText(120),
  scores: z.object({ pain: score, fit: score, timing: score, evidence: score }),
  counter_evidence: z.object({
    already_solved: bool.default(false),
    seller_not_buyer: bool.default(false),
    wrong_buyer: bool.default(false),
    weak_or_missing_evidence: bool.default(false),
    notes: z.string().default("").transform((value) => value.slice(0, 400)),
  }),
  rationale: z.string().default("").transform((value) => value.slice(0, 1200)),
})

export type Qualification = z.output<typeof qualificationSchema>

export const draftSchema = z.object({
  subject: z.string().trim().min(5).max(120),
  body: z.string().trim().min(80).max(2400),
})

export type Draft = z.output<typeof draftSchema>

/** Keeps only our six service names, matched loosely ("api dev" -> "API Development"). */
export function normalizeServices(values: string[]): Service[] {
  const out = new Set<Service>()
  for (const raw of values) {
    const value = raw.toLowerCase()
    const match = SERVICES.find((service) => service.toLowerCase() === value) ??
      (value.includes("automation") ? "AI Automation"
        : value.includes("mvp") ? "MVP Development"
          : value.includes("saas") ? "SaaS Development"
            : /\bapis?\b/.test(value) || value.includes("integration") ? "API Development"
              : /\b(ai|artificial intelligence|machine learning|ml|llm|genai)\b/.test(value) ? "AI Development"
                : value.includes("custom") || value.includes("software") ? "Custom Software Development"
                  : undefined)
    if (match) out.add(match)
  }
  return [...out]
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/**
 * A person's name is kept only if it appears word-for-word in the evidence or on the company's site, has at least
 * two words, and is not just the company name. Otherwise it is dropped, never guessed.
 */
export function verifiedPersonName(name: string | null, company: string, sources: string[]): string | null {
  if (!name) return null
  const wanted = normalizeForMatch(name)
  const words = wanted.split(" ").filter(Boolean)
  if (words.length < 2 || words.length > 5 || wanted.length > 60) return null
  if (wanted === normalizeForMatch(company)) return null
  if (/\b(team|founders|ceo|cto|coo|cfo|inc|ltd|llc|capital|ventures|partners)\b/.test(wanted)) return null
  const pattern = new RegExp(`(^| )${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`)
  return sources.some((text) => pattern.test(normalizeForMatch(text))) ? name.trim() : null
}

/** Reasons the code itself rejects a candidate, whatever the model scored. Empty = no hard objection. */
export function counterEvidence(q: Qualification, services: Service[]): string[] {
  const reasons: string[] = []
  if (!q.is_real_company) reasons.push("Not a specific company")
  if (q.counter_evidence.already_solved) reasons.push(`Need already solved${q.counter_evidence.notes ? `: ${q.counter_evidence.notes}` : ""}`)
  if (q.counter_evidence.seller_not_buyer) reasons.push("Sells development services (a competitor, not a buyer)")
  if (q.counter_evidence.wrong_buyer) reasons.push("Wrong buyer for our services")
  if (q.counter_evidence.weak_or_missing_evidence) reasons.push("Evidence does not support a need")
  if (!services.length) reasons.push("No matching CodeTelemetryLab service")
  return reasons
}

const SITE = "https://www.codetelemetrylab.me"

/** Appended by code, so the model never writes contact details. */
export const SIGNATURE = `Lakshit Mathur\nFounder, CodeTelemetryLab\n${SITE}`

/**
 * Checks a model-written draft: no email addresses, no links other than the evidence and our site, no placeholders,
 * no spam phrases, sane length. Returns the cleaned draft with our signature, or null to use the fallback.
 */
export function finalizeDraft(draft: Draft, allowedUrls: string[]): Draft | null {
  const body = draft.body.replace(/\r\n/g, "\n").trim()
  const subject = draft.subject.replace(/\s+/g, " ").replace(/^["']|["']$/g, "").trim()
  const text = `${subject}\n${body}`
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return null
  if (/\[[^\]]{2,40}\]|\{\{|\}\}|<[^>]+>|lorem ipsum/i.test(text)) return null
  if (/\b(guarantee[d]?|100%|act now|limited time|risk[- ]free|click here|dear sir|dear madam|to whom it may concern|buy now)\b/i.test(text)) return null
  const allowed = [...allowedUrls, SITE, "codetelemetrylab.me"].map((url) => url.toLowerCase())
  for (const url of text.match(/\bhttps?:\/\/[^\s)]+|\bwww\.[^\s)]+/gi) ?? []) {
    const value = url.toLowerCase().replace(/[.,;:!?]+$/, "")
    if (!allowed.some((ok) => value.startsWith(ok) || ok.startsWith(value))) return null
  }
  // Drop any sign-off the model added; ours goes last.
  const withoutSignoff = body
    .replace(/\n+(best|regards|best regards|warm regards|kind regards|thanks|thank you|cheers|sincerely)[,!.]?\s*\n[\s\S]*$/i, "")
    .replace(/\n+(lakshit|lakshit mathur)[\s\S]*$/i, "")
    .trim()
  if (withoutSignoff.length < 80 || withoutSignoff.length > 1600) return null
  return { subject: subject.slice(0, 120), body: `${withoutSignoff}\n\nBest regards,\n${SIGNATURE}` }
}

/** Plain, honest fallback draft built only from verified fields. */
export function fallbackDraft(input: {
  company: string
  firstName: string | null
  signalSummary: string
  potentialNeed: string
  services: Service[]
}): Draft {
  const greeting = input.firstName ? `Hi ${input.firstName},` : `Hi ${input.company} team,`
  const services = input.services.slice(0, 2).join(" and ")
  const body = [
    greeting,
    "",
    `I came across this: ${input.signalSummary.replace(/\s+/g, " ").trim().replace(/[.]?$/, ".")}`,
    "",
    `Teams at this stage often need help with ${input.potentialNeed.replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/[.]?$/, "")}. CodeTelemetryLab is a small remote engineering team that does ${services || "custom software"} work for startups, so your in-house engineers can stay on the core roadmap.`,
    "",
    "If this is on your list, would a short call next week be useful? Happy to share a few relevant examples first.",
    "",
    `Best regards,\n${SIGNATURE}`,
  ].join("\n")
  return { subject: `${input.company}: extra engineering hands for what is next`.slice(0, 120), body }
}

/** Pulls the first JSON object out of a model reply (some models wrap it in prose or code fences). */
export function extractJsonObject(reply: string): unknown {
  const trimmed = reply.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(trimmed.slice(start, end + 1))
    } catch {
      return null
    }
  }
}
