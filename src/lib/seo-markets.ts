export type SeoService = {
  slug: string
  name: string
  shortName: string
  primaryKeyword: string
  secondaryKeywords: string[]
  description: string
  outcomes: string[]
  deliverables: string[]
  faqs: { question: string; answer: string }[]
  relatedSlugs: string[]
}

export type SeoCity = {
  slug: string
  name: string
  country: string
  countryCode: "IN" | "US" | "CA" | "GB" | "AE" | "AU"
  region: string
  timezone: string
  priority: "primary" | "secondary"
  localAngle: string
}

export const seoServices: SeoService[] = [
  {
    slug: "ai-development",
    name: "AI Development",
    shortName: "AI Development",
    primaryKeyword: "AI development company",
    secondaryKeywords: ["AI development agency", "custom AI software", "hire AI developers"],
    description:
      "Production-ready AI features, model integrations, and LLM applications designed around real workflows—not demos.",
    outcomes: [
      "Ship AI features that operators can trust in production",
      "Reduce manual work with guarded automation",
      "Keep data boundaries, evaluation, and handoff explicit",
    ],
    deliverables: [
      "Use-case discovery and feasibility review",
      "LLM / agent architecture and prompt systems",
      "API integrations and evaluation harness",
      "Admin controls, logging, and rollout plan",
    ],
    faqs: [
      {
        question: "Do you build custom AI products or only integrate existing tools?",
        answer:
          "Both. We implement custom LLM applications, agents, and workflow automation, and we also integrate providers like OpenAI when that is the faster path to a reliable release.",
      },
      {
        question: "How long does an AI MVP usually take?",
        answer:
          "Focused AI MVPs typically land in 2–8 weeks depending on data readiness, integrations, and how much human review the workflow needs.",
      },
    ],
    relatedSlugs: ["ai-automation", "llm-applications", "ai-agents", "workflow-automation"],
  },
  {
    slug: "ai-automation",
    name: "AI Automation",
    shortName: "AI Automation",
    primaryKeyword: "AI automation agency",
    secondaryKeywords: ["business process automation", "AI workflow automation", "ops automation"],
    description:
      "Agent-assisted operations and workflow automation that remove repetitive work without creating black-box risk.",
    outcomes: [
      "Cut repetitive ops and follow-up work",
      "Add review gates where humans still need control",
      "Connect CRM, email, and internal tools cleanly",
    ],
    deliverables: [
      "Process mapping and automation candidates",
      "Workflow orchestration and agent tooling",
      "CRM / API / notification integrations",
      "Monitoring, fallbacks, and operator docs",
    ],
    faqs: [
      {
        question: "What processes are best for AI automation first?",
        answer:
          "Lead qualification, intake triage, status updates, document drafting, and internal routing usually return value fastest when the rules are clear and the data is available.",
      },
    ],
    relatedSlugs: ["ai-development", "workflow-automation", "business-automation", "crm-development"],
  },
  {
    slug: "llm-applications",
    name: "LLM Applications",
    shortName: "LLM Apps",
    primaryKeyword: "LLM application development",
    secondaryKeywords: ["custom ChatGPT app", "RAG development", "enterprise LLM software"],
    description:
      "Retrieval-augmented apps, assistants, and internal copilots grounded in your documents, systems, and permissions.",
    outcomes: [
      "Ground answers in your own knowledge base",
      "Control access with roles and auditability",
      "Measure quality before you scale usage",
    ],
    deliverables: [
      "Knowledge ingestion and chunking strategy",
      "RAG pipeline and evaluation set",
      "Chat / workflow UI",
      "Security, logging, and cost controls",
    ],
    faqs: [
      {
        question: "Can you build RAG systems over private documents?",
        answer:
          "Yes. We design retrieval pipelines over your docs, tickets, and knowledge bases with access controls and evaluation so answers stay useful and auditable.",
      },
    ],
    relatedSlugs: ["ai-development", "ai-agents", "api-development"],
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    shortName: "AI Agents",
    primaryKeyword: "AI agent development",
    secondaryKeywords: ["autonomous agents", "multi-agent systems", "AI agent agency"],
    description:
      "Task-oriented agents with tools, memory, guardrails, and human checkpoints for real business work.",
    outcomes: [
      "Automate multi-step tasks with tool use",
      "Keep humans in the loop where risk is high",
      "Instrument agent behavior for debugging",
    ],
    deliverables: [
      "Agent goals, tools, and policy design",
      "Tool-calling integrations",
      "Memory / state model",
      "Review UI and failure handling",
    ],
    faqs: [
      {
        question: "Do your agents run fully autonomously?",
        answer:
          "Only when the risk profile allows it. Most client systems start with assisted agents and explicit approval steps, then expand autonomy after quality is proven.",
      },
    ],
    relatedSlugs: ["ai-automation", "llm-applications", "workflow-automation"],
  },
  {
    slug: "custom-software-development",
    name: "Custom Software Development",
    shortName: "Custom Software",
    primaryKeyword: "custom software development company",
    secondaryKeywords: ["bespoke software development", "custom application development"],
    description:
      "End-to-end product engineering for portals, internal tools, and customer-facing systems that need to stay maintainable.",
    outcomes: [
      "Replace spreadsheet and email chaos with a real system",
      "Ship a credible first release with room to grow",
      "Leave documentation and ownership clear",
    ],
    deliverables: [
      "Discovery and information architecture",
      "Full-stack implementation",
      "Auth, roles, and data model",
      "Launch support and handoff",
    ],
    faqs: [
      {
        question: "Do you only build greenfield products?",
        answer:
          "No. We also rebuild fragile tools, extend existing products, and stabilize systems that need a cleaner architecture before the next feature cycle.",
      },
    ],
    relatedSlugs: ["saas-development", "mvp-development", "full-stack-development", "api-development"],
  },
  {
    slug: "saas-development",
    name: "SaaS Development",
    shortName: "SaaS Development",
    primaryKeyword: "SaaS development company",
    secondaryKeywords: ["SaaS product development", "multi-tenant SaaS development"],
    description:
      "Multi-tenant SaaS foundations with auth, roles, billing-ready structure, and operational controls.",
    outcomes: [
      "Launch a tenant-aware product without rewrite debt",
      "Support roles, billing hooks, and admin tools",
      "Keep onboarding and ops surfaces readable",
    ],
    deliverables: [
      "Tenant model and permissions",
      "Core product workflows",
      "Admin / billing-ready hooks",
      "Observability and deployment path",
    ],
    faqs: [
      {
        question: "Can you help after the MVP is live?",
        answer:
          "Yes. Many engagements continue as retainers for feature cycles, reliability work, and product operations after the first release.",
      },
    ],
    relatedSlugs: ["mvp-development", "custom-software-development", "api-development"],
  },
  {
    slug: "mvp-development",
    name: "MVP Development",
    shortName: "MVP Development",
    primaryKeyword: "MVP development company",
    secondaryKeywords: ["startup MVP development", "build an MVP", "MVP agency"],
    description:
      "Focused MVPs for founders who need a credible product to validate demand, raise, or close first customers.",
    outcomes: [
      "Ship the smallest useful product quickly",
      "Avoid overbuilding before market signal",
      "Create a path for the second release",
    ],
    deliverables: [
      "Scope framing and release target",
      "MVP build and QA",
      "Analytics and feedback loops",
      "Roadmap for phase two",
    ],
    faqs: [
      {
        question: "What is a realistic MVP timeline?",
        answer:
          "Most focused MVPs ship in 2–8 weeks when scope is disciplined. Broader platforms take longer and should be phased.",
      },
    ],
    relatedSlugs: ["saas-development", "startup-product-development", "website-development"],
  },
  {
    slug: "full-stack-development",
    name: "Full Stack Development",
    shortName: "Full Stack",
    primaryKeyword: "full stack development company",
    secondaryKeywords: ["full stack web development", "hire full stack developers"],
    description:
      "Frontend, backend, and data work in one delivery stream so product, ops, and content stay aligned.",
    outcomes: [
      "One team owns UI, API, and data flow",
      "Fewer handoff gaps between design and engineering",
      "Faster iteration with shared ownership",
    ],
    deliverables: [
      "UI implementation",
      "API and database layer",
      "Auth and integrations",
      "Deployment and docs",
    ],
    faqs: [
      {
        question: "Which stack do you prefer?",
        answer:
          "We commonly ship with Next.js, Node.js, Python, PostgreSQL/Supabase, and Vercel when that matches the product. Stack choices follow the problem, not a template.",
      },
    ],
    relatedSlugs: ["react-development", "nextjs-development", "nodejs-development", "python-development"],
  },
  {
    slug: "react-development",
    name: "React Development",
    shortName: "React",
    primaryKeyword: "React development company",
    secondaryKeywords: ["hire React developers", "React agency", "React dashboard development"],
    description:
      "Modern React interfaces for marketing sites, dashboards, portals, and internal tools.",
    outcomes: [
      "Fast, accessible interfaces",
      "Component systems that stay maintainable",
      "Clean integration with APIs and auth",
    ],
    deliverables: ["UI architecture", "Component library patterns", "State and data fetching", "Performance polish"],
    faqs: [
      {
        question: "Do you work with existing React codebases?",
        answer: "Yes. We can extend, refactor, or stabilize existing React apps when the foundation is worth keeping.",
      },
    ],
    relatedSlugs: ["nextjs-development", "full-stack-development", "website-development"],
  },
  {
    slug: "nextjs-development",
    name: "Next.js Development",
    shortName: "Next.js",
    primaryKeyword: "Next.js development company",
    secondaryKeywords: ["hire Next.js developers", "Next.js agency", "Next.js product websites"],
    description:
      "Next.js applications with App Router patterns, solid metadata, and performance discipline for product and marketing surfaces.",
    outcomes: [
      "Fast public pages with maintainable structure",
      "Server and client rendering used intentionally",
      "Content and product surfaces in one codebase",
    ],
    deliverables: ["App Router architecture", "Metadata and schema", "CMS / content models", "Vercel deployment"],
    faqs: [
      {
        question: "Is Next.js a good fit for lead-generation websites?",
        answer:
          "Yes. Next.js is especially strong when you need fast pages, structured content, and room to grow into portals or product features.",
      },
    ],
    relatedSlugs: ["react-development", "website-development", "saas-development"],
  },
  {
    slug: "nodejs-development",
    name: "Node.js Development",
    shortName: "Node.js",
    primaryKeyword: "Node.js development company",
    secondaryKeywords: ["Node.js API development", "hire Node.js developers"],
    description: "Reliable Node.js APIs, workers, and backend services for product and automation systems.",
    outcomes: ["Clean API boundaries", "Background jobs and integrations", "Secure auth and validation"],
    deliverables: ["API design", "Workers / queues", "Integrations", "Observability"],
    faqs: [
      {
        question: "Can Node.js power CRM and automation backends?",
        answer: "Yes. Node.js is a strong fit for APIs, webhooks, CRM integrations, and automation services.",
      },
    ],
    relatedSlugs: ["api-development", "full-stack-development", "crm-development"],
  },
  {
    slug: "python-development",
    name: "Python Development",
    shortName: "Python",
    primaryKeyword: "Python development company",
    secondaryKeywords: ["Python AI development", "hire Python developers"],
    description: "Python services for AI pipelines, data workflows, APIs, and automation backends.",
    outcomes: ["AI and data work close to the product", "Reusable services and scripts", "Clean handoff to ops teams"],
    deliverables: ["Service design", "AI / data pipelines", "API endpoints", "Deployment notes"],
    faqs: [
      {
        question: "When do you recommend Python over Node.js?",
        answer:
          "Python is often the better fit for AI, ML, data processing, and research-heavy workflows. Node.js is often stronger for product APIs and realtime web apps.",
      },
    ],
    relatedSlugs: ["ai-development", "llm-applications", "api-development"],
  },
  {
    slug: "workflow-automation",
    name: "Workflow Automation",
    shortName: "Workflow Automation",
    primaryKeyword: "workflow automation services",
    secondaryKeywords: ["business workflow automation", "process automation agency"],
    description: "Structured workflow systems that connect people, tools, and approvals across the business.",
    outcomes: ["Fewer manual handoffs", "Clear ownership of each step", "Better visibility for operators"],
    deliverables: ["Workflow mapping", "Automation build", "Integrations", "Operator runbooks"],
    faqs: [
      {
        question: "Do you replace Zapier-style tools or extend them?",
        answer:
          "Either. Lightweight flows can stay in integration tools. Higher-stakes workflows often need a custom system with better control and auditability.",
      },
    ],
    relatedSlugs: ["ai-automation", "business-automation", "crm-development"],
  },
  {
    slug: "crm-development",
    name: "CRM Development",
    shortName: "CRM",
    primaryKeyword: "custom CRM development",
    secondaryKeywords: ["CRM software development", "custom CRM for agencies"],
    description: "Custom CRM and pipeline systems tailored to how your team actually sells and delivers.",
    outcomes: ["Pipeline clarity", "Fewer spreadsheet workarounds", "Better follow-up discipline"],
    deliverables: ["Pipeline model", "CRM UI", "Integrations", "Reporting views"],
    faqs: [
      {
        question: "When is a custom CRM better than Salesforce or HubSpot?",
        answer:
          "When your process is distinctive enough that off-the-shelf tools become expensive workarounds. Many teams also start with HubSpot and later need custom workflow layers.",
      },
    ],
    relatedSlugs: ["custom-software-development", "business-automation", "api-development"],
  },
  {
    slug: "api-development",
    name: "API Development",
    shortName: "API Development",
    primaryKeyword: "API development company",
    secondaryKeywords: ["custom API development", "integration development"],
    description: "Clean APIs and integrations that connect products, CRMs, payment systems, and internal tools.",
    outcomes: ["Stable contracts between systems", "Safer integrations", "Less brittle sync work"],
    deliverables: ["API design", "Auth and validation", "Webhooks / sync jobs", "Docs and tests"],
    faqs: [
      {
        question: "Do you document APIs for future teams?",
        answer: "Yes. Handoff includes endpoint docs, environment notes, and the assumptions another engineer needs to extend the system safely.",
      },
    ],
    relatedSlugs: ["nodejs-development", "saas-development", "custom-software-development"],
  },
  {
    slug: "business-automation",
    name: "Business Automation",
    shortName: "Business Automation",
    primaryKeyword: "business automation company",
    secondaryKeywords: ["business automation services", "operations automation"],
    description: "Practical automation for service companies, agencies, and operators who need fewer manual loops.",
    outcomes: ["Faster intake and follow-up", "Fewer missed handoffs", "Clearer operational status"],
    deliverables: ["Ops audit", "Automation roadmap", "Implementation", "Training and docs"],
    faqs: [
      {
        question: "Who is this best for?",
        answer:
          "Agencies, service firms, SaaS operators, and internal teams with repetitive intake, reporting, or client-communication work.",
      },
    ],
    relatedSlugs: ["ai-automation", "workflow-automation", "crm-development"],
  },
  {
    slug: "startup-product-development",
    name: "Startup Product Development",
    shortName: "Startup Products",
    primaryKeyword: "startup product development",
    secondaryKeywords: ["startup software development", "startup engineering partner"],
    description: "Founder-friendly product engineering from discovery through a release that can raise or sell.",
    outcomes: ["Credible first product", "Investor- and customer-ready polish", "Room to expand without rewrite panic"],
    deliverables: ["Discovery workshop", "MVP / V1 build", "Launch support", "Next-phase roadmap"],
    faqs: [
      {
        question: "Do you work with early-stage startups?",
        answer: "Yes. Many engagements start with founders who need a disciplined partner for the first serious product release.",
      },
    ],
    relatedSlugs: ["mvp-development", "saas-development", "website-development"],
  },
  {
    slug: "website-development",
    name: "Website Development",
    shortName: "Websites",
    primaryKeyword: "website development company",
    secondaryKeywords: ["B2B website development", "agency website development", "lead generation website"],
    description: "High-trust marketing and lead-generation websites with clear information architecture and conversion-focused UX.",
    outcomes: ["Better qualified inquiries", "Clear positioning", "Maintainable content structure"],
    deliverables: ["IA and copy structure", "Design system implementation", "Page metadata", "Forms and analytics"],
    faqs: [
      {
        question: "Do you build brochure sites or conversion systems?",
        answer:
          "Conversion systems. Every site is structured for positioning, trust, and a clear path to an inquiry.",
      },
    ],
    relatedSlugs: ["nextjs-development", "react-development", "mvp-development"],
  },
  {
    slug: "enterprise-software",
    name: "Enterprise Software",
    shortName: "Enterprise Software",
    primaryKeyword: "enterprise software development",
    secondaryKeywords: ["enterprise application development", "internal systems development"],
    description: "Internal platforms and enterprise-facing systems with roles, auditability, and operational discipline.",
    outcomes: ["Reliable internal workflows", "Role-aware access", "Systems operators can actually run"],
    deliverables: ["Requirements framing", "Secure implementation", "Admin tooling", "Runbooks and training"],
    faqs: [
      {
        question: "Can you work with existing enterprise constraints?",
        answer:
          "Yes. We plan around security reviews, environment constraints, and the operational realities of the teams who will own the system.",
      },
    ],
    relatedSlugs: ["custom-software-development", "api-development", "saas-development"],
  },
]

