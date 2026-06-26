export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "https://codetelemetrylab.me"

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "CodeTelemetryLabs",
  url: SITE_URL,
  email: "contact@codetelemetrylab.me",
  areaServed: ["United States", "Canada"],
  serviceType: [
    "Custom software development",
    "SaaS development",
    "AI automation",
    "API engineering",
    "Cloud infrastructure",
    "Technical SEO",
  ],
  sameAs: [],
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
