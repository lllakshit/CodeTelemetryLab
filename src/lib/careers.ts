export type JobOpening = {
  slug: string
  title: string
  team: "Engineering" | "AI & Automation" | "Design" | "Delivery" | "Growth" | "Content & SEO"
  location: string
  workMode: "Remote" | "Hybrid" | "On-site"
  employmentType: "Full-time" | "Contract" | "Internship"
  experience: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  niceToHave: string[]
}

/** Shown when someone applies without a specific role in mind. */
export const GENERAL_APPLICATION: JobOpening = {
  slug: "general-application",
  title: "General application",
  team: "Engineering",
  location: "Remote or Jaipur, India",
  workMode: "Remote",
  employmentType: "Full-time",
  experience: "Any level",
  summary:
    "Do not see a role that fits? Tell us what you build best and where you want to grow. We read every application and reach out when a matching role opens.",
  responsibilities: [],
  requirements: [],
  niceToHave: [],
}

export const jobOpenings: JobOpening[] = [
  {
    slug: "senior-full-stack-engineer-nextjs",
    title: "Senior Full-Stack Engineer (Next.js & TypeScript)",
    team: "Engineering",
    location: "Remote (India) · Jaipur hybrid option",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "5+ years",
    summary:
      "Own the delivery of customer-facing SaaS products and internal platforms for US and Canadian clients, from data model to deployed release.",
    responsibilities: [
      "Design and build production features across Next.js, React, Node.js, and PostgreSQL.",
      "Turn client briefs into scoped, estimated, and shippable increments with clear trade-offs.",
      "Review code, mentor engineers, and keep release quality high.",
      "Work directly with clients during discovery, demos, and handoff.",
    ],
    requirements: [
      "Strong TypeScript and React fundamentals with real production Next.js experience.",
      "Comfortable designing relational schemas, APIs, and authentication flows.",
      "Clear written English for client communication and documentation.",
    ],
    niceToHave: ["Supabase or Prisma experience", "Stripe or subscription billing integration", "Experience leading a small team"],
  },
  {
    slug: "ai-llm-engineer",
    title: "AI / LLM Engineer",
    team: "AI & Automation",
    location: "Remote (India) · Jaipur hybrid option",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    summary:
      "Build retrieval, agent, and workflow systems that clients run in production, with evaluation and cost control from day one.",
    responsibilities: [
      "Design LLM-powered features: retrieval-augmented generation, tool use, and multi-step agents.",
      "Build evaluation harnesses and guardrails so quality is measured, not guessed.",
      "Integrate model providers behind stable internal interfaces with cost and latency budgets.",
      "Document prompts, data flows, and failure modes for client teams.",
    ],
    requirements: [
      "Hands-on experience shipping LLM features with Python or TypeScript.",
      "Working knowledge of embeddings, vector search, and prompt design.",
      "Pragmatic approach to testing non-deterministic systems.",
    ],
    niceToHave: ["LangGraph or similar orchestration", "Model Context Protocol (MCP) servers", "Open-source contributions to AI tooling"],
  },
  {
    slug: "backend-engineer-python-fastapi",
    title: "Backend Engineer (Python & FastAPI)",
    team: "Engineering",
    location: "Remote (India)",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    summary:
      "Build reliable APIs, background jobs, and data pipelines that sit behind AI and automation products.",
    responsibilities: [
      "Design async APIs and service boundaries with FastAPI and PostgreSQL.",
      "Own queues, schedulers, and integrations with third-party systems.",
      "Add observability, tests, and CI so releases are boring.",
    ],
    requirements: [
      "Solid Python with async programming experience.",
      "Strong SQL, indexing, and query-tuning skills.",
      "Experience with Docker and CI/CD pipelines.",
    ],
    niceToHave: ["Redis or message-queue experience", "OpenTelemetry instrumentation", "Temporal or similar workflow engines"],
  },
  {
    slug: "automation-integration-engineer",
    title: "Automation & Integration Engineer",
    team: "AI & Automation",
    location: "Remote (India) · Jaipur hybrid option",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "2+ years",
    summary:
      "Connect CRMs, billing tools, and internal systems so client teams stop copying data by hand.",
    responsibilities: [
      "Build and maintain integrations with CRMs, payment providers, email, and spreadsheets.",
      "Design idempotent webhooks, retries, and monitoring for business-critical workflows.",
      "Map client processes and turn them into documented, automated flows.",
    ],
    requirements: [
      "Experience with REST APIs, webhooks, and authentication schemes such as OAuth.",
      "Comfort with JavaScript or Python scripting and JSON data handling.",
      "Attention to failure handling, not only the happy path.",
    ],
    niceToHave: ["n8n, Make, or Zapier experience", "HubSpot, Salesforce, or Zoho integrations", "Lemon Squeezy, Stripe, or PayPal integrations"],
  },
  {
    slug: "flutter-mobile-developer",
    title: "Flutter Mobile Developer",
    team: "Engineering",
    location: "Remote (India)",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "2+ years",
    summary:
      "Ship cross-platform mobile apps for operations teams and consumer products, backed by the same APIs as our web platforms.",
    responsibilities: [
      "Build and maintain Flutter apps for Android and iOS.",
      "Integrate push notifications, authentication, and offline-friendly data handling.",
      "Collaborate with backend and design to keep behavior consistent across platforms.",
    ],
    requirements: [
      "Production experience with Flutter and Dart.",
      "Understanding of state management and REST API integration.",
      "Experience publishing to the Play Store or App Store.",
    ],
    niceToHave: ["Firebase Cloud Messaging", "CI for mobile builds", "Native module experience"],
  },
  {
    slug: "devops-cloud-engineer-aws",
    title: "DevOps & Cloud Engineer (AWS)",
    team: "Engineering",
    location: "Remote (India)",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    summary:
      "Make deployments repeatable, secure, and observable across the client platforms we build and maintain.",
    responsibilities: [
      "Own CI/CD pipelines, environments, secrets handling, and infrastructure as code.",
      "Set up monitoring, alerting, backups, and disaster-recovery runbooks.",
      "Review architecture for cost, security, and scaling risks.",
    ],
    requirements: [
      "Hands-on AWS experience (compute, networking, storage, IAM).",
      "Docker and GitHub Actions or comparable CI tooling.",
      "Security-minded approach to access and secrets.",
    ],
    niceToHave: ["Kubernetes", "Terraform or Pulumi", "Vercel and Supabase operations"],
  },
  {
    slug: "qa-automation-engineer",
    title: "QA Automation Engineer",
    team: "Delivery",
    location: "Jaipur, India (hybrid)",
    workMode: "Hybrid",
    employmentType: "Full-time",
    experience: "2+ years",
    summary:
      "Protect release quality with automated end-to-end checks and clear acceptance criteria on every client project.",
    responsibilities: [
      "Write and maintain end-to-end tests with Playwright or similar tools.",
      "Turn client requirements into testable acceptance criteria.",
      "Run regression passes before each release and report issues clearly.",
    ],
    requirements: [
      "Experience automating browser tests and API tests.",
      "Good bug-report writing and reproduction skills.",
      "Basic understanding of CI pipelines.",
    ],
    niceToHave: ["Accessibility testing", "Performance testing", "Mobile app testing"],
  },
  {
    slug: "product-designer-ui-ux",
    title: "Product Designer (UI/UX)",
    team: "Design",
    location: "Remote (India) · Jaipur hybrid option",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    summary:
      "Design clear, restrained interfaces for dashboards, portals, and marketing sites, and see them through to shipped code.",
    responsibilities: [
      "Run discovery, map user flows, and prototype interfaces in Figma.",
      "Maintain design systems that engineers can build from.",
      "Review shipped work for fidelity, accessibility, and responsive behavior.",
    ],
    requirements: [
      "Portfolio showing complex product or dashboard design, not only landing pages.",
      "Strong typography, layout, and information hierarchy skills.",
      "Ability to explain design decisions to non-designers.",
    ],
    niceToHave: ["Front-end implementation skills in React or Tailwind", "Motion and micro-interaction design", "Accessibility (WCAG) experience"],
  },
  {
    slug: "technical-project-manager",
    title: "Technical Project Manager",
    team: "Delivery",
    location: "Remote (India) · overlap with US or Canada hours",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "4+ years",
    summary:
      "Keep client projects scoped, on schedule, and honest: clear plans, visible risks, and calm communication.",
    responsibilities: [
      "Lead discovery, scoping, and sprint planning with clients and engineers.",
      "Track delivery, manage change requests, and report progress weekly.",
      "Facilitate demos, handoffs, and post-launch support plans.",
    ],
    requirements: [
      "Experience managing software projects with distributed teams.",
      "Strong written and spoken English.",
      "Comfortable discussing technical trade-offs with engineers.",
    ],
    niceToHave: ["Experience with agency or consulting delivery", "Jira, Linear, or ClickUp", "Technical background"],
  },
  {
    slug: "business-development-executive-us-canada",
    title: "Business Development Executive (US & Canada)",
    team: "Growth",
    location: "Remote (India) · US or Canada working hours",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "2+ years",
    summary:
      "Open and qualify conversations with founders and operations leaders who need custom software, AI, or automation.",
    responsibilities: [
      "Research target accounts and run thoughtful outbound across email and LinkedIn.",
      "Qualify inbound inquiries and prepare scoped proposals with the delivery team.",
      "Keep the CRM accurate and report pipeline weekly.",
    ],
    requirements: [
      "Experience selling services or software to US or Canadian buyers.",
      "Excellent written English and a consultative approach.",
      "Comfort learning technical topics well enough to ask good questions.",
    ],
    niceToHave: ["Experience selling to startups or SMBs", "CRM tools such as HubSpot", "Prior agency experience"],
  },
  {
    slug: "seo-content-strategist",
    title: "SEO & Content Strategist",
    team: "Content & SEO",
    location: "Remote (India) · Jaipur hybrid option",
    workMode: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    summary:
      "Plan and edit the engineering-first content that brings qualified visitors to the site and into the contact form.",
    responsibilities: [
      "Own the keyword strategy, editorial calendar, and on-page SEO for the blog and service pages.",
      "Edit technical drafts for accuracy, clarity, and search intent.",
      "Report on rankings, traffic, and lead quality using Search Console and analytics.",
    ],
    requirements: [
      "Proven results growing organic traffic for a B2B or technology site.",
      "Strong editing skills and technical curiosity.",
      "Working knowledge of technical SEO and structured data.",
    ],
    niceToHave: ["Experience with Next.js sites", "Digital PR and link building", "Data-analysis skills"],
  },
  {
    slug: "technical-writer-developer-advocate",
    title: "Technical Writer & Developer Advocate",
    team: "Content & SEO",
    location: "Remote (India)",
    workMode: "Remote",
    employmentType: "Contract",
    experience: "2+ years",
    summary:
      "Write case studies, engineering notes, and client documentation that explain how we build and operate software.",
    responsibilities: [
      "Turn project work into accurate case studies and engineering articles.",
      "Write onboarding guides, API references, and runbooks for client teams.",
      "Work with engineers to review drafts for technical correctness.",
    ],
    requirements: [
      "Portfolio of technical writing, documentation, or developer content.",
      "Ability to read code and understand system design.",
      "Careful, plain-language writing style.",
    ],
    niceToHave: ["Developer background", "Diagramming skills", "Experience with MDX or docs-as-code"],
  },
  {
    slug: "client-onboarding-success-manager",
    title: "Client Onboarding & Success Manager",
    team: "Delivery",
    location: "Jaipur, India (hybrid) · US or Canada overlap",
    workMode: "Hybrid",
    employmentType: "Full-time",
    experience: "2+ years",
    summary:
      "Make the first weeks with a new client smooth, and keep long-term accounts healthy after launch.",
    responsibilities: [
      "Run kickoff, access setup, and expectations for new engagements.",
      "Check in on delivery health and surface risks early.",
      "Coordinate maintenance plans, renewals, and upsell conversations with the team.",
    ],
    requirements: [
      "Experience in client success, account management, or delivery coordination.",
      "Strong communication and organization skills.",
      "Comfort with US or Canadian time zones when needed.",
    ],
    niceToHave: ["Experience in a software agency", "Knowledge of SaaS metrics", "Ticketing and support tools"],
  },
  {
    slug: "software-engineering-intern-full-stack",
    title: "Software Engineering Intern (Full-Stack)",
    team: "Engineering",
    location: "Jaipur, India (on-site or hybrid)",
    workMode: "On-site",
    employmentType: "Internship",
    experience: "Students and recent graduates",
    summary:
      "Learn by shipping: work with senior engineers on real client features, reviews, and releases for six months.",
    responsibilities: [
      "Build small, scoped features and fixes under mentorship.",
      "Write tests and documentation alongside code.",
      "Join standups, demos, and code reviews.",
    ],
    requirements: [
      "Working knowledge of JavaScript or TypeScript and React.",
      "Basic understanding of Git, REST APIs, and databases.",
      "A public project, GitHub profile, or portfolio we can look at.",
    ],
    niceToHave: ["Open-source contributions", "Python experience", "Previous internship or freelance work"],
  },
]

export const jobTeams = Array.from(new Set(jobOpenings.map((job) => job.team)))

export function getJobBySlug(slug: string) {
  if (slug === GENERAL_APPLICATION.slug) return GENERAL_APPLICATION
  return jobOpenings.find((job) => job.slug === slug) ?? null
}

export const careerBenefits = [
  { title: "Real client work", description: "Ship production software for US and Canadian teams, not demo projects." },
  { title: "Flexible, remote-first", description: "Most roles are remote within India, with a Jaipur hybrid option." },
  { title: "Senior mentorship", description: "Code review, design review, and written feedback on every project." },
  { title: "Learning budget", description: "Time and support for certifications, conferences, and open-source work." },
  { title: "Clear ownership", description: "Small teams, direct client contact, and room to own outcomes." },
  { title: "Honest process", description: "Written scopes, calm schedules, and no heroics as a delivery plan." },
]
