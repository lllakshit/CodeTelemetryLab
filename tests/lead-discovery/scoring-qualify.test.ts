import assert from "node:assert/strict"
import { test } from "node:test"
import {
  SIGNATURE,
  counterEvidence,
  extractJsonObject,
  fallbackDraft,
  finalizeDraft,
  normalizeServices,
  qualificationSchema,
  verifiedPersonName,
} from "../../src/lib/lead-discovery/qualify.ts"
import { QUALIFY_THRESHOLD, computeScore, confidenceFor, contactScore, rankQualified, recencyCap } from "../../src/lib/lead-discovery/scoring.ts"

const facts = { publicEmail: true, contactPage: true, namedDecisionMaker: false }

test("the total is recomputed from sub-scores with the fixed weights", () => {
  const result = computeScore({ model: { pain: 8, fit: 8, timing: 8, evidence: 8 }, contact: facts, signalAgeDays: 5, rationale: "r" })
  // 20 + 20 + 16 + 12 (contact 8/10) + 12 = 80
  assert.equal(result.contact, 8)
  assert.equal(result.total, 80)
  assert.equal(result.points.pain, 20)
})

test("the model cannot inflate: out-of-range sub-scores are clamped and evidence is capped by age", () => {
  const result = computeScore({ model: { pain: 50, fit: 10, timing: 10, evidence: 10 }, contact: { publicEmail: false, contactPage: false, namedDecisionMaker: false }, signalAgeDays: 40, rationale: "" })
  assert.equal(result.pain, 10)
  assert.equal(result.evidence, 6)
  assert.equal(result.contact, 3)
  assert.ok(result.total <= 100)
  assert.ok(result.adjustments.some((line) => line.includes("capped")))
})

test("contact score and recency caps follow the checked facts", () => {
  assert.equal(contactScore({ publicEmail: false, contactPage: false, namedDecisionMaker: false }), 3)
  assert.equal(contactScore({ publicEmail: true, contactPage: true, namedDecisionMaker: true }), 10)
  assert.equal(recencyCap(3), 10)
  assert.equal(recencyCap(60), 3)
})

test("confidence and ranking", () => {
  assert.equal(confidenceFor(85, { ...facts, publicEmail: true }, 10), "high")
  assert.equal(confidenceFor(85, { publicEmail: false, contactPage: true, namedDecisionMaker: false }, 10), "medium")
  assert.equal(confidenceFor(QUALIFY_THRESHOLD - 1, facts, 1), "low")
  const ranked = rankQualified([
    { score: 75, signalAgeDays: 2, domain: "b.com" },
    { score: 80, signalAgeDays: 9, domain: "a.com" },
    { score: 75, signalAgeDays: 1, domain: "c.com" },
  ])
  assert.deepEqual(ranked.map((item) => item.domain), ["a.com", "c.com", "b.com"])
})

const reply = {
  company: "Acme AI",
  is_real_company: true,
  industry: "Fintech",
  location: "null",
  signal_summary: "Acme AI raised a $4M seed round on 20 Nov 2026.",
  potential_need: "May need help building integrations with accounting systems.",
  service_fit: ["API Development", "ai automation", "Blockchain"],
  decision_maker_name: "Jane Doe",
  decision_maker_role: "CEO",
  scores: { pain: "7", fit: 8, timing: 9, evidence: 8 },
  counter_evidence: { already_solved: "false", seller_not_buyer: false, wrong_buyer: false, weak_or_missing_evidence: false, notes: "" },
  rationale: "Fresh seed round.",
}

test("model replies are validated and normalised", () => {
  const parsed = qualificationSchema.parse(reply)
  assert.equal(parsed.location, null)
  assert.equal(parsed.scores.pain, 7)
  // The string "false" must not become true.
  assert.equal(parsed.counter_evidence.already_solved, false)
  assert.deepEqual(normalizeServices(parsed.service_fit), ["API Development", "AI Automation"])
  assert.equal(qualificationSchema.safeParse({ ...reply, scores: { pain: 11, fit: 1, timing: 1, evidence: 1 } }).success, false)
})

test("counter-evidence rejects sellers, wrong buyers and no service fit", () => {
  const parsed = qualificationSchema.parse({ ...reply, counter_evidence: { ...reply.counter_evidence, seller_not_buyer: true } })
  assert.ok(counterEvidence(parsed, normalizeServices(parsed.service_fit)).some((reason) => reason.includes("competitor")))
  const clean = qualificationSchema.parse(reply)
  assert.deepEqual(counterEvidence(clean, normalizeServices(clean.service_fit)), [])
  assert.ok(counterEvidence(clean, []).includes("No matching CodeTelemetryLab service"))
})

test("a decision-maker is kept only when the name is in the source text", () => {
  const sources = ["Acme AI was founded by Jane Doe (CEO) and Raj Patel."]
  assert.equal(verifiedPersonName("Jane Doe", "Acme AI", sources), "Jane Doe")
  assert.equal(verifiedPersonName("John Smith", "Acme AI", sources), null)
  assert.equal(verifiedPersonName("Jane", "Acme AI", sources), null)
  assert.equal(verifiedPersonName("Acme AI", "Acme AI", sources), null)
  assert.equal(verifiedPersonName("Jane Do", "Acme AI", ["Jane Doen"]), null)
})

test("drafts with invented contact details, links, placeholders or spam are refused", () => {
  const body = "Hi Jane,\n\nSaw that Acme AI raised a $4M seed round this week. Teams at this stage often need to ship integrations quickly while the core team focuses on the product. We build APIs and automations for startups.\n\nWould a 15-minute call next week be useful?"
  const ok = finalizeDraft({ subject: "Acme AI's next integrations", body: `${body}\n\nBest,\nLakshit` }, ["https://techcrunch.com/a"])
  assert.ok(ok)
  assert.ok(ok.body.endsWith(SIGNATURE))
  assert.ok(!ok.body.includes("Best,\nLakshit\n"))
  assert.equal(finalizeDraft({ subject: "Hi", body: `${body} Write to me at me@x.com` }, []), null)
  assert.equal(finalizeDraft({ subject: "Hi there", body: `${body} See https://evil.example.com/` }, []), null)
  assert.equal(finalizeDraft({ subject: "Hi there", body: `${body} [Your Name]` }, []), null)
  assert.equal(finalizeDraft({ subject: "Guaranteed results", body }, []), null)
  assert.ok(finalizeDraft({ subject: "Hi there", body: `${body} https://www.codetelemetrylab.me/services` }, []))
})

test("the fallback draft uses only given facts and our signature", () => {
  const draft = fallbackDraft({ company: "Acme AI", firstName: null, signalSummary: "Acme AI raised a seed round", potentialNeed: "May need integration work", services: ["API Development"] })
  assert.ok(draft.body.startsWith("Hi Acme AI team,"))
  assert.ok(draft.body.includes("API Development"))
  assert.ok(draft.body.endsWith(SIGNATURE))
  assert.ok(!/@/.test(draft.body))
})

test("JSON is pulled out of fenced or chatty replies", () => {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 })
  assert.deepEqual(extractJsonObject('Here you go: {"a":2} thanks'), { a: 2 })
  assert.equal(extractJsonObject("no json"), null)
})
