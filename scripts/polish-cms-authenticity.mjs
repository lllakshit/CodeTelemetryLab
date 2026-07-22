#!/usr/bin/env node
/**
 * One-shot content authenticity pass for cms-store.json
 * - Rewrite homepage copy
 * - Unpublish templated CMS blogs
 * - Keep only curated featured projects published; demote Mad Libs portfolio
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.join(__dirname, "..", "data", "cms-store.json")
const store = JSON.parse(fs.readFileSync(storePath, "utf8"))

store.homepage = {
  ...store.homepage,
  heroEyebrow: "Software engineering for product teams",
  heroTitle: "Build the system your operators can run—not a slide deck that looks finished.",
  heroDescription:
    "CodeTelemetryLab designs and ships AI features, automation workflows, SaaS products, and custom software for startups and operating teams across North America, Europe, the UAE, Australia, and India.",
  primaryCtaLabel: "Send a project brief",
  primaryCtaHref: "/contact",
  secondaryCtaLabel: "See selected work",
  secondaryCtaHref: "/projects",
  services: [
    {
      title: "AI Automation",
      description:
        "Workflow automation and practical AI features that remove repetitive work while keeping human review where it matters.",
      notes: "Operations & support",
    },
    {
      title: "Web Development",
      description:
        "Public sites, portals, and dashboards in React and Next.js—fast enough for customers, clear enough for your team to maintain.",
      notes: "Sites & portals",
    },
    {
      title: "SaaS Platforms",
      description:
        "Multi-tenant products with authentication, roles, and operational foundations that can grow without a rewrite.",
      notes: "MVP to platform",
    },
    {
      title: "API Engineering",
      description:
        "Backend services, integrations, and sync jobs with explicit boundaries so data stays consistent as volume grows.",
      notes: "Integrations & APIs",
    },
    {
      title: "Technical Documentation",
      description:
        "Runbooks, product docs, and onboarding material so the system survives the first staffing change.",
      notes: "Handoff & ops",
    },
    {
      title: "Cloud Infrastructure",
      description:
        "Deployment architecture, environments, and observability tuned for reliability—not for demo day.",
      notes: "Delivery & hosting",
    },
  ],
  testimonials: [],
  stats: [
    { label: "Typical first release", value: "2–8 weeks" },
    { label: "Time-zone overlap", value: "Americas & Asia" },
    { label: "Engagement model", value: "Project or retainer" },
  ],
  process: [
    {
      title: "Discover",
      description:
        "Map the operating problem, users, constraints, and success criteria before writing production code.",
    },
    {
      title: "Build",
      description:
        "Ship the smallest useful release, validate with real workflows, then harden the edges that fail first.",
    },
    {
      title: "Stabilize",
      description:
        "Document environments, ownership, and the next release path so your team can run the system without us.",
    },
  ],
  ctaTitle: "Ready to scope a release that has to work in production?",
  ctaDescription:
    "Send a short brief: the problem, who uses the system, the deadline, and any tools that must connect. We reply with a clear next step within one business day.",
}

const keepPublishedSlugs = new Set([
  "client-portal-redesign",
  "internal-automation-console",
  "phase-one-saas-foundation",
])

if (Array.isArray(store.projects)) {
  store.projects = store.projects.map((project) => {
    const keep = keepPublishedSlugs.has(project.slug)
    return {
      ...project,
      isPublished: keep,
      featured: keep,
    }
  })
}

if (Array.isArray(store.blogs)) {
  store.blogs = store.blogs.map((blog) => ({
    ...blog,
    isPublished: false,
  }))
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + "\n", "utf8")
console.log("Updated cms-store.json")
console.log(
  "Published projects:",
  store.projects.filter((p) => p.isPublished).map((p) => p.slug),
)
console.log("CMS blogs published:", store.blogs.filter((b) => b.isPublished).length)
