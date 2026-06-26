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
