/** Shared, framework-free data for the home page, so the page, the in-page navigation and the tests agree. */

/** The services shown on the home page, in the order they appear (the order comes from seoServices). */
export const spotlightSlugs = [
  "ai-development",
  "ai-automation",
  "saas-development",
  "custom-software-development",
  "mvp-development",
  "api-development",
] as const

/** Short label and 3D icon index for each spotlight service. Names and links come from seoServices. */
export const serviceMeta: Record<string, { short: string; glyph: number }> = {
  "ai-development": { short: "AI Development", glyph: 0 },
  "ai-automation": { short: "AI Automation", glyph: 1 },
  "custom-software-development": { short: "Custom Software", glyph: 2 },
  "saas-development": { short: "SaaS", glyph: 3 },
  "mvp-development": { short: "MVP", glyph: 4 },
  "api-development": { short: "API", glyph: 5 },
}

export type HomeSection = { id: string; label: string }

/** Every anchor on the page, top to bottom. "notes" exists only when there are published posts. */
export const homeSections: HomeSection[] = [
  { id: "hero", label: "Overview" },
  { id: "who", label: "Who we help" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "tech", label: "Technologies" },
  { id: "work", label: "Work" },
  { id: "why", label: "Why teams work with us" },
  { id: "faq", label: "Questions" },
  { id: "contact", label: "Contact" },
  { id: "notes", label: "Notes" },
]

/** The six stops shown as desktop dots. Each owns the neighbouring sections that share its 3D scene. */
export const homeStops: Array<HomeSection & { owns: string[] }> = [
  { id: "hero", label: "Overview", owns: ["hero", "who"] },
  { id: "services", label: "Services", owns: ["services"] },
  { id: "process", label: "Process", owns: ["process", "tech"] },
  { id: "work", label: "Work", owns: ["work"] },
  { id: "why", label: "Delivery", owns: ["why", "faq"] },
  { id: "contact", label: "Contact", owns: ["contact", "notes"] },
]
