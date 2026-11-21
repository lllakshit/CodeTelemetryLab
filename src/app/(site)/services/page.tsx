import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { BADGE_PAIRS, Glyph, Rcube, SceneHero, revealDelay } from "@/components/site3d/site-3d-ui"
import { buildPageMetadata } from "@/lib/seo"
import { seoServices } from "@/lib/seo-markets"

export const metadata: Metadata = buildPageMetadata({
  title: "Services | AI, Automation, SaaS & Custom Software",
  description:
    "Engineering services from CodeTelemetryLab: AI development, automation, SaaS foundations, APIs, and custom software—each page explains problems, approach, and FAQs.",
  path: "/services",
})

/** Card icon (24x24 line art) and the matching 3D card glyph for each service. Unknown slugs fall back to a generic icon. */
const serviceArt: Record<string, { icon: ReactNode; glyph: string }> = {
  "ai-development": { icon: <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />, glyph: "blocks" },
  "ai-automation": { icon: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />, glyph: "pulse" },
  "llm-applications": { icon: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></>, glyph: "chat" },
  "ai-agents": { icon: <><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 8V4M9 13h.01M15 13h.01" /></>, glyph: "search" },
  "custom-software-development": { icon: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />, glyph: "blueprint" },
  "saas-development": { icon: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>, glyph: "dollar" },
  "mvp-development": { icon: <><path d="M5 19c1-4 3-6 7-8 4-2 6-4 7-7-4 1-6 3-8 7-2 4-4 6-8 7z" /><path d="m9 15-4 4" /></>, glyph: "rocket" },
  "full-stack-development": { icon: <><rect x="4" y="4" width="16" height="6" rx="2" /><rect x="4" y="14" width="16" height="6" rx="2" /></>, glyph: "blocks" },
  "react-development": {
    icon: (
      <>
        <circle cx="12" cy="12" r="1.8" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
      </>
    ),
    glyph: "blueprint",
  },
  "nextjs-development": { icon: <><circle cx="12" cy="12" r="9" /><path d="M9 8v8M9 8l7 9" /></>, glyph: "doc" },
  "nodejs-development": { icon: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />, glyph: "pulse" },
  "python-development": { icon: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m7 10 3 2-3 2M13 15h4" /></>, glyph: "doc" },
  "workflow-automation": {
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="12" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8.5 6h4a3 3 0 0 1 3 3v.5M8.5 18h4a3 3 0 0 0 3-3v-.5" />
      </>
    ),
    glyph: "check",
  },
  "crm-development": {
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M17.5 14.6c2.3.3 3.8 1.8 4.3 4.4" />
      </>
    ),
    glyph: "chat",
  },
  "api-development": { icon: <path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3" />, glyph: "blocks" },
  "business-automation": {
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
    glyph: "pulse",
  },
  "startup-product-development": { icon: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>, glyph: "rocket" },
  "website-development": { icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>, glyph: "blueprint" },
  "enterprise-software": { icon: <><path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6z" /><path d="m8.5 12 2.5 2.5L16 9.5" /></>, glyph: "shield" },
}
const fallbackArt = { icon: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />, glyph: "blocks" }

export default function ServicesPage() {
  return (
    <Site3DPage>
      <div className="wrap">
        <SceneHero
          id="h1-services"
          eyebrow="Services"
          title="Engineering services for product launches and operating systems."
          lead="Pick a focus area to read how we approach the work—problems, architecture, stack, and the questions teams usually ask before starting."
          scene="services"
          label={`Interactive 3D coverflow of the ${seoServices.length} engineering service areas`}
          hint="Drag · tap a card · tap again to jump"
        />

        <section className="sec" style={{ paddingTop: 10 }} aria-label="Services">
          <div className="svcs">
            {seoServices.map((service, i) => {
              const art = serviceArt[service.slug] ?? fallbackArt
              const [c1, c2] = BADGE_PAIRS[i % BADGE_PAIRS.length]
              return (
                <article
                  key={service.slug}
                  className="card svc rv"
                  data-tilt="5"
                  data-name={service.name}
                  data-icon={art.glyph}
                  style={vars({ "--d": revealDelay(i), "--c1": c1, "--c2": c2 })}
                >
                  <span className="idx" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="ibadge">
                    <Glyph>{art.icon}</Glyph>
                  </div>
                  <h2 className="h3 z2">{service.name}</h2>
                  <p className="z1">{service.description}</p>
                  <Link className="rc" href={`/services/${service.slug}`}>
                    Read the approach
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="sec" style={{ paddingBottom: 80 }}>
          <div className="card cta rv" data-tilt="3">
            <div className="z2">
              <h2 className="h2">Not sure which service fits?</h2>
              <p className="muted">
                Describe the workflow and constraints. We will point you to the right engagement shape—or tell you if the
                problem is not a fit.
              </p>
              <Link className="btn" href="/contact">
                Send a brief
              </Link>
              <Link className="btn ghost" href="/process">
                See the process
              </Link>
            </div>
            <div className="cta-art" aria-hidden="true">
              <Rcube />
            </div>
          </div>
        </section>
      </div>
    </Site3DPage>
  )
}
