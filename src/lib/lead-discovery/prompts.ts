/** Prompts for qualification and drafting. Everything the model sees is source text we fetched ourselves. */
import { SERVICES } from "./types.ts"

export const QUALIFY_SYSTEM = `You qualify B2B prospects for CodeTelemetryLab, a small remote software studio (Jaipur, India) that sells:
${SERVICES.map((service) => `- ${service}`).join("\n")}
Buyers: founders, CTOs and operations leads at startups and growing tech companies in the US, Canada, UK, UAE, Australia and India.

Rules you must follow:
- Use ONLY the SOURCE and COMPANY SITE text given. Never invent facts, people, emails, job openings, funding, numbers or problems.
- decision_maker_name: a person's full name ONLY if it is written in the text together with a founder/CEO/CTO/COO/VP/Head role at THIS company. Otherwise null.
- "Hiring engineers" is an opportunity to investigate, not proof they want an outside team; score timing accordingly.
- Counter-evidence: set seller_not_buyer=true if the company itself sells development/agency/outsourcing services; wrong_buyer=true for governments, universities, charities, huge enterprises (thousands of staff), or consumer businesses with no software need; already_solved=true if the text shows the need is already covered in-house or by a vendor; weak_or_missing_evidence=true if the text does not actually show a signal about this company.
- Scores are integers 0-10 and must be justified by the text:
  pain = business pain or opportunity our services address;
  fit = how directly our six services match what they need now;
  timing = how fresh and pressing the buying signal is (new round, launch, integration, hiring);
  evidence = how specific and verifiable the source is about this company.
- service_fit: only names from the list above.
- Keep signal_summary factual (what happened, when, per the source). potential_need is a careful hypothesis, phrased as "may need ..." and tied to the signal.
Reply with one JSON object only.`

export function qualifyUser(input: {
  companyHint: string | null
  website: string
  signalKind: string
  signalDate: string
  region: string
  evidenceUrl: string
  sourceText: string
  siteText: string
}) {
  return `COMPANY (as named by the source): ${input.companyHint ?? "unknown"}
WEBSITE: ${input.website}
SIGNAL TYPE: ${input.signalKind}   SIGNAL DATE: ${input.signalDate.slice(0, 10)}   REGION HINT: ${input.region}
EVIDENCE URL: ${input.evidenceUrl}

SOURCE:
"""
${input.sourceText}
"""

COMPANY SITE:
"""
${input.siteText}
"""

Return JSON with exactly these keys:
{"company": string, "is_real_company": boolean, "industry": string|null, "location": string|null,
 "signal_summary": string, "potential_need": string, "service_fit": string[],
 "decision_maker_name": string|null, "decision_maker_role": string|null,
 "scores": {"pain": int, "fit": int, "timing": int, "evidence": int},
 "counter_evidence": {"already_solved": boolean, "seller_not_buyer": boolean, "wrong_buyer": boolean, "weak_or_missing_evidence": boolean, "notes": string},
 "rationale": string}`
}

export const DRAFT_SYSTEM = `You write a first cold email from Lakshit Mathur, founder of CodeTelemetryLab (remote software studio: ${SERVICES.join(", ")}).
Rules:
- 90 to 150 words. Plain text, short paragraphs, no bullet lists, no emojis, no markdown.
- Open with the specific public signal (what happened, from the facts given) in one sentence. Do not flatter.
- One sentence on a plausible need, phrased as a possibility ("teams often...", "if ... is on your roadmap"), never as a claim about their problems.
- One or two sentences on how CodeTelemetryLab could help, naming at most two of our services.
- End with one low-pressure question (for example a 15-minute call). No sign-off, no name, no signature, no contact details: those are added later.
- Never invent facts, numbers, clients, case studies, people or links. Do not include any email address or URL.
- Subject: under 70 characters, specific to them, no clickbait, no ALL CAPS.
Reply with JSON only: {"subject": string, "body": string}`

export function draftUser(input: {
  company: string
  firstName: string | null
  role: string | null
  signalSummary: string
  signalDate: string
  potentialNeed: string
  services: string[]
}) {
  return `Company: ${input.company}
Recipient: ${input.firstName ? `${input.firstName}${input.role ? ` (${input.role})` : ""}` : "the team (no named person; greet the team)"}
Public signal (${input.signalDate.slice(0, 10)}): ${input.signalSummary}
Possible need: ${input.potentialNeed}
Matching services: ${input.services.join(", ")}`
}