export const seoCities: SeoCity[] = [
  // India primary
  {
    slug: "jaipur",
    name: "Jaipur",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Strong local delivery base with overlap for US/Canada clients and Rajasthan startup demand.",
  },
  {
    slug: "delhi",
    name: "Delhi",
    country: "India",
    countryCode: "IN",
    region: "Delhi NCR",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Dense enterprise, SaaS, and agency market across Delhi NCR.",
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    country: "India",
    countryCode: "IN",
    region: "Maharashtra",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Finance, media, and high-growth product teams needing credible engineering partners.",
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    country: "India",
    countryCode: "IN",
    region: "Karnataka",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "India’s deepest SaaS and startup engineering market.",
  },
  {
    slug: "pune",
    name: "Pune",
    country: "India",
    countryCode: "IN",
    region: "Maharashtra",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Product and IT services ecosystem with strong demand for custom software and automation.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    country: "India",
    countryCode: "IN",
    region: "Telangana",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Enterprise IT and product teams with growing AI and SaaS demand.",
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    country: "India",
    countryCode: "IN",
    region: "Gujarat",
    timezone: "Asia/Kolkata",
    priority: "primary",
    localAngle: "Manufacturing, commerce, and SME digital transformation demand.",
  },
  // High-opportunity US metros (realistic for early-stage agency)
  {
    slug: "austin",
    name: "Austin",
    country: "United States",
    countryCode: "US",
    region: "Texas",
    timezone: "America/Chicago",
    priority: "primary",
    localAngle: "Startup-dense metro with strong MVP and SaaS demand and lower agency saturation than NYC/SF.",
  },
  {
    slug: "denver",
    name: "Denver",
    country: "United States",
    countryCode: "US",
    region: "Colorado",
    timezone: "America/Denver",
    priority: "primary",
    localAngle: "Growing SaaS and ops-tech scene with achievable local competition.",
  },
  {
    slug: "raleigh",
    name: "Raleigh",
    country: "United States",
    countryCode: "US",
    region: "North Carolina",
    timezone: "America/New_York",
    priority: "primary",
    localAngle: "Research Triangle demand for custom software, AI, and enterprise tools.",
  },
  {
    slug: "tampa",
    name: "Tampa",
    country: "United States",
    countryCode: "US",
    region: "Florida",
    timezone: "America/New_York",
    priority: "secondary",
    localAngle: "Expanding tech and services market with strong demand for custom product work.",
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    country: "United States",
    countryCode: "US",
    region: "Arizona",
    timezone: "America/Phoenix",
    priority: "secondary",
    localAngle: "Fast-growing metro with demand for automation and custom software.",
  },
  {
    slug: "charlotte",
    name: "Charlotte",
    country: "United States",
    countryCode: "US",
    region: "North Carolina",
    timezone: "America/New_York",
    priority: "secondary",
    localAngle: "Finance and services companies needing portals, CRM, and automation.",
  },
  // Canada
  {
    slug: "toronto",
    name: "Toronto",
    country: "Canada",
    countryCode: "CA",
    region: "Ontario",
    timezone: "America/Toronto",
    priority: "primary",
    localAngle: "Largest Canadian SaaS and agency market with strong remote collaboration fit.",
  },
  {
    slug: "vancouver",
    name: "Vancouver",
    country: "Canada",
    countryCode: "CA",
    region: "British Columbia",
    timezone: "America/Vancouver",
    priority: "primary",
    localAngle: "Product and startup teams that value polished delivery and Pacific timezone overlap.",
  },
  {
    slug: "calgary",
    name: "Calgary",
    country: "Canada",
    countryCode: "CA",
    region: "Alberta",
    timezone: "America/Edmonton",
    priority: "secondary",
    localAngle: "Energy, services, and SME digitization demand with moderate competition.",
  },
  {
    slug: "ottawa",
    name: "Ottawa",
    country: "Canada",
    countryCode: "CA",
    region: "Ontario",
    timezone: "America/Toronto",
    priority: "secondary",
    localAngle: "Government-adjacent and B2B software demand with reachable competition.",
  },
  // International commercial hubs
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    region: "England",
    timezone: "Europe/London",
    priority: "secondary",
    localAngle: "High commercial demand for AI, SaaS, and custom software from established operators.",
  },
  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Dubai",
    timezone: "Asia/Dubai",
    priority: "secondary",
    localAngle: "Fast-moving enterprise and startup buyers seeking AI, automation, and custom platforms.",
  },
  {
    slug: "sydney",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    timezone: "Australia/Sydney",
    priority: "secondary",
    localAngle: "SaaS and services buyers who need clear English-language delivery and durable systems.",
  },
]

/** Local city × service pages for primary markets only (avoids thin duplicate crawl targets). */
export const localServicePrioritySlugs = [
  "ai-development",
  "ai-automation",
  "custom-software-development",
  "saas-development",
  "mvp-development",
  "website-development",
] as const

export function getServiceBySlug(slug: string) {
  return seoServices.find((service) => service.slug === slug) ?? null
}

export function getCityBySlug(slug: string) {
  return seoCities.find((city) => city.slug === slug) ?? null
}

export function getLocalServicePages() {
  const services = seoServices.filter((service) =>
    (localServicePrioritySlugs as readonly string[]).includes(service.slug),
  )
  const cities = seoCities.filter((city) => city.priority === "primary")
  return cities.flatMap((city) =>
    services.map((service) => ({
      city,
      service,
      path: `/locations/${city.slug}/${service.slug}`,
      title: `${service.name} for teams in ${city.name}`,
    })),
  )
}

export { breadcrumbJsonLd } from "@/lib/seo"
