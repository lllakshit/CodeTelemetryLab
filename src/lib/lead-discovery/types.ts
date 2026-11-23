/** Shared types for the daily lead-discovery pipeline. Pure: no framework or server imports. */

export type SignalKind = "funding" | "hiring" | "launch" | "growth" | "workflow"

/** Markets we sell into. GLOBAL = remote-first or not stated. */
export type Region = "US" | "CA" | "UK" | "AE" | "AU" | "IN" | "GLOBAL"

/** One public buying signal found by a discovery source, before any qualification. */
export type Candidate = {
  /** Source id, e.g. "hn-launch" or "feed:betakit". */
  source: string
  signalKind: SignalKind
  title: string
  /** Short plain-text snippet from the source item. */
  summary: string
  /** Public page that proves the signal (article, HN post or comment). Always http(s). */
  evidenceUrl: string
  /** When the signal was published, from the source's own metadata (never from the model). ISO string. */
  signalDate: string
  /** Company name as the source states it, when it can be read without guessing. */
  companyHint: string | null
  /** Company site when the source links it directly. */
  websiteUrl: string | null
  region: Region
  /** Outbound links found in the source item. A company site taken from an article must be one of these. */
  linkedUrls: string[]
  /** Plain text of the source item when the source already returns it (HN), so the page need not be fetched. */
  text?: string
}

export type SourceContext = {
  now: Date
  maxAgeDays: number
  /** Most items this source should return. */
  limit: number
  signal: AbortSignal
}

/**
 * A pluggable discovery source. New sources (for example a Google Maps / local-business adapter) implement this and
 * are added to the list in sources/index.ts; nothing else in the pipeline changes.
 */
export interface DiscoverySource {
  id: string
  label: string
  /** False when the source needs a key that is not set. */
  enabled(): boolean
  discover(context: SourceContext): Promise<Candidate[]>
}

export const SERVICES = [
  "AI Development",
  "AI Automation",
  "Custom Software Development",
  "SaaS Development",
  "MVP Development",
  "API Development",
] as const

export type Service = (typeof SERVICES)[number]

export const PROSPECT_STATUSES = ["new", "approved", "contacted", "replied", "follow_up_due", "rejected", "won"] as const
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "New",
  approved: "Approved",
  contacted: "Contacted",
  replied: "Replied",
  follow_up_due: "Follow-up due",
  rejected: "Rejected",
  won: "Won",
}

export type ScoreBreakdown = {
  /** Each dimension 0-10. */
  pain: number
  fit: number
  timing: number
  contact: number
  evidence: number
  /** Weighted points per dimension (sum = total). */
  points: { pain: number; fit: number; timing: number; contact: number; evidence: number }
  total: number
  rationale: string
  /** Deterministic adjustments applied on top of the model's sub-scores. */
  adjustments: string[]
}

export type Confidence = "low" | "medium" | "high"

export type Prospect = {
  id: string
  createdAt: string
  updatedAt: string
  company: string
  website: string
  domain: string
  industry: string | null
  location: string | null
  signalKind: SignalKind
  signalSummary: string
  signalDate: string
  evidenceUrl: string
  source: string
  potentialNeed: string
  serviceFit: string[]
  decisionMakerName: string | null
  decisionMakerRole: string | null
  contactRoute: string | null
  contactEmail: string | null
  score: number
  scoreBreakdown: ScoreBreakdown | null
  confidence: Confidence
  draftSubject: string
  draftBody: string
  status: ProspectStatus
  notes: string | null
  emailLogId: string | null
  contactedAt: string | null
}

export type RunSummary = {
  trigger: "cron" | "manual"
  sources: Record<string, number>
  sourceErrors: Record<string, string>
  candidates: number
  tooOld: number
  deduplicated: number
  noWebsite: number
  enriched: number
  qualifiedByModel: number
  qualified: number
  inserted: number
  rejected: number
  notScoredInTime: number
  insertedCompanies: string[]
  rejections: { company: string; reason: string }[]
  durationMs: number
  stoppedEarly: boolean
}
