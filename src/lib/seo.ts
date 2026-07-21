function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/$/, "")
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (
    trimmed.startsWith("localhost") ||
    trimmed.startsWith("127.") ||
    trimmed.startsWith("0.0.0.0")
  ) {
    return `http://${trimmed}`
  }
  return `https://${trimmed}`
}

export const SITE_URL =
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeSiteUrl(process.env.NEXTAUTH_URL) ||
  normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  "https://www.codetelemetrylab.me"

/** Canonical public brand — matches domain and brand search queries. */
export const BRAND_NAME = "CodeTelemetryLab"
export const BRAND_ALTERNATE_NAMES = ["CodeTelemetry Lab", "CodeTelemetryLabs", "CodeTelemetry"]
export const BRAND_TAGLINE = "Code. Automate. Elevate."
export const BRAND_EMAIL = "contact@codetelemetrylab.me"

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "ProfessionalService"],
  name: BRAND_NAME,
  legalName: BRAND_NAME,
  alternateName: BRAND_ALTERNATE_NAMES,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/ct-labs-mark.png`,
  image: `${SITE_URL}/brand/ct-labs-logo.png`,
  email: BRAND_EMAIL,
  description:
    "CodeTelemetryLab is an international software agency specializing in AI development, automation, SaaS, MVP, and custom software for startups and product teams.",
  slogan: BRAND_TAGLINE,
  foundingLocation: {
    "@type": "Place",
    name: "Jaipur, India",
  },
  areaServed: [
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Australia" },
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "India" },
  ],
  serviceType: [
    "AI Development",
    "AI Automation",
    "LLM Applications",
    "AI Agents",
    "Custom Software Development",
    "SaaS Development",
    "MVP Development",
    "Full Stack Development",
    "React Development",
    "Next.js Development",
    "Node.js Development",
    "Python Development",
    "Workflow Automation",
    "CRM Development",
    "API Development",
    "Business Automation",
    "Startup Product Development",
    "Website Development",
    "Enterprise Software",
  ],
  knowsAbout: [
    "AI agents",
    "LLM applications",
    "Next.js",
    "React",
    "Node.js",
    "Python",
    "SaaS architecture",
    "Technical SEO",
  ],
  // Add real profile URLs when available (LinkedIn, GitHub, X) to strengthen brand entity.
  sameAs: [] as string[],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: BRAND_EMAIL,
      availableLanguage: ["English", "Hindi"],
    },
  ],
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  alternateName: BRAND_ALTERNATE_NAMES,
  url: SITE_URL,
  description:
    "CodeTelemetryLab — AI development, automation, SaaS, MVP, and custom software for international product teams.",
  publisher: {
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/ct-labs-mark.png`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function serviceJsonLd(input: {
  name: string
  description: string
  path: string
  areaServed?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    provider: {
      "@type": "ProfessionalService",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    areaServed: input.areaServed
      ? { "@type": "City", name: input.areaServed }
      : organizationJsonLd.areaServed,
    url: absoluteUrl(input.path),
  }
}

export function buildPageMetadata(input: {
  title: string
  description: string
  path: string
  keywords?: string[]
}) {
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      siteName: BRAND_NAME,
      images: ["/brand/ct-labs-logo.png"],
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: input.title,
      description: input.description,
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : absoluteUrl(item.path),
    })),
  }
}
