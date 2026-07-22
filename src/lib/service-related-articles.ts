/** Curated related reading for service detail pages — published blog slugs only. */
export const serviceRelatedArticles: Record<string, { slug: string; title: string }[]> = {
  "saas-development": [
    {
      slug: "build-scalable-saas-mvp-without-overbuilding",
      title: "Build a scalable SaaS MVP without overbuilding",
    },
    {
      slug: "subscription-billing-integration-saas-products",
      title: "Subscription billing integration for SaaS products",
    },
    {
      slug: "saas-onboarding-ux-best-practices-b2b-products",
      title: "B2B SaaS onboarding UX practices",
    },
  ],
  "mvp-development": [
    {
      slug: "mvp-development-cost-startup-founders",
      title: "What MVP development actually costs",
    },
    {
      slug: "product-discovery-workshop-before-mvp-development",
      title: "Discovery before MVP code",
    },
    {
      slug: "build-scalable-saas-mvp-without-overbuilding",
      title: "Scalable SaaS MVP without overbuilding",
    },
  ],
  "startup-product-development": [
    {
      slug: "product-discovery-workshop-before-mvp-development",
      title: "Discovery before MVP code",
    },
    {
      slug: "mvp-development-cost-startup-founders",
      title: "What MVP development actually costs",
    },
  ],
  "ai-automation": [
    {
      slug: "ai-automation-consultant-small-business-workflows",
      title: "What an AI automation consultant actually does",
    },
    {
      slug: "ai-automation-vs-hiring-assistant",
      title: "AI automation vs hiring an assistant",
    },
    {
      slug: "business-automation-workflow-examples-agencies",
      title: "Automation workflow examples for agencies",
    },
  ],
  "business-automation": [
    {
      slug: "business-automation-service-companies",
      title: "Business automation for service companies",
    },
    {
      slug: "business-automation-workflow-examples-agencies",
      title: "Automation workflow examples for agencies",
    },
  ],
  "workflow-automation": [
    {
      slug: "business-automation-workflow-examples-agencies",
      title: "Automation workflow examples for agencies",
    },
    {
      slug: "ai-automation-consultant-small-business-workflows",
      title: "AI automation for small-business workflows",
    },
  ],
  "ai-development": [
    {
      slug: "ai-automation-consultant-small-business-workflows",
      title: "AI automation consultant workflows",
    },
    {
      slug: "crm-integration-ai-follow-up-sales-teams",
      title: "CRM integration with AI follow-up",
    },
  ],
  "ai-agents": [
    {
      slug: "chatbot-lead-qualification-service-website",
      title: "Chatbots for lead qualification",
    },
    {
      slug: "crm-integration-ai-follow-up-sales-teams",
      title: "AI-assisted CRM follow-up",
    },
  ],
  "llm-applications": [
    {
      slug: "ai-automation-vs-hiring-assistant",
      title: "AI automation vs hiring an assistant",
    },
    {
      slug: "chatbot-lead-qualification-service-website",
      title: "Chatbots for lead qualification",
    },
  ],
  "crm-development": [
    {
      slug: "custom-crm-development-cost-us-canada",
      title: "Custom CRM development cost",
    },
    {
      slug: "laravel-vs-nodejs-custom-crm-build",
      title: "Laravel vs Node.js for a custom CRM",
    },
    {
      slug: "crm-integration-ai-follow-up-sales-teams",
      title: "CRM integration with AI follow-up",
    },
  ],
  "api-development": [
    {
      slug: "api-development-cost-business-integrations",
      title: "What drives API development cost",
    },
    {
      slug: "laravel-vs-nodejs-custom-crm-build",
      title: "Laravel vs Node.js for backend systems",
    },
  ],
  "custom-software-development": [
    {
      slug: "client-portal-development-b2b-saas-teams",
      title: "Client portal development for B2B teams",
    },
    {
      slug: "outsourcing-web-development-remote-team",
      title: "Outsourcing to a remote engineering team",
    },
  ],
  "full-stack-development": [
    {
      slug: "nextjs-vs-wordpress-saas-marketing-site",
      title: "Next.js vs WordPress for SaaS marketing sites",
    },
    {
      slug: "website-security-checklist-before-hiring-developer",
      title: "Security questions before hiring a developer",
    },
  ],
  "nextjs-development": [
    {
      slug: "nextjs-vs-wordpress-saas-marketing-site",
      title: "Next.js vs WordPress for SaaS marketing sites",
    },
  ],
  "website-development": [
    {
      slug: "website-maintenance-plan-small-business",
      title: "What a website maintenance plan should cover",
    },
    {
      slug: "website-security-checklist-before-hiring-developer",
      title: "Security questions before hiring a developer",
    },
  ],
  "enterprise-software": [
    {
      slug: "client-portal-development-b2b-saas-teams",
      title: "Client portal development for B2B teams",
    },
    {
      slug: "remote-team-collaboration-tools-client-portals",
      title: "Remote tooling and client portals",
    },
  ],
}

export function getRelatedArticlesForService(serviceSlug: string) {
  return serviceRelatedArticles[serviceSlug] ?? []
}
