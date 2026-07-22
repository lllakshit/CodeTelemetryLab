export type ServiceNarrative = {
  overview: string
  problems: string[]
  whoBenefits: string
  approach: { title: string; text: string }[]
  architecture: string
  stack: string[]
  security: string
  scaling: string
  challenges: string[]
  faqs: { question: string; answer: string }[]
  cta: { title: string; text: string; label: string }
}

const baseApproach = (
  discovery: string,
  build: string,
  harden: string,
): ServiceNarrative["approach"] => [
  { title: "Discovery", text: discovery },
  { title: "Design & architecture", text: build },
  { title: "Build, test, and handoff", text: harden },
]

export const serviceNarratives: Record<string, ServiceNarrative> = {
  "ai-development": {
    overview:
      "We build AI features that sit inside real products—intake assistants, classification pipelines, document helpers, and decision support—where correctness, permissions, and operator review matter more than a flashy demo.",
    problems: [
      "Manual review queues grow faster than headcount",
      "Prototype AI demos fail once they meet permissions, edge cases, or incomplete data",
      "Teams need evaluation and rollback plans before they widen access",
    ],
    whoBenefits:
      "Founders and product leads who already have a workflow and want AI to reduce friction without handing control to a black box.",
    approach: baseApproach(
      "We map the workflow, data sources, failure modes, and where a human must stay in the loop. Feasibility is judged against available data and review capacity—not model hype.",
      "We choose model providers, retrieval patterns, prompt systems, and tool calling boundaries. Architecture keeps AI outputs auditable and reversible.",
      "We ship behind feature flags, add logging and evaluation harnesses, document operator steps, and leave a clear path to expand coverage after the first release proves itself.",
    ),
    architecture:
      "Typical systems separate ingestion, retrieval or context assembly, model calls, validation, and persistence. Public surfaces never talk to model APIs without an application layer that enforces auth, rate limits, and redaction rules.",
    stack: ["TypeScript", "Next.js / Node APIs", "OpenAI or Anthropic APIs", "PostgreSQL", "Queue / worker patterns", "Observability hooks"],
    security:
      "Secrets stay server-side. Sensitive fields are filtered before prompts. Role checks gate who can trigger high-impact actions. Logs capture inputs and outcomes without dumping secrets into client storage.",
    scaling:
      "We start with the narrowest workflow that creates value, measure quality, then widen. Caching, batching, and asynchronous jobs come after the review loop is stable.",
    challenges: [
      "Hallucinated actions when tools are too open",
      "Cost spikes from unbounded context windows",
      "Operators distrusting outputs without evidence trails",
    ],
    faqs: [
      {
        question: "Do you train custom models?",
        answer:
          "Usually no for a first release. Most product needs are better served with strong prompting, retrieval, evaluation, and workflow design. Fine-tuning enters later when volume and labelled data justify it.",
      },
      {
        question: "How do you decide what should stay human-reviewed?",
        answer:
          "Anything that changes money, legal commitments, customer-facing decisions, or irreversible records starts with a review gate. Automation expands only after error rates and override patterns are understood.",
      },
      {
        question: "What does a first AI release usually include?",
        answer:
          "One primary workflow, clear success criteria, logging, an operator path for failures, and documentation so your team can run the feature without us in the room.",
      },
    ],
    cta: {
      title: "Have a workflow that should not stay manual?",
      text: "Describe the process, data sources, and who reviews exceptions. We will tell you what is ready for a first AI release—and what is not.",
      label: "Discuss an AI build",
    },
  },
  "ai-automation": {
    overview:
      "Automation work here means replacing brittle handoffs—spreadsheets, copy-paste between tools, and status chasing—with controlled workflows that log every step and keep humans where judgment is required.",
    problems: [
      "Status updates live in chat threads nobody can audit later",
      "The same intake data is typed into three systems",
      "Nightly cleanup scripts fail silently",
    ],
    whoBenefits:
      "Operations leads and agency owners who know the process intimately and need software that respects those rules instead of inventing new ones.",
    approach: baseApproach(
      "We walk the current process end to end: triggers, exceptions, SLAs, and tools already in use. Candidates for automation are ranked by frequency and risk.",
      "We design orchestration with explicit states—queued, waiting for review, completed, failed—so operators can see and intervene.",
      "We implement integrations, notifications, and fallbacks. Runbooks cover retries, partial failures, and how to pause a flow safely.",
    ),
    architecture:
      "Automations run as idempotent jobs with durable state. Webhooks and schedules feed a worker layer. Side effects (emails, CRM writes) are isolated so retries do not duplicate customer contact.",
    stack: ["Node.js workers", "Cron / queue", "CRM & email APIs", "Zod validation", "Postgres job tables", "Alerting"],
    security:
      "API credentials rotate through environment secrets. Each automation runs with the least privilege the vendor allows. Audit logs record who approved high-risk actions.",
    scaling:
      "Volume growth is handled with concurrency limits and backoff. We avoid fan-out patterns that hammer third-party rate limits until monitoring proves headroom.",
    challenges: [
      "Hidden exceptions that only senior staff know",
      "Vendor APIs that change without notice",
      "Over-automating a process that still needs judgment",
    ],
    faqs: [
      {
        question: "Will automation replace our ops team?",
        answer:
          "No. The goal is to remove repetitive movement of data so your team spends time on exceptions and customer judgment—not retyping the same fields.",
      },
      {
        question: "What if a job fails halfway?",
        answer:
          "Flows are designed with checkpoints. Failed steps surface in the console with enough context to retry or hand off manually without guessing what already happened.",
      },
    ],
    cta: {
      title: "Ready to map an automation candidate?",
      text: "Send the tools involved, how often the process runs, and where it breaks today.",
      label: "Scope an automation console",
    },
  },
  "llm-applications": {
    overview:
      "LLM applications we ship are grounded in your documents and systems—assistants, search over knowledge bases, and internal copilots—with permissions that match how your organization already works.",
    problems: [
      "Staff waste time hunting for the latest policy or SOP",
      "Generic chatbots invent answers outside your corpus",
      "Leadership wants AI help without leaking restricted content",
    ],
    whoBenefits:
      "Companies with a usable document corpus and clear roles who need answers tied to sources, not freeform chat.",
    approach: baseApproach(
      "We inventory sources, access rules, update cadence, and the questions people actually ask. Thin or stale corpora get fixed before model work begins.",
      "Retrieval, chunking, and citation patterns are designed first. The UI shows sources so users can verify.",
      "We evaluate answer quality on a fixed question set, then harden rate limits, redaction, and admin controls.",
    ),
    architecture:
      "Ingestion pipelines normalize documents into a searchable store. Query time assembles context under the caller’s permissions. Responses include source references. Admin tools manage sync and blocklists.",
    stack: ["Next.js", "Vector or hybrid search", "LLM APIs", "Object storage", "Auth roles", "Evaluation notebooks"],
    security:
      "Document ACLs are enforced before retrieval. Prompts never include data the user cannot already access. Admin actions are logged.",
    scaling:
      "Index rebuilds and incremental sync keep the corpus fresh. Caching covers repeated queries. We tune chunk sizes against measured answer quality, not guesswork.",
    challenges: [
      "Duplicate or conflicting documents",
      "Users expecting certainty where the corpus is silent",
      "Latency when context windows grow unchecked",
    ],
    faqs: [
      {
        question: "Do answers always cite sources?",
        answer:
          "Yes for production knowledge assistants. If the system cannot find support in the corpus, it should say so rather than invent an answer.",
      },
      {
        question: "Can this connect to Notion, Drive, or Confluence?",
        answer:
          "Yes when those systems have stable APIs and clear ownership. Connectors are built per source with sync status visible to admins.",
      },
    ],
    cta: {
      title: "Want an assistant that stays inside your knowledge base?",
      text: "Tell us what sources matter, who can see what, and which questions burn the most time today.",
      label: "Plan an LLM application",
    },
  },
  "ai-agents": {
    overview:
      "Agents here are constrained workers: they plan steps, call approved tools, and stop for review when the risk crosses a threshold you define.",
    problems: [
      "Multi-step busywork spans email, CRM, and internal tickets",
      "Open-ended agents take irreversible actions",
      "Nobody can explain why an agent did what it did",
    ],
    whoBenefits:
      "Product and ops teams that need multi-step assistance with an explicit tool allowlist and an audit trail.",
    approach: baseApproach(
      "We define the job, allowed tools, stop conditions, and escalation paths. Anything that spends money or emails customers starts gated.",
      "Agent graphs or state machines keep plans inspectable. Tool schemas are strict. Memory is intentional, not infinite.",
      "We test failure modes—missing data, tool timeouts, contradictory instructions—before widening autonomy.",
    ),
    architecture:
      "A planner proposes steps; an executor calls typed tools; a supervisor records state. High-impact tools require confirmation. Transcripts are stored for review.",
    stack: ["TypeScript agents", "Tool APIs", "Durable job state", "LLM providers", "Admin consoles"],
    security:
      "Tool credentials are scoped. Agents cannot invent new tools at runtime. Customer-facing sends require approval until confidence is proven.",
    scaling:
      "Concurrency is capped. Long-running work moves to queues. We measure success by completed jobs and override rates, not by how ‘autonomous’ the agent looks.",
    challenges: [
      "Prompt injection through untrusted documents",
      "Tool loops that burn budget",
      "Operators needing a kill switch",
    ],
    faqs: [
      {
        question: "How autonomous should the first agent be?",
        answer:
          "Conservative. Draft, classify, and prepare—then wait for a human on anything irreversible. Autonomy widens after override patterns are boring.",
      },
    ],
    cta: {
      title: "Have a multi-step workflow ready for a constrained agent?",
      text: "Share the steps, tools, and where a human must stay in control.",
      label: "Design an agent workflow",
    },
  },
  "custom-software-development": {
    overview:
      "Custom software means purpose-built systems for how your team actually works—portals, admin tools, domain workflows—when off-the-shelf products force too many compromises.",
    problems: [
      "Spreadsheets became the system of record",
      "Vendors cannot model your edge cases",
      "Internal tools were patched until nobody trusts them",
    ],
    whoBenefits:
      "Growing companies with a stable process that needs software shaped around it—not another generic CRM configuration.",
    approach: baseApproach(
      "We document users, permissions, data ownership, and the moments where mistakes hurt. Scope is cut to the first workflow that must be trustworthy.",
      "Domain models, APIs, and UI surfaces are designed together so the data model matches how people talk about the work.",
      "We ship iteratively with reviewable pull requests, tests around critical paths, and a handoff package your engineers can extend.",
    ),
    architecture:
      "Clear boundaries between public UI, authenticated app, APIs, and jobs. Domain logic stays out of components. Migrations are versioned. Feature work lands behind reviewable modules.",
    stack: ["TypeScript", "Next.js or Nest/FastAPI", "PostgreSQL", "Auth", "Object storage", "CI"],
    security:
      "Authn/authz are first-class. Input validation is shared between client and server. Sensitive actions leave audit events.",
    scaling:
      "We design for the known load plus headroom, not imaginary millions of users. Indexes, pagination, and background work are added where measurements show need.",
    challenges: [
      "Stakeholders wanting every exception in version one",
      "Legacy data that needs cleaning before migration",
      "Unclear ownership after launch",
    ],
    faqs: [
      {
        question: "Build vs buy?",
        answer:
          "Buy when a product covers 80% of the workflow cleanly. Build when the remaining 20% is your advantage—or when vendor lock-in would cost more than ownership.",
      },
    ],
    cta: {
      title: "Need software shaped around your process?",
      text: "Outline the workflow, who uses it daily, and what ‘done’ means for the first release.",
      label: "Start a custom software brief",
    },
  },
  "saas-development": {
    overview:
      "SaaS foundations we build separate tenancy, auth, billing readiness, and operations early—so the first customers do not force a rewrite six months later.",
    problems: [
      "MVP auth was bolted on and cannot support roles",
      "Tenant data boundaries are fuzzy",
      "Billing and admin tools were postponed until they became emergencies",
    ],
    whoBenefits:
      "Founders launching a B2B product who need a credible first release and a path to subscriptions, roles, and support tooling.",
    approach: baseApproach(
      "We define tenant model, roles, launch surface, and what can wait for phase two. Billing can be stubbed, but tenancy cannot.",
      "We design auth, multi-tenant data rules, admin surfaces, and content/ops paths that match the product story.",
      "We ship onboarding, core workflows, and observability. Documentation covers how to add the next module without collapsing boundaries.",
    ),
    architecture:
      "Tenant identifiers travel with every query. Shared services stay explicit. Public marketing, authenticated app, and admin often live as clear route groups with shared libraries—not one tangled tree.",
    stack: ["Next.js", "TypeScript", "Postgres / Supabase", "Auth.js or equivalent", "Stripe-ready hooks", "Vercel or similar"],
    security:
      "Tenant isolation is tested. Session handling follows current best practice. Admin routes are gated separately from customer roles.",
    scaling:
      "First scale problems are usually slow queries and noisy jobs—not Kubernetes. We instrument early and fix what the metrics show.",
    challenges: [
      "Premature multi-region complexity",
      "Blurry product scope during fundraising demos",
      "Skipping admin tools until support is drowning",
    ],
    faqs: [
      {
        question: "Can billing wait?",
        answer:
          "Often yes for a private beta. Tenancy, roles, and auditability should not wait. We leave clean seams for Stripe or similar when you are ready.",
      },
    ],
    cta: {
      title: "Building a SaaS that needs a solid first cut?",
      text: "Share the tenant model, must-have workflows, and launch date.",
      label: "Plan a SaaS foundation",
    },
  },
  "mvp-development": {
    overview:
      "MVP work here is the smallest release that proves a workflow with real users—not a pile of half-finished features.",
    problems: [
      "Roadmaps try to ship everything before learning anything",
      "Demos look finished while ops paths are missing",
      "Technical debt is accepted without knowing which debt is expensive",
    ],
    whoBenefits:
      "Founders validating a product hypothesis who still need auth, data integrity, and a path to the next release.",
    approach: baseApproach(
      "We cut scope ruthlessly around one primary user journey and the metrics that prove it works.",
      "Architecture stays simple but not disposable—clear modules, typed APIs, and a migration path.",
      "We launch with monitoring, basic admin visibility, and a written list of deliberate non-goals.",
    ),
    architecture:
      "Monolith-first is fine when boundaries are clean. We avoid microservices until the domain and team size demand them.",
    stack: ["Next.js", "TypeScript", "Postgres", "Auth", "Hosted deploys"],
    security: "Auth and validation are included in the MVP definition—not phase two.",
    scaling: "We document what will need attention at 10× usage so the next phase is planned, not panicked.",
    challenges: ["Scope creep from demos", "Skipping error states", "No owner for content after launch"],
    faqs: [
      {
        question: "How long do MVPs take?",
        answer:
          "Many focused MVPs land in two to eight weeks depending on integrations and content readiness. Timeline honesty beats optimistic slides.",
      },
    ],
    cta: {
      title: "Need an MVP that can be extended?",
      text: "Describe the one journey that must work and what you are willing to leave out.",
      label: "Scope an MVP",
    },
  },
  "full-stack-development": {
    overview:
      "Full-stack engagements cover the UI people touch and the APIs, data, and jobs underneath—owned by one team so seams do not become someone else’s problem.",
    problems: [
      "Frontend and backend disagree on contracts",
      "Deployments require tribal knowledge",
      "Bugs bounce between vendors",
    ],
    whoBenefits: "Teams that want one accountable delivery path from screen to database.",
    approach: baseApproach(
      "Shared acceptance criteria across UI and API. Contracts are written before parallel work expands.",
      "Typed clients, shared validation, and environment parity reduce ‘works on my machine’ gaps.",
      "CI, previews, and runbooks keep releases boring.",
    ),
    architecture: "Vertical slices for features. Shared libraries for auth and errors. Background work isolated from request paths.",
    stack: ["TypeScript", "React/Next.js", "Node or Python APIs", "PostgreSQL", "CI/CD"],
    security: "Threat modeling for auth, uploads, and admin. Dependency updates are part of the cadence.",
    scaling: "Profile before partitioning. Cache and queues where latency or load demands it.",
    challenges: ["Split ownership without contracts", "Environment drift", "Missing observability"],
    faqs: [
      {
        question: "Do you prefer Node or Python on the backend?",
        answer:
          "Node when the product is API- and realtime-heavy in a TypeScript shop. Python when AI, data, or scientific workflows dominate. The domain decides.",
      },
    ],
    cta: {
      title: "Need one team across the stack?",
      text: "Tell us the surfaces involved and where coordination breaks today.",
      label: "Discuss full-stack delivery",
    },
  },
  "react-development": {
    overview:
      "React work focuses on maintainable interfaces—design systems, accessible forms, and data-heavy views that stay fast as features accumulate.",
    problems: [
      "Component sprawl without a system",
      "Forms that fight the server",
      "Performance cliffs on content-heavy pages",
    ],
    whoBenefits: "Product teams shipping dashboards, portals, and marketing surfaces that must stay coherent.",
    approach: baseApproach(
      "We audit current UI debt, accessibility gaps, and the worst user journeys.",
      "We establish patterns for data fetching, forms, and state—then rebuild the high-traffic paths.",
      "We leave Storybook or equivalent examples where the team needs them.",
    ),
    architecture: "Server components where they help; client islands where interaction requires them. Shared UI primitives beat one-off CSS.",
    stack: ["React", "TypeScript", "Next.js when needed", "Tailwind or existing DS", "Testing Library"],
    security: "XSS-safe rendering, careful handling of HTML content, and auth-aware UI states.",
    scaling: "Code splitting and list virtualization when datasets grow. Measure with real devices.",
    challenges: ["Design inconsistency", "Overusing client state", "Ignoring keyboard users"],
    faqs: [
      {
        question: "Can you work inside our existing design system?",
        answer: "Yes. We prefer extending what you have over introducing a second visual language.",
      },
    ],
    cta: {
      title: "React surfaces that need discipline?",
      text: "Point us at the journeys that feel slow, inconsistent, or hard to change.",
      label: "Improve your React app",
    },
  },
  "nextjs-development": {
    overview:
      "Next.js projects we take on use the App Router deliberately—routing, caching, and server/client boundaries chosen for the product, not for fashion.",
    problems: [
      "Pages ship without metadata or clear ownership",
      "Client bundles grow without budget",
      "Preview and production environments diverge",
    ],
    whoBenefits: "Teams building product + marketing + light ops in one codebase who need structure.",
    approach: baseApproach(
      "Route map, rendering strategy, and content ownership come first.",
      "We implement layouts, data access patterns, and forms with shared validation.",
      "Deployments include previews, env hygiene, and basic monitoring.",
    ),
    architecture: "Route groups for marketing, app, and admin. Server actions or API routes with clear boundaries. Caching policies documented.",
    stack: ["Next.js", "TypeScript", "React", "Vercel or Node hosting", "Postgres"],
    security: "Auth on server components and route handlers. Secrets never leak to the client bundle.",
    scaling: "ISR/static where content is stable; dynamic where personalization requires it. Avoid accidental dynamic rendering.",
    challenges: ["Misusing client components", "Cache confusion", "Large MDX without structure"],
    faqs: [
      {
        question: "App Router or Pages Router?",
        answer:
          "New work defaults to App Router. We maintain Pages Router apps when migration cost exceeds benefit.",
      },
    ],
    cta: {
      title: "Need a Next.js codebase that stays navigable?",
      text: "Share the current structure and the next release you are trying to land.",
      label: "Talk Next.js delivery",
    },
  },
  "nodejs-development": {
    overview:
      "Node.js backends for product APIs, webhooks, and workers—typed, validated, and observable.",
    problems: [
      "Webhook handlers that fail quietly",
      "Unvalidated payloads corrupting data",
      "Cron jobs without ownership",
    ],
    whoBenefits: "Teams that need reliable APIs and integrations beside a TypeScript frontend.",
    approach: baseApproach(
      "Contract design and error taxonomy before endpoints proliferate.",
      "Handlers stay thin; domain services own rules; jobs are idempotent.",
      "We add structured logging and health checks as part of done.",
    ),
    architecture: "HTTP API + worker processes. Shared schema packages. Outbox patterns when dual writes are risky.",
    stack: ["Node.js", "TypeScript", "Zod", "Postgres", "Queues"],
    security: "Auth middleware, rate limits, and careful webhook signature verification.",
    scaling: "Horizontal workers with concurrency caps. Connection pooling for databases.",
    challenges: ["Chatty endpoints", "Missing retries", "Secret sprawl"],
    faqs: [
      {
        question: "NestJS or lighter frameworks?",
        answer:
          "Nest when the team wants structure and DI. Lighter stacks when the surface area is small and speed matters. We match the team, not a dogma.",
      },
    ],
    cta: {
      title: "APIs or workers that need hardening?",
      text: "Describe the consumers, SLAs, and failure modes you already see.",
      label: "Strengthen your Node services",
    },
  },
  "python-development": {
    overview:
      "Python services for AI pipelines, data processing, and APIs where the ecosystem fits—FastAPI, workers, and notebooks that graduate into production code.",
    problems: [
      "Notebooks that became production without tests",
      "Batch jobs without monitoring",
      "AI experiments without packaging",
    ],
    whoBenefits: "Teams with data/AI workloads that need production packaging without losing iteration speed.",
    approach: baseApproach(
      "Separate experimentation from serving. Define inputs, outputs, and SLAs.",
      "Package services with typed models, config, and dependency pins.",
      "Add tests around parsing and critical transforms before widening traffic.",
    ),
    architecture: "API layer for sync work; workers for heavy jobs; shared libraries for schemas.",
    stack: ["Python", "FastAPI", "Pydantic", "Workers", "Postgres or object storage"],
    security: "Dependency scanning, secret management, and least-privilege cloud roles.",
    scaling: "Batch sizing and queue depth tuned to data volume. GPU choices only when measured need exists.",
    challenges: ["Environment drift", "Heavy dependencies", "Silent data quality issues"],
    faqs: [
      {
        question: "Can Python services sit beside a Next.js app?",
        answer: "Yes. We often keep product UI in Next.js and specialized pipelines in Python behind clear HTTP or queue contracts.",
      },
    ],
    cta: {
      title: "Python workloads ready for production packaging?",
      text: "Share the notebook or script and the reliability bar you need.",
      label: "Productionize Python services",
    },
  },
  "workflow-automation": {
    overview:
      "Workflow automation connects systems with explicit states—approvals, escalations, and notifications that ops can see and trust.",
    problems: [
      "Approvals live in inboxes",
      "Handoffs stall without owners",
      "No single view of process health",
    ],
    whoBenefits: "Ops and delivery teams coordinating multi-step work across tools.",
    approach: baseApproach(
      "State machine the process on paper first—including unhappy paths.",
      "Implement transitions with permissions and notifications.",
      "Dashboards show stuck items and aging work.",
    ),
    architecture: "Durable workflow state in your database or a workflow engine. Integrations are adapters, not the source of truth.",
    stack: ["TypeScript/Node", "Postgres", "Email/Slack APIs", "Cron", "Admin UI"],
    security: "Approval actions require auth. Impersonation is logged.",
    scaling: "Partition by tenant or team when queues grow. Archive completed work.",
    challenges: ["Undefined exception paths", "Too many notification channels", "No SLA owner"],
    faqs: [
      {
        question: "Zapier vs custom workflows?",
        answer:
          "Zapier is fine for low-risk glue. Custom workflows win when auditability, complex branching, or deep product integration matters.",
      },
    ],
    cta: {
      title: "Process stuck in inboxes?",
      text: "Sketch the states and who must approve each transition.",
      label: "Design a workflow system",
    },
  },
  "crm-development": {
    overview:
      "CRM development means fitting sales and success processes into software you control—pipelines, activities, and integrations that match how your team sells.",
    problems: [
      "Generic CRMs ignore your stages",
      "Reps keep parallel spreadsheets",
      "Attribution is guesswork",
    ],
    whoBenefits: "Teams whose sales motion is specific enough that forcing Salesforce/HubSpot customization costs more than ownership.",
    approach: baseApproach(
      "Map stages, required fields, and handoffs to success or delivery.",
      "Model entities and permissions. Integrate email/calendar carefully.",
      "Ship reporting that leadership actually opens.",
    ),
    architecture: "Lead/account/opportunity models with history. Activity timelines. Integration workers for sync.",
    stack: ["Next.js", "Postgres", "Email APIs", "Auth roles", "Export tools"],
    security: "PII handling, role-based access, and export controls.",
    scaling: "Indexes on pipeline queries. Archive inactive records thoughtfully.",
    challenges: ["Dirty historical data", "Rep adoption", "Over-customizing stage names"],
    faqs: [
      {
        question: "Build a CRM or extend HubSpot?",
        answer:
          "Extend when your motion fits. Build when stages, portals, or industry data models fight the vendor every week.",
      },
    ],
    cta: {
      title: "Need a CRM that matches your motion?",
      text: "Share stages, required fields, and systems that must sync.",
      label: "Scope CRM work",
    },
  },
  "api-development": {
    overview:
      "API development focuses on contracts teams can rely on—versioning, validation, auth, and documentation that stays true to production behavior.",
    problems: [
      "Breaking changes without notice",
      "Undocumented error shapes",
      "Clients reimplementing business rules",
    ],
    whoBenefits: "Product teams exposing capabilities to mobile apps, partners, or internal services.",
    approach: baseApproach(
      "Consumers and use cases define the contract. Errors get a taxonomy.",
      "We implement auth, pagination, idempotency keys where needed, and examples.",
      "Contract tests and changelog discipline protect clients.",
    ),
    architecture: "Resource-oriented or RPC-style based on clients. Gateway concerns stay separate from domain services.",
    stack: ["Node or FastAPI", "OpenAPI", "JWT/API keys", "Postgres", "CI contract tests"],
    security: "Scoped credentials, rate limits, and careful CORS. Partner keys rotate.",
    scaling: "Caching and pagination first. Graph complexity only when justified.",
    challenges: ["Hidden N+1 queries", "Chatty mobile clients", "Missing idempotency"],
    faqs: [
      {
        question: "REST or GraphQL?",
        answer:
          "REST/JSON for most product APIs. GraphQL when many clients need flexible selection and the team can own the complexity.",
      },
    ],
    cta: {
      title: "APIs that partners or apps depend on?",
      text: "List consumers, SLAs, and the pain from the last breaking change.",
      label: "Improve your API layer",
    },
  },
  "business-automation": {
    overview:
      "Business automation targets measurable operational drag—intake, routing, reporting, and reconciliations—with systems your staff can supervise.",
    problems: [
      "Month-end reconciliations eat weeks",
      "Routing rules live in one person’s head",
      "Reports are rebuilt manually every Monday",
    ],
    whoBenefits: "Operators who can describe the rules precisely and want software to enforce them.",
    approach: baseApproach(
      "Quantify frequency, error cost, and exception rate before coding.",
      "Encode rules visibly—tables and configs over buried conditionals when business owns changes.",
      "Ship with dashboards and override paths.",
    ),
    architecture: "Rules engine or well-structured services; audit log; human override UI.",
    stack: ["TypeScript", "Postgres", "Scheduled jobs", "Exports", "Notifications"],
    security: "Segregation of duties for financial flows. Dual control where needed.",
    scaling: "Batch windows and incremental processing for large datasets.",
    challenges: ["Undocumented tribal rules", "Changing policy mid-build", "No data owner"],
    faqs: [
      {
        question: "How do you avoid automating a bad process?",
        answer:
          "We challenge steps that exist only because of historical accident. Automation should encode the process you want—not fossilize the broken one.",
      },
    ],
    cta: {
      title: "Know the process that burns the most hours?",
      text: "Walk us through it once—including the messy exceptions.",
      label: "Automate with oversight",
    },
  },
  "startup-product-development": {
    overview:
      "Startup product development pairs speed with guardrails—enough architecture to survive success, not enough ceremony to stall learning.",
    problems: [
      "Founders oscillating between perfection and chaos",
      "No instrumentation on the core funnel",
      "Technical choices that block the next hire",
    ],
    whoBenefits: "Early teams that need a partner who can ship and explain tradeoffs clearly.",
    approach: baseApproach(
      "Agree on the learning goal and the non-negotiable quality bar.",
      "Build the thinnest vertical slice with auth, analytics events, and admin basics.",
      "Leave a roadmap of intentional debt.",
    ),
    architecture: "Simple deployable unit, clear modules, documented assumptions.",
    stack: ["Next.js", "TypeScript", "Postgres", "Auth", "Analytics events"],
    security: "Basics done right from day one—auth, validation, backups.",
    scaling: "Plan the first scale cliff; do not build for imaginary millions.",
    challenges: ["Changing ICP mid-build", "Design without content", "No decision owner"],
    faqs: [
      {
        question: "Will you work with a technical co-founder?",
        answer: "Yes. We collaborate cleanly with in-house engineers and leave a codebase they can own.",
      },
    ],
    cta: {
      title: "Raising or launching and need a disciplined build partner?",
      text: "Share the product hypothesis and the date that actually matters.",
      label: "Partner on the first release",
    },
  },
  "website-development": {
    overview:
      "Websites we build are information systems—clear structure, accessible UI, forms that store leads, and content your team can update without a developer ticket for every comma.",
    problems: [
      "Marketing sites that cannot be edited safely",
      "Forms that only email and lose data",
      "Inconsistent pages that confuse buyers",
    ],
    whoBenefits: "B2B teams whose site is part of the sales conversation and must stay accurate.",
    approach: baseApproach(
      "IA, messaging hierarchy, and conversion paths before visual polish.",
      "Componentized pages with a content model and lead capture that persists.",
      "Performance, accessibility, and handoff docs for editors.",
    ),
    architecture: "Marketing routes separate from app routes when needed. CMS or structured content. Lead API with spam controls.",
    stack: ["Next.js", "TypeScript", "CMS or MDX", "Forms API", "Analytics"],
    security: "Form rate limits, honeypots, and careful third-party scripts.",
    scaling: "Static generation where content is stable; on-demand revalidation for updates.",
    challenges: ["Unclear offers", "Too many CTAs", "Stock photography theater"],
    faqs: [
      {
        question: "Do you write the copy?",
        answer:
          "We structure and edit for clarity. Your domain experts own claims. We will not invent metrics or customer quotes.",
      },
    ],
    cta: {
      title: "Need a site that supports real sales conversations?",
      text: "Bring your offer, audiences, and the pages that must exist at launch.",
      label: "Plan the website build",
    },
  },
  "enterprise-software": {
    overview:
      "Enterprise software work emphasizes roles, auditability, and change management—systems operators can defend in a review meeting.",
    problems: [
      "Shadow IT spreadsheets",
      "Access reviews fail",
      "Integrations lack ownership",
    ],
    whoBenefits: "Organizations with compliance needs and multiple stakeholder groups.",
    approach: baseApproach(
      "Stakeholder map, RACI, and non-functional requirements early.",
      "Role models, audit events, and admin tooling designed with the workflow.",
      "Training materials and staged rollouts.",
    ),
    architecture: "Clear service boundaries, SSO readiness, and export/reporting paths.",
    stack: ["TypeScript or Java/Python as fit", "SSO", "Postgres", "Audit logs", "Admin consoles"],
    security: "Least privilege, retention policies, and documented controls.",
    scaling: "Tenancy or org-unit partitioning as the org chart demands.",
    challenges: ["Conflicting stakeholders", "Legacy data", "Change fatigue"],
    faqs: [
      {
        question: "Do you handle SSO?",
        answer: "Yes—SAML/OIDC integrations are common for enterprise rollouts when identity providers are ready.",
      },
    ],
    cta: {
      title: "Internal systems that need auditability?",
      text: "Describe users, roles, and the review you need to pass.",
      label: "Discuss enterprise delivery",
    },
  },
}

export function getServiceNarrative(slug: string): ServiceNarrative | null {
  return serviceNarratives[slug] ?? null
}
