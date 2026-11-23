/**
 * Deterministic scoring. The model only proposes 0-10 sub-scores for four dimensions; the total, the contact
 * dimension, the recency cap, the threshold and the confidence label are all computed here, so the model can never
 * inflate a total or invent reachability.
 */
import type { Confidence, ScoreBreakdown } from "./types.ts"

export const QUALIFY_THRESHOLD = 70
export const MAX_SAVED_PER_RUN = 5

/** Weights out of 100 (from the first-customer-finder rubric). */
export const WEIGHTS = { pain: 25, fit: 25, timing: 20, contact: 15, evidence: 15 } as const

export type ModelSubScores = { pain: number; fit: number; timing: number; evidence: number }

export type ContactFacts = {
  /** Public address found on the company's own pages. */
  publicEmail: boolean
  /** A contact / about / team page exists on the company's site. */
  contactPage: boolean
  /** Decision-maker named in the evidence or on the company site (verified by text match). */
  namedDecisionMaker: boolean
}

function clamp10(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(10, Math.round(value * 2) / 2)) : 0
}

/** Contact & decision-maker accessibility, 0-10, from facts the code itself checked. */
export function contactScore(facts: ContactFacts): number {
  let score = 3 // the company has a working website
  if (facts.contactPage) score += 2
  if (facts.publicEmail) score += 3
  if (facts.namedDecisionMaker) score += 2
  return Math.min(10, score)
}

/** Highest evidence score allowed for a signal of this age. Old news is weak evidence of a current need. */
export function recencyCap(ageDays: number): number {
  if (ageDays <= 14) return 10
  if (ageDays <= 30) return 8
  if (ageDays <= 45) return 6
  return 3
}

export function computeScore(input: {
  model: ModelSubScores
  contact: ContactFacts
  signalAgeDays: number
  rationale: string
}): ScoreBreakdown {
  const adjustments: string[] = []
  const pain = clamp10(input.model.pain)
  const fit = clamp10(input.model.fit)
  const timing = clamp10(input.model.timing)
  const contact = contactScore(input.contact)
  let evidence = clamp10(input.model.evidence)
  const cap = recencyCap(input.signalAgeDays)
  if (evidence > cap) {
    adjustments.push(`Evidence capped at ${cap}/10: the signal is ${Math.round(input.signalAgeDays)} days old.`)
    evidence = cap
  }
  adjustments.push(
    `Contact ${contact}/10 from checked facts: website yes, contact page ${input.contact.contactPage ? "yes" : "no"}, public email ${input.contact.publicEmail ? "yes" : "no"}, named decision-maker ${input.contact.namedDecisionMaker ? "yes" : "no"}.`,
  )
  const points = {
    pain: (pain / 10) * WEIGHTS.pain,
    fit: (fit / 10) * WEIGHTS.fit,
    timing: (timing / 10) * WEIGHTS.timing,
    contact: (contact / 10) * WEIGHTS.contact,
    evidence: (evidence / 10) * WEIGHTS.evidence,
  }
  const total = Math.round(points.pain + points.fit + points.timing + points.contact + points.evidence)
  const round1 = (value: number) => Math.round(value * 10) / 10
  return {
    pain,
    fit,
    timing,
    contact,
    evidence,
    points: { pain: round1(points.pain), fit: round1(points.fit), timing: round1(points.timing), contact: round1(points.contact), evidence: round1(points.evidence) },
    total: Math.max(0, Math.min(100, total)),
    rationale: input.rationale.slice(0, 1200),
    adjustments,
  }
}

export function confidenceFor(score: number, facts: ContactFacts, signalAgeDays: number): Confidence {
  if (score >= 82 && signalAgeDays <= 21 && (facts.publicEmail || facts.namedDecisionMaker)) return "high"
  if (score >= QUALIFY_THRESHOLD) return "medium"
  return "low"
}

/** Best first, then fresher signal, then the domain for a stable order. */
export function rankQualified<T extends { score: number; signalAgeDays: number; domain: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score || a.signalAgeDays - b.signalAgeDays || a.domain.localeCompare(b.domain))
}
