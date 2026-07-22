export type CaseStudyNarrative = {
  overview: string
  challenge: string
  constraints: string[]
  decisions: { title: string; text: string }[]
  architecture: string
  implementation: string
  tradeoffs: string[]
  lessons: string[]
  outcome: string
  future: string
  ctaLabel: string
}

export const caseStudyNarratives: Record<string, CaseStudyNarrative> = {
  "client-portal-redesign": {
    overview:
      "A remote services team needed one place for clients to complete onboarding, see project status, and retrieve documents—without turning Slack into the system of record.",
    challenge:
      "Status lived in threads. Documents lived in shared drives with unclear versions. New clients asked the same onboarding questions repeatedly. Support staff spent hours answering ‘where are we?’ instead of doing delivery work.",
    constraints: [
      "Clients had varying technical comfort—UI had to stay plain",
      "Existing auth provider had to be reused",
      "No dedicated mobile app in phase one",
      "Content owners needed to update help text without deploys",
    ],
    decisions: [
      {
        title: "Dashboard-first information architecture",
        text: "Every role lands on a single overview: outstanding tasks, recent updates, and documents needing attention. Deep links exist, but the home state answers the first question.",
      },
      {
        title: "Role-aware navigation",
        text: "Client, delivery lead, and admin see different nav density. We avoided a mega-menu that exposed internal tools to clients.",
      },
      {
        title: "Document checkpoints instead of freeform uploads",
        text: "Required documents are checklist items with states (missing, submitted, approved). That gave ops a queue instead of a folder full of mystery PDFs.",
      },
    ],
    architecture:
      "Next.js App Router with authenticated route group. Prisma models for projects, memberships, documents, and activity events. Auth.js sessions gate every portal route. File metadata lives in Postgres; binaries in object storage referenced by signed URLs.",
    implementation:
      "We shipped the portal shell, membership invites, document checklist, and activity feed first. Email notifications fire on state changes that require client action. Editors update onboarding copy through a structured content path so engineering is not on the critical path for wording tweaks.",
    tradeoffs: [
      "Deferred real-time chat—activity feed + email covered the first release",
      "Accepted a simpler notification model rather than a full preference center",
      "Kept PDF preview basic; rich annotation waits for phase two",
    ],
    lessons: [
      "Clients care more about ‘what do you need from me?’ than about vanity dashboards",
      "Document states beat folders for operational clarity",
      "Role-aware nav prevents accidental exposure of internal tooling",
    ],
    outcome:
      "Onboarding became a checklist instead of a scavenger hunt. Status questions dropped because the portal showed the same truth the team used internally. Document handoff gained a reviewable trail.",
    future:
      "Phase two candidates: finer notification preferences, richer file preview, and optional client-side commenting on documents.",
    ctaLabel: "Discuss a client portal",
  },
  "internal-automation-console": {
    overview:
      "An operations team moved data between tools by hand. We built a console where approved jobs run with logs, retries, and a human pause switch.",
    challenge:
      "Nightly copy-paste between CRM, spreadsheets, and a billing tool created inconsistent records. Failures were discovered days later when a customer noticed. Nobody could answer which run succeeded without reading chat history.",
    constraints: [
      "Could not replace the CRM in phase one",
      "Jobs must be pauseable by non-engineers",
      "Every external write needed an audit entry",
      "Vendor rate limits were tight during business hours",
    ],
    decisions: [
      {
        title: "Job table as source of truth",
        text: "Each automation run is a row with status, attempts, and payload summary. The UI never invents state the database does not know.",
      },
      {
        title: "Idempotent workers",
        text: "Retries use idempotency keys so a double-click or crashed worker does not create duplicate CRM notes.",
      },
      {
        title: "Approval-minded high-risk actions",
        text: "Writes that email customers or alter billing fields require an explicit confirm step until error rates are boring.",
      },
    ],
    architecture:
      "Next.js admin UI over API routes. Prisma job and attempt models. Workers claim jobs with leasing. Zod validates payloads at the edge. Structured logs include job id for traceability.",
    implementation:
      "We implemented three high-frequency jobs first: contact sync, status reconciliation, and nightly digest. The console shows queue depth, last success, and failure reasons in plain language. Operators can pause a job type without redeploying.",
    tradeoffs: [
      "Did not introduce a heavy workflow engine—Postgres jobs were enough",
      "Limited historical retention of payloads to control storage and PII surface",
      "Deferred fancy charts in favor of a reliable table + filters",
    ],
    lessons: [
      "Visibility beats cleverness for ops trust",
      "Pause switches prevent 2 a.m. incidents from cascading",
      "Start with the jobs that fail noisily, not the ones that look impressive in demos",
    ],
    outcome:
      "Manual transfers dropped for the covered flows. Failures surface the same day with enough context to retry or escalate. The team gained a path to add jobs without inventing a new ops ritual each time.",
    future:
      "Candidates include webhook-driven triggers, richer dead-letter handling, and per-tenant concurrency budgets.",
    ctaLabel: "Talk about an ops console",
  },
  "phase-one-saas-foundation": {
    overview:
      "A B2B operations product needed a first public cut: real onboarding, role boundaries, and a shell that could accept billing later without a rewrite.",
    challenge:
      "The team had UI prototypes but no durable tenancy model. Demo accounts shared data accidentally. Content edits required developer deploys. Subscription thinking was postponed until it became a blocker for paid pilots.",
    constraints: [
      "Private beta within a fixed window",
      "Single region deploy acceptable",
      "Billing could stub; tenancy could not",
      "Founders needed to edit marketing and help content themselves",
    ],
    decisions: [
      {
        title: "Tenant id on every query path",
        text: "Membership and tenant scoping were enforced in data access helpers—not left to individual pages to remember.",
      },
      {
        title: "Separate marketing, app, and admin route groups",
        text: "Clear boundaries reduced the chance of leaking admin tools into customer sessions.",
      },
      {
        title: "Billing seam without billing UI",
        text: "Customer and plan fields exist. Checkout waits. The schema does not pretend money is handled when it is not.",
      },
    ],
    architecture:
      "Next.js + TypeScript. Supabase/Postgres for persistence. Auth.js for sessions. Structured homepage/blog/project content for the marketing surface. Feature flags gate incomplete modules.",
    implementation:
      "Phase one delivered invite-based onboarding, role-aware app shell, core operational workflow, and content editing for public pages. We documented how to add billing and reporting modules against the existing tenant model.",
    tradeoffs: [
      "Skipped multi-region and advanced SSO",
      "Used a pragmatic admin rather than a full internal tooling suite",
      "Accepted stubbed metering events for later analytics",
    ],
    lessons: [
      "Tenancy mistakes are expensive to unwind—do them early",
      "Content ownership unblocks marketing without blocking engineering",
      "A written list of non-goals keeps demos honest",
    ],
    outcome:
      "The team ran real onboarding demos on a system with proper boundaries. Later billing and reporting work has a place to land. Operators know which surfaces are customer-facing versus internal.",
    future:
      "Stripe checkout, usage reporting, and finer admin roles are natural phase-two items on the existing foundation.",
    ctaLabel: "Plan a SaaS foundation",
  },
}

export function getCaseStudyNarrative(slug: string) {
  return caseStudyNarratives[slug] ?? null
}
