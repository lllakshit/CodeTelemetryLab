export type LocationNarrative = {
  introTitle: string
  intro: string
  environment: string
  industries: string[]
  challenges: string[]
  useCases: string[]
  collaboration: string
  recommendedServices: string[]
  faqs: { question: string; answer: string }[]
  ctaTitle: string
  ctaText: string
  ctaLabel: string
  metaTitle: string
  metaDescription: string
}

export const locationNarratives: Record<string, LocationNarrative> = {
  jaipur: {
    introTitle: "Engineering delivery from Jaipur for product teams that need overlap with global clients",
    intro:
      "Jaipur is our home base. Product and ops teams here often build for customers in other time zones, which means the software has to be operable without the original builders in the room every hour. That constraint shapes how we scope, document, and hand off.",
    environment:
      "The local ecosystem mixes early startups, services firms, and product teams supporting overseas buyers. Decision cycles can be fast, but production standards still matter—especially when the system will be demonstrated to US or Canadian stakeholders.",
    industries: ["B2B SaaS", "Professional services", "Education technology", "Internal ops tooling"],
    challenges: [
      "Bridging India delivery hours with North American review cycles",
      "Keeping documentation current when the same team ships and supports",
      "Avoiding demo-quality builds that fail under real operator load",
    ],
    useCases: [
      "Client portals for remote service businesses",
      "Automation consoles for ops teams coordinating across tools",
      "SaaS foundations that can later add billing without a rewrite",
    ],
    collaboration:
      "We schedule working sessions in the India–US/Canada overlap window when clients are overseas. Written decisions and async updates cover the hours when live calls are impractical.",
    recommendedServices: ["saas-development", "custom-software-development", "ai-automation", "mvp-development"],
    faqs: [
      {
        question: "Do you only take Jaipur-local clients?",
        answer:
          "No. Jaipur is where we build from. Clients are often remote across India and internationally. Local workshops are available when travel makes sense.",
      },
      {
        question: "How do you handle time-zone handoff?",
        answer:
          "Clear owners, written status, and deploy notes. Overnight work should not require a meeting to understand what changed.",
      },
    ],
    ctaTitle: "Building from Jaipur—or with a Jaipur-based team?",
    ctaText: "Share the product surface, the reviewers’ time zone, and what must ship first.",
    ctaLabel: "Brief the Jaipur team",
    metaTitle: "Software & AI Engineering in Jaipur",
    metaDescription:
      "CodeTelemetryLab builds SaaS, automation, and custom software from Jaipur with remote collaboration for India and international product teams.",
  },
  delhi: {
    introTitle: "Software systems for Delhi NCR teams balancing enterprise process and product speed",
    intro:
      "Delhi NCR buyers often sit between enterprise process expectations and startup delivery pressure. The useful work is usually clarifying ownership, access, and auditability before features multiply.",
    environment:
      "Large services organizations, corporate IT, and product startups share the same metro. Procurement can be formal; technical urgency still shows up when a workflow is blocking revenue or compliance.",
    industries: ["Enterprise IT", "Fintech-adjacent services", "Agencies", "Marketplace operators"],
    challenges: [
      "Role models that span contractors and full-time staff",
      "Integrations with legacy ERPs or CRMs",
      "Stakeholder groups with conflicting definitions of “done”",
    ],
    useCases: [
      "Internal platforms with SSO readiness",
      "CRM-shaped workflows that match actual sales stages",
      "API layers between modern UIs and older systems of record",
    ],
    collaboration:
      "We prefer a named product owner in NCR and a written RACI. Workshops can be virtual; critical architecture decisions are confirmed in a short decision log.",
    recommendedServices: ["enterprise-software", "api-development", "crm-development", "custom-software-development"],
    faqs: [
      {
        question: "Can you work under vendor onboarding processes?",
        answer:
          "Yes when the paperwork is clear. We respond to security questionnaires with accurate descriptions of our stack and practices—no invented certifications.",
      },
    ],
    ctaTitle: "Have an NCR workflow that needs clearer ownership in software?",
    ctaText: "Describe users, systems of record, and the review you need to pass.",
    ctaLabel: "Discuss a Delhi NCR build",
    metaTitle: "Custom Software & AI for Delhi NCR Teams",
    metaDescription:
      "Engineering partner for Delhi NCR product and enterprise teams—portals, APIs, CRM workflows, and operable internal systems.",
  },
  mumbai: {
    introTitle: "Product engineering for Mumbai teams where finance, media, and ops collide",
    intro:
      "Mumbai projects often involve money movement, content operations, or high-visibility customer journeys. The bar is less about novelty and more about correctness under scrutiny.",
    environment:
      "Finance, media, and high-growth product companies share a market that expects polished interfaces and sober backend behavior. Review cycles can include compliance-minded stakeholders.",
    industries: ["Financial services operations", "Media & publishing", "Consumer platforms", "B2B SaaS"],
    challenges: [
      "Audit trails for sensitive actions",
      "Performance under bursty traffic",
      "Content workflows that must stay editable without deploys",
    ],
    useCases: [
      "Operator dashboards with role separation",
      "Publishing systems with structured content",
      "Automation around reconciliations and status sync",
    ],
    collaboration:
      "We align to Mumbai business hours when stakeholders are local, and publish async notes for distributed contributors. Staging environments get the same auth model as production.",
    recommendedServices: ["full-stack-development", "business-automation", "website-development", "ai-development"],
    faqs: [
      {
        question: "Do you handle payment integrations?",
        answer:
          "Yes when the product needs them. We implement with provider best practices and keep PCI scope as narrow as the architecture allows.",
      },
    ],
    ctaTitle: "Shipping a Mumbai product that must hold up under review?",
    ctaText: "Tell us what is customer-facing versus internal, and which actions need an audit trail.",
    ctaLabel: "Scope a Mumbai engagement",
    metaTitle: "Software Engineering for Mumbai Product Teams",
    metaDescription:
      "CodeTelemetryLab builds dashboards, content systems, and automation for Mumbai teams that need correctness and operable handoffs.",
  },
  bangalore: {
    introTitle: "SaaS and platform work for Bangalore teams who already know the stack debates",
    intro:
      "Bangalore buyers are often technical. Conversations move quickly to tenancy, observability, and whether the first release will trap the next hire. We match that depth without turning the engagement into architecture theater.",
    environment:
      "India’s densest SaaS and startup market. Peer review is strong; shipping discipline varies. The best partners leave systems that senior engineers respect.",
    industries: ["SaaS", "Developer tools", "HR tech", "Logistics platforms"],
    challenges: [
      "Premature microservices",
      "Weak tenant boundaries in early MVPs",
      "Observability bolted on after incidents",
    ],
    useCases: [
      "Multi-tenant SaaS foundations",
      "LLM features with evaluation harnesses",
      "Next.js product + marketing monorepos with clear route groups",
    ],
    collaboration:
      "Technical co-founders and staff engineers are welcome in reviews. We work in your repos and prefer pull requests over opaque zip deliveries.",
    recommendedServices: ["saas-development", "nextjs-development", "llm-applications", "ai-agents"],
    faqs: [
      {
        question: "Will you pair with our in-house team?",
        answer:
          "Yes. Shared ownership of the repo and a clear module boundary usually beats a black-box vendor relationship.",
      },
    ],
    ctaTitle: "Need a Bangalore-pace partner who still writes for the next engineer?",
    ctaText: "Share the tenant model, must-have workflows, and what you refuse to rebuild in six months.",
    ctaLabel: "Plan a Bangalore build",
    metaTitle: "SaaS & AI Engineering in Bangalore",
    metaDescription:
      "SaaS foundations, LLM features, and Next.js platforms for Bangalore product teams who care about tenancy and maintainability.",
  },
  pune: {
    introTitle: "Custom software for Pune product and IT services teams",
    intro:
      "Pune engagements often sit at the intersection of product companies and IT services delivery. The useful outcome is usually a maintainable system that both builders and operators can explain.",
    environment:
      "A mature product and services ecosystem with strong engineering talent density. Buyers value clear scopes and realistic timelines over theatrical roadmaps.",
    industries: ["Product engineering", "IT services", "Automotive-adjacent software", "Edtech"],
    challenges: [
      "Handoffs between delivery pods",
      "Internal tools that outgrew spreadsheets",
      "Automation without losing auditability",
    ],
    useCases: [
      "Internal automation consoles",
      "Client-facing portals",
      "API services connecting legacy and modern stacks",
    ],
    collaboration:
      "We establish a single decision channel and a weekly demo cadence. Documentation is part of the sprint definition of done.",
    recommendedServices: ["custom-software-development", "ai-automation", "api-development", "full-stack-development"],
    faqs: [
      {
        question: "Can you support a fixed-scope phase followed by a retainer?",
        answer:
          "Yes. Many Pune engagements start with a defined first release, then continue with a lighter maintenance or enhancement retainer.",
      },
    ],
    ctaTitle: "Have a Pune workflow ready for a first production cut?",
    ctaText: "Outline the users, integrations, and the date that actually matters.",
    ctaLabel: "Start a Pune project brief",
    metaTitle: "Custom Software Development in Pune",
    metaDescription:
      "Portals, APIs, and automation systems for Pune product and services teams—scoped releases with durable handoff.",
  },
  hyderabad: {
    introTitle: "AI and enterprise tooling for Hyderabad’s product and IT landscape",
    intro:
      "Hyderabad teams frequently blend enterprise IT expectations with product experimentation—especially around AI features and internal platforms. We focus on evaluation, permissions, and operable rollouts.",
    environment:
      "Enterprise IT and product companies with growing interest in AI-assisted workflows. Buyers ask for demos, but production needs review gates and logging.",
    industries: ["Enterprise software", "Life sciences-adjacent ops", "SaaS", "Shared services"],
    challenges: [
      "AI prototypes without permissions models",
      "Data access that spans multiple business units",
      "Change management for operator adoption",
    ],
    useCases: [
      "LLM assistants grounded in internal documents",
      "Workflow automation with approval steps",
      "Admin platforms for multi-team operations",
    ],
    collaboration:
      "Security and IT stakeholders are invited early when data classification matters. We document data flows before model integration expands.",
    recommendedServices: ["ai-development", "llm-applications", "enterprise-software", "workflow-automation"],
    faqs: [
      {
        question: "Do you deploy models on-prem?",
        answer:
          "Most first releases use managed model APIs with strict server-side controls. On-prem or VPC options are evaluated when policy requires them and the timeline allows.",
      },
    ],
    ctaTitle: "Exploring AI or platform work in Hyderabad?",
    ctaText: "Describe the data sources, who can see what, and which actions must stay human-reviewed.",
    ctaLabel: "Discuss a Hyderabad engagement",
    metaTitle: "AI & Enterprise Software in Hyderabad",
    metaDescription:
      "CodeTelemetryLab helps Hyderabad teams ship AI features and internal platforms with permissions, evaluation, and operator-ready rollouts.",
  },
  ahmedabad: {
    introTitle: "Practical systems for Ahmedabad manufacturers, commerce, and SME operators",
    intro:
      "Ahmedabad projects often start when spreadsheets and WhatsApp threads stop scaling. The first useful software usually encodes an existing operational rhythm rather than inventing a new one.",
    environment:
      "Manufacturing, commerce, and SME digitalization create demand for durable internal tools. Buyers prefer concrete workflows over abstract “transformation” language.",
    industries: ["Manufacturing ops", "Wholesale & commerce", "Professional services", "Logistics coordination"],
    challenges: [
      "Messy historical data",
      "Mixed literacy across operators",
      "Integrations with accounting or inventory tools",
    ],
    useCases: [
      "Order and inventory status portals",
      "Field-to-office reporting tools",
      "Automation of repetitive reconciliations",
    ],
    collaboration:
      "We invest in plain-language UI and training notes. Success is measured by whether floor or office staff stop maintaining parallel sheets.",
    recommendedServices: ["business-automation", "custom-software-development", "website-development", "crm-development"],
    faqs: [
      {
        question: "Can you migrate from Excel without freezing operations?",
        answer:
          "Yes—usually with a parallel-run period, import validation, and a rollback path. We do not flip a switch on unclean data.",
      },
    ],
    ctaTitle: "Ready to replace a brittle Ahmedabad ops process?",
    ctaText: "Walk us through the spreadsheet or chat ritual that burns the most hours.",
    ctaLabel: "Map an Ahmedabad workflow",
    metaTitle: "Business Software & Automation in Ahmedabad",
    metaDescription:
      "Operational software and automation for Ahmedabad manufacturers, commerce teams, and SMEs—built around real workflows.",
  },
  austin: {
    introTitle: "Product engineering for Austin startups and scale-ups",
    intro:
      "Austin teams move quickly and expect partners who can discuss tradeoffs without slowing the release. We emphasize a lean first cut that still respects tenancy, auth, and operability.",
    environment:
      "A startup-dense metro with SaaS, consumer, and infra-adjacent companies. Competition for engineering attention is high; clarity in scope wins more than slideware.",
    industries: ["SaaS", "Marketplace", "Creator/tools platforms", "B2B operations products"],
    challenges: [
      "Scope creep during fundraising demos",
      "Skipping admin tooling until support is overloaded",
      "Hiring plans that assume a rewrite “later”",
    ],
    useCases: [
      "MVP to multi-tenant foundation",
      "Customer portals",
      "AI features behind feature flags",
    ],
    collaboration:
      "Overlap with US Central time is straightforward. We keep a written non-goals list so demos do not silently expand scope.",
    recommendedServices: ["mvp-development", "saas-development", "react-development", "ai-development"],
    faqs: [
      {
        question: "Can you work alongside a founding engineer?",
        answer: "Yes. Shared PRs and architecture notes keep ownership with the company.",
      },
    ],
    ctaTitle: "Shipping an Austin product under a real deadline?",
    ctaText: "Share the journey that must work and what you are willing to leave out of v1.",
    ctaLabel: "Scope an Austin MVP",
    metaTitle: "SaaS & MVP Engineering for Austin Teams",
    metaDescription:
      "Remote-friendly product engineering for Austin startups—MVPs, SaaS foundations, and AI features with honest scope.",
  },
  denver: {
    introTitle: "Reliable delivery for Denver SaaS and ops-tech teams",
    intro:
      "Denver buyers often want calm execution: fewer surprises, clearer environments, and systems that support field or ops workflows without drama.",
    environment:
      "A growing SaaS and ops-tech scene with achievable local competition. Teams value partners who communicate status without ceremony.",
    industries: ["Ops tech", "Outdoor/retail platforms", "B2B SaaS", "Professional services software"],
    challenges: [
      "Distributed operators across Mountain time",
      "Integrations with scheduling or inventory tools",
      "Content and configuration owned by non-engineers",
    ],
    useCases: [
      "Internal consoles for operations",
      "Customer-facing status portals",
      "Workflow automation with notifications",
    ],
    collaboration:
      "Mountain time overlap works well for US collaboration. We document environment setup so local hires can continue without us.",
    recommendedServices: ["workflow-automation", "full-stack-development", "custom-software-development", "nextjs-development"],
    faqs: [
      {
        question: "Do you support after-hours incidents?",
        answer:
          "During launch windows we agree on a stabilization contact path. Ongoing 24/7 NOC is not a default offering unless scoped as a retainer with clear SLAs.",
      },
    ],
    ctaTitle: "Need a Denver-facing system that ops can actually run?",
    ctaText: "Describe the operator roles and the tools that must stay in the loop.",
    ctaLabel: "Brief a Denver build",
    metaTitle: "Software & Automation for Denver Companies",
    metaDescription:
      "Ops consoles, portals, and full-stack delivery for Denver SaaS and operations teams—remote collaboration with clear handoff.",
  },
  raleigh: {
    introTitle: "Custom software for Raleigh–Durham research and enterprise teams",
    intro:
      "The Research Triangle often needs software that respects research workflows, data sensitivity, and enterprise procurement habits. We design for clarity of data boundaries first.",
    environment:
      "Research, healthcare-adjacent ops, and enterprise tooling demand. Buyers ask careful questions about data handling and long-term ownership.",
    industries: ["Research tooling", "Healthcare operations (non-clinical)", "Enterprise IT", "Edtech"],
    challenges: [
      "Sensitive datasets with strict access rules",
      "Stakeholders spanning research and commercial teams",
      "Long-lived systems that outlast grant cycles",
    ],
    useCases: [
      "Internal data workflows with audit logs",
      "Grant or project tracking portals",
      "API services wrapping analytical pipelines",
    ],
    collaboration:
      "We schedule around Eastern time and produce architecture notes suitable for IT review. Python services sit cleanly beside TypeScript product UIs when needed.",
    recommendedServices: ["python-development", "enterprise-software", "api-development", "custom-software-development"],
    faqs: [
      {
        question: "Can research notebooks become production services?",
        answer:
          "Yes—by packaging inputs/outputs, adding tests around parsing, and separating experimentation from serving. We do not drop raw notebooks into production.",
      },
    ],
    ctaTitle: "Have a Triangle workflow that needs production packaging?",
    ctaText: "Share data sensitivity requirements and who must approve access.",
    ctaLabel: "Discuss a Raleigh engagement",
    metaTitle: "Custom Software in Raleigh–Durham",
    metaDescription:
      "Engineering for Research Triangle teams—APIs, enterprise tooling, and Python services with clear data boundaries.",
  },
  tampa: {
    introTitle: "Practical product builds for Tampa Bay operators and growing SaaS teams",
    intro:
      "Tampa engagements often prioritize usable first releases for service businesses and regional SaaS. We keep architecture simple, boundaries clean, and admin tooling present from day one.",
    environment:
      "Expanding tech and services market. Buyers want partners who explain options without pushing unnecessary complexity.",
    industries: ["Professional services", "Healthcare admin ops", "Regional SaaS", "Hospitality tech"],
    challenges: [
      "Replacing informal tools (sheets, email) without disrupting staff",
      "Mobile-friendly operator UIs",
      "Budget-conscious phased delivery",
    ],
    useCases: [
      "Client portals",
      "Scheduling and status workflows",
      "Marketing sites connected to durable lead capture",
    ],
    collaboration:
      "Eastern time collaboration is standard. Training materials and plain-language admin docs are part of handoff.",
    recommendedServices: ["website-development", "mvp-development", "crm-development", "custom-software-development"],
    faqs: [
      {
        question: "Can we start with a website and grow into a portal?",
        answer:
          "Yes when the information architecture anticipates auth and app routes. We avoid painting into a corner with a purely static brochure site if a portal is already on the roadmap.",
      },
    ],
    ctaTitle: "Growing a Tampa Bay product or practice?",
    ctaText: "Tell us what staff do today that software should absorb next.",
    ctaLabel: "Plan a Tampa release",
    metaTitle: "Web & Custom Software for Tampa Bay",
    metaDescription:
      "Portals, MVPs, and lead-ready websites for Tampa Bay teams—phased delivery with operable admin tools.",
  },
  phoenix: {
    introTitle: "Automation and custom systems for Phoenix’s fast-growing operators",
    intro:
      "Phoenix teams often need software that keeps up with growth in services, logistics, and local tech. Automation with visibility beats silent scripts.",
    environment:
      "Fast-growing metro with demand for automation and custom software across services and operations-heavy businesses.",
    industries: ["Logistics coordination", "Home/field services", "SaaS", "Wholesale ops"],
    challenges: [
      "Field and office coordination",
      "Notification noise versus missed updates",
      "Integrations with SMS, email, and CRM tools",
    ],
    useCases: [
      "Job status automation",
      "Dispatch-adjacent portals",
      "Reconciliation and reporting jobs",
    ],
    collaboration:
      "Arizona time (no DST) is easy to plan around. We include pause switches and audit logs so ops can trust automation.",
    recommendedServices: ["ai-automation", "business-automation", "workflow-automation", "full-stack-development"],
    faqs: [
      {
        question: "Will automation message customers automatically?",
        answer:
          "Only when you approve that path. High-impact sends start behind confirmation until error rates are understood.",
      },
    ],
    ctaTitle: "Phoenix ops ready for supervised automation?",
    ctaText: "List the tools in the loop and the failure mode you fear most.",
    ctaLabel: "Design a Phoenix automation plan",
    metaTitle: "Automation & Custom Software in Phoenix",
    metaDescription:
      "Supervised automation and operational systems for Phoenix companies—visible jobs, audit logs, and practical integrations.",
  },
  charlotte: {
    introTitle: "Software for Charlotte finance and services operators",
    intro:
      "Charlotte projects frequently touch finance-adjacent workflows and professional services delivery. Correctness, access control, and exportability matter as much as UI polish.",
    environment:
      "Finance and services companies needing portals, CRM-shaped tools, and automation with sober controls.",
    industries: ["Financial services ops", "Professional services", "Insurance ops", "B2B SaaS"],
    challenges: [
      "Segregation of duties",
      "Export and reporting requirements",
      "Vendor risk questionnaires",
    ],
    useCases: [
      "Client reporting portals",
      "Internal approval workflows",
      "CRM systems matched to real stages",
    ],
    collaboration:
      "Eastern time meetings with written follow-ups. We answer security questionnaires accurately and decline to invent certifications.",
    recommendedServices: ["crm-development", "enterprise-software", "business-automation", "website-development"],
    faqs: [
      {
        question: "Do you support SSO?",
        answer: "Yes for enterprise rollouts when the identity provider is ready—SAML/OIDC are common paths.",
      },
    ],
    ctaTitle: "Charlotte workflow that needs stronger controls?",
    ctaText: "Describe roles, approvals, and what auditors or leaders need to see.",
    ctaLabel: "Scope a Charlotte system",
    metaTitle: "Enterprise & CRM Software in Charlotte",
    metaDescription:
      "Portals, CRM workflows, and controlled automation for Charlotte finance and services teams.",
  },
  toronto: {
    introTitle: "Product delivery for Toronto SaaS and agency operators",
    intro:
      "Toronto is Canada’s densest SaaS and agency market. Clients expect polished collaboration and systems that survive both product and delivery pressure.",
    environment:
      "Strong remote collaboration norms and a competitive product scene. Buyers compare partners on communication quality as much as code quality.",
    industries: ["SaaS", "Digital agencies", "Fintech ops", "Marketplace"],
    challenges: [
      "Agency delivery tooling that clients can see",
      "Multi-brand or multi-tenant complexity",
      "Balancing design polish with backend solidity",
    ],
    useCases: [
      "Client portals for agencies",
      "SaaS MVP foundations",
      "Next.js marketing + app combinations",
    ],
    collaboration:
      "Eastern time alignment is excellent. We work in English-first documentation and keep decision logs in the client’s tools (Linear, Notion, GitHub).",
    recommendedServices: ["saas-development", "nextjs-development", "custom-software-development", "mvp-development"],
    faqs: [
      {
        question: "Do you invoice in CAD?",
        answer:
          "Billing currency is agreed per engagement. We support remote contracts with Canadian companies regularly.",
      },
    ],
    ctaTitle: "Toronto team needing a disciplined build partner?",
    ctaText: "Share the product surface and whether clients or internal operators are the primary users.",
    ctaLabel: "Start a Toronto brief",
    metaTitle: "SaaS & Product Engineering for Toronto",
    metaDescription:
      "Remote product engineering for Toronto SaaS and agency teams—portals, MVPs, and Next.js platforms with clear handoff.",
  },
  vancouver: {
    introTitle: "Calm product engineering for Vancouver startups and product studios",
    intro:
      "Vancouver teams often value thoughtful UX and reliable delivery across Pacific hours. We emphasize readable interfaces and environments that designers and engineers can both navigate.",
    environment:
      "Product and startup teams with strong design sensibilities and Pacific timezone overlap with the US West Coast.",
    industries: ["Consumer apps", "SaaS", "Creative tools", "Climate/ops software"],
    challenges: [
      "Design systems that stay consistent as features grow",
      "Performance on content-heavy marketing pages",
      "Async collaboration across PT and other regions",
    ],
    useCases: [
      "Design-system-driven React apps",
      "Marketing sites with structured content",
      "Lightweight admin for content and ops",
    ],
    collaboration:
      "Pacific time sessions when needed; otherwise async-first with recorded decisions. We respect design constraints instead of fighting them in implementation.",
    recommendedServices: ["react-development", "website-development", "full-stack-development", "saas-development"],
    faqs: [
      {
        question: "Can you implement an existing Figma system?",
        answer: "Yes. We prefer extending your system over introducing a second visual language.",
      },
    ],
    ctaTitle: "Vancouver product needing careful UI implementation?",
    ctaText: "Point us at the journeys that feel inconsistent or hard to change.",
    ctaLabel: "Discuss a Vancouver build",
    metaTitle: "React & Product Engineering in Vancouver",
    metaDescription:
      "Design-aware product engineering for Vancouver teams—React apps, content sites, and SaaS surfaces with durable structure.",
  },
  calgary: {
    introTitle: "Operational software for Calgary energy, services, and SME teams",
    intro:
      "Calgary projects often digitize field and office coordination in energy-adjacent and services businesses. Software succeeds when it matches how crews and coordinators already work.",
    environment:
      "Energy, services, and SME digitization demand with moderate competition. Practicality beats jargon.",
    industries: ["Energy services ops", "Field services", "Wholesale", "Professional services"],
    challenges: [
      "Offline-ish field realities and delayed sync",
      "Role differences between field and office",
      "Reporting that leadership trusts",
    ],
    useCases: [
      "Job status and document portals",
      "Automation of status notifications",
      "Internal reporting dashboards",
    ],
    collaboration:
      "Mountain time collaboration. We pilot with a small operator group before wide rollout.",
    recommendedServices: ["custom-software-development", "business-automation", "workflow-automation", "api-development"],
    faqs: [
      {
        question: "Do you build native mobile apps?",
        answer:
          "Phase one is often a responsive web app. Native enters when offline requirements or store distribution justify the cost.",
      },
    ],
    ctaTitle: "Calgary operations ready for a clearer system of record?",
    ctaText: "Describe field vs office roles and the report leadership asks for every week.",
    ctaLabel: "Map a Calgary system",
    metaTitle: "Operations Software for Calgary Businesses",
    metaDescription:
      "Field-to-office portals, automation, and reporting systems for Calgary energy services and SME operators.",
  },
  ottawa: {
    introTitle: "Careful systems for Ottawa’s government-adjacent and B2B software buyers",
    intro:
      "Ottawa work often involves procurement awareness, accessibility expectations, and documentation standards. We take those constraints as design inputs—not obstacles to ignore.",
    environment:
      "Government-adjacent and B2B software demand with careful evaluation cycles. Clarity and accessibility are competitive advantages.",
    industries: ["GovTech-adjacent", "B2B SaaS", "Professional services", "Nonprofits/ops"],
    challenges: [
      "Accessibility requirements on public surfaces",
      "Longer procurement and security review",
      "Multiple stakeholder groups",
    ],
    useCases: [
      "Accessible public sites with durable forms",
      "Internal case or program tracking tools",
      "Document-centric portals",
    ],
    collaboration:
      "Eastern time. We produce materials suitable for security review and keep claims factual.",
    recommendedServices: ["website-development", "enterprise-software", "custom-software-development", "full-stack-development"],
    faqs: [
      {
        question: "Do you meet WCAG targets?",
        answer:
          "We build to WCAG 2.2 AA practices on public and authenticated UIs we control, and we call out third-party widget limitations honestly.",
      },
    ],
    ctaTitle: "Ottawa project with accessibility or review constraints?",
    ctaText: "Share the audience, compliance expectations, and launch window.",
    ctaLabel: "Brief an Ottawa engagement",
    metaTitle: "Accessible Software & Web Systems in Ottawa",
    metaDescription:
      "Accessible websites and careful internal systems for Ottawa B2B and government-adjacent teams.",
  },
  london: {
    introTitle: "Remote product engineering for London startups and operators",
    intro:
      "London clients often need a remote partner who can discuss architecture in depth and deliver across UK hours with clear written updates. We focus on maintainable TypeScript product stacks.",
    environment:
      "High commercial demand for AI, SaaS, and custom software among established operators and startups. Buyers are sophisticated and documentation-minded.",
    industries: ["Fintech ops", "SaaS", "Marketplaces", "Professional services platforms"],
    challenges: [
      "UK hour collaboration with an India-based build team",
      "Data residency conversations",
      "High expectations for UI quality",
    ],
    useCases: [
      "SaaS foundations",
      "AI-assisted operator tools",
      "Customer portals with strong auth",
    ],
    collaboration:
      "We schedule UK-morning / India-afternoon overlaps when needed and rely on async updates otherwise. Hosting region is chosen with you—not assumed.",
    recommendedServices: ["saas-development", "ai-development", "nextjs-development", "llm-applications"],
    faqs: [
      {
        question: "Can you host in EU/UK regions?",
        answer:
          "Yes when the cloud provider and architecture support it. Region choice is an explicit decision in discovery.",
      },
    ],
    ctaTitle: "London team evaluating a remote engineering partner?",
    ctaText: "Share the product domain, hosting constraints, and the first release goal.",
    ctaLabel: "Start a London conversation",
    metaTitle: "SaaS & AI Engineering for London Teams",
    metaDescription:
      "Remote SaaS, AI, and portal engineering for London product teams—clear collaboration across UK hours.",
  },
  dubai: {
    introTitle: "Delivery for Dubai enterprises and startups moving quickly",
    intro:
      "Dubai buyers often combine ambitious timelines with enterprise expectations around polish and control. We keep scope honest while designing for roles, audits, and multilingual-ready UI when needed.",
    environment:
      "Fast-moving enterprise and startup buyers seeking AI, automation, and custom platforms. Decision makers expect crisp communication.",
    industries: ["Enterprise services", "Logistics", "Proptech ops", "Fintech-adjacent"],
    challenges: [
      "Aggressive timelines vs durable architecture",
      "Multi-stakeholder approvals",
      "Integrations with regional vendors",
    ],
    useCases: [
      "Executive-facing dashboards with sober data",
      "Automation of status and document flows",
      "Customer portals for service businesses",
    ],
    collaboration:
      "Gulf time overlap is planned explicitly. We confirm decision owners early so speed does not erase accountability.",
    recommendedServices: ["ai-automation", "enterprise-software", "custom-software-development", "full-stack-development"],
    faqs: [
      {
        question: "Do you travel to Dubai for kickoff?",
        answer:
          "Remote-first is default. On-site kickoff can be arranged when the engagement size and timeline justify travel.",
      },
    ],
    ctaTitle: "Dubai initiative with a real launch date?",
    ctaText: "Tell us the stakeholders, the non-negotiables, and what can wait for phase two.",
    ctaLabel: "Scope a Dubai release",
    metaTitle: "Custom Software & Automation in Dubai",
    metaDescription:
      "AI automation, portals, and enterprise systems for Dubai teams that need speed without discarding controls.",
  },
  sydney: {
    introTitle: "Product engineering for Sydney SaaS and services companies",
    intro:
      "Sydney clients typically want clear English-language delivery, sensible architecture, and partners who respect Australian working hours for reviews. We document thoroughly so distributed teams stay aligned.",
    environment:
      "SaaS and services buyers who need durable systems and straightforward collaboration across AEST.",
    industries: ["SaaS", "Professional services", "Marketplaces", "Ops platforms"],
    challenges: [
      "Time-zone distance from India-based builders",
      "Expectations for clean UI and accessible content",
      "Integrations with common AU/US SaaS tools",
    ],
    useCases: [
      "SaaS MVP and foundations",
      "Client portals",
      "Automation between CRM and delivery tools",
    ],
    collaboration:
      "We book Sydney-friendly review slots and keep overnight progress visible in writing. No surprise deploys without notes.",
    recommendedServices: ["saas-development", "mvp-development", "crm-development", "website-development"],
    faqs: [
      {
        question: "How do you handle the time-zone gap?",
        answer:
          "Async-first updates, recorded decisions, and overlapping review windows. Critical launches get an agreed communication plan.",
      },
    ],
    ctaTitle: "Sydney product needing a steady remote partner?",
    ctaText: "Share the workflow, integrations, and the release that has to land cleanly.",
    ctaLabel: "Brief a Sydney engagement",
    metaTitle: "SaaS & Software Engineering for Sydney",
    metaDescription:
      "Remote SaaS, portals, and CRM-connected systems for Sydney teams—clear English delivery and documented handoffs.",
  },
}

export function getLocationNarrative(slug: string) {
  return locationNarratives[slug] ?? null
}
