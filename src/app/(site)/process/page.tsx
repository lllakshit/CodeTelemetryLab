import type { Metadata } from "next"
import Link from "next/link"
import { processSteps } from "@/components/diagrams/engineering-diagrams"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { Rcube, SceneHero } from "@/components/site3d/site-3d-ui"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Process | How CodeTelemetryLab Delivers Software",
  description:
    "Discovery, architecture, build, review, deployment, monitoring, and maintenance—how CodeTelemetryLab runs engineering engagements.",
  path: "/process",
})

const stages = [
  {
    title: "Discovery",
    text: "We map users, constraints, environments, success criteria, and non-goals. Feasibility covers data readiness and ownership—not only UI ambition. You leave discovery with a written scope and decision log.",
  },
  {
    title: "Requirements & architecture",
    text: "Domain language becomes a data model. Boundaries between public surfaces, APIs, and jobs are drawn early. Security expectations (roles, audits, secrets) are part of the design, not a late checklist.",
  },
  {
    title: "UI / UX",
    text: "Interfaces follow the workflow. We prioritize clarity for operators over decorative density. Accessibility basics—focus order, labels, contrast—are included in the definition of done.",
  },
  {
    title: "Development",
    text: "Work lands in vertical slices you can review. Typed contracts reduce frontend/backend drift. Feature flags keep incomplete work out of production paths.",
  },
  {
    title: "Code review & testing",
    text: "Reviews look for correctness, naming, and failure modes. Tests cover critical paths: auth, money-adjacent flows, and irreversible actions. We do not pretend 100% coverage when it is not true.",
  },
  {
    title: "Deployment",
    text: "Preview environments, migration plans, and rollback notes ship with the release. Environment variables and secrets are documented so the next deploy is not folklore.",
  },
  {
    title: "Monitoring & iteration",
    text: "Logs, basic product events, and error visibility tell us what broke. Iteration is driven by observed behavior—not by a backlog of speculative features.",
  },
  {
    title: "Maintenance & support",
    text: "Retainer or project follow-ons cover dependency updates, small enhancements, and operational questions. Handoff materials exist even if you never hire us again.",
  },
]

/** The four system layers, top to bottom (same wording as SystemLayersDiagram). `l` is the matching slab in the stack, 0 = bottom. */
const layers = [
  { l: 3, label: "Interfaces", detail: "Web apps, portals, admin consoles" },
  { l: 2, label: "Application services", detail: "Auth, domain rules, validation, jobs" },
  { l: 1, label: "Data & events", detail: "Postgres, object storage, audit logs" },
  { l: 0, label: "Integrations", detail: "CRM, email, payments, model APIs" },
]

/** Isometric slabs, bottom to top: surface pattern and gradient colours. */
const slabs = [
  { pattern: "d-grid", c1: "#dfe7ff", c2: "#aebfff" },
  { pattern: "d-lines", c1: "#c9d6ff", c2: "#86a1ff" },
  { pattern: "d-bars", c1: "#b1c3ff", c2: "#5f7fff" },
  { pattern: "d-dots", c1: "#8fa8ff", c2: "#2b4fe0" },
]

const faqs = [
  {
    q: "How often do we meet during a build?",
    a: "Typically a weekly working session plus async updates in a shared channel. Critical decisions get written down so they survive the meeting.",
  },
  {
    q: "Who owns the repository?",
    a: "You do. We work in your git hosting when possible and leave access, docs, and deploy instructions with your team.",
  },
  {
    q: "What happens after launch?",
    a: "A short stabilization window is common. After that, either a retainer for ongoing work or a clean handoff with runbooks.",
  },
]

const num = (i: number) => String(i + 1).padStart(2, "0")
const sceneLabel = `Interactive 3D path through the ${processSteps.length} delivery stages: ${processSteps.map((s) => s.label).join(", ")}`

export default function ProcessPage() {
  return (
    <Site3DPage>
      <div className="wrap">
        <SceneHero
          id="h1-process"
          eyebrow="Process"
          title="How engagements run from first brief to systems your team can operate."
          lead="The sequence is intentionally boring: clarify, design boundaries, ship slices, harden, then leave the lights on."
          scene="process"
          label={sceneLabel}
          hint="Drag · tap a stage"
          dots={processSteps.map((s, i) => `Stage ${num(i)}: ${s.label}`)}
          steps={processSteps.map((s) => `${s.label} — ${s.sub}`)}
        />

        {/* One key per stage: the process scene builds a 3D card from each key and turns the helix when one is clicked. */}
        <div className="strip rv" role="group" aria-label="Delivery stages">
          {processSteps.map((s, i) => (
            <button key={s.label} type="button" className="key" aria-current={i === 0 ? "true" : "false"}>
              <b>{num(i)}</b>
              <strong>{s.label}</strong>
              <span>{s.sub}</span>
            </button>
          ))}
        </div>

        <section className="sec" aria-label="Engagement steps">
          <ol className="tl" id="tl">
            {stages.map((stage, i) => (
              <li key={stage.title} className="tl-i rv">
                <span className="tl-n" aria-hidden="true">
                  {num(i)}
                </span>
                <div className="card tl-c" data-tilt="4">
                  <h2 className="h3 z1">{stage.title}</h2>
                  <p className="z1">{stage.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec">
          <div className="card sysgrid rv" data-tilt="2" data-layers="">
            <div className="z1">
              <p className="eyebrow-s">System shape</p>
              <h2 className="h2">We design in layers so change stays local.</h2>
              <p className="muted">
                Interfaces, application services, data, and integrations stay separable. That is how a portal can grow an
                automation console without rewriting auth for the third time.
              </p>
              <p style={{ marginTop: 16 }}>
                <Link className="rc" href="/services">
                  Browse services
                </Link>
              </p>
              <ul className="layer-list" aria-label="System layers from interface to data and integrations">
                {layers.map((layer) => (
                  <li key={layer.label} tabIndex={0} data-l={layer.l}>
                    <b>{layer.label}</b>
                    <span>{layer.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="z2">
              <div className="iso big" aria-hidden="true">
                <div className="iso-stack">
                  {slabs.map((slab, i) => (
                    <i
                      key={slab.pattern}
                      className={`iso-l ${slab.pattern}`}
                      data-i={i}
                      style={vars({ "--i": String(i), "--c1": slab.c1, "--c2": slab.c2 })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="card rv" data-tilt="2" style={{ padding: "clamp(22px,3vw,40px)" }}>
            <h2 className="h2 z1">Process FAQs</h2>
            <div className="faqs z1">
              {faqs.map((item, i) => (
                <div key={item.q} className={i === 0 ? "faq-item open" : "faq-item"}>
                  <h3 className="faq-h">
                    <button
                      type="button"
                      className="faq-q"
                      id={`pq${i}`}
                      aria-expanded={i === 0 ? "true" : "false"}
                      aria-controls={`pa${i}`}
                    >
                      <span>{item.q}</span>
                      <i className="chev" aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="faq-a" id={`pa${i}`} role="region" aria-labelledby={`pq${i}`}>
                    <div>
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" style={{ paddingBottom: 80 }}>
          <div className="card cta rv" data-tilt="3">
            <div className="z2">
              <h2 className="h2">Want this cadence on your next release?</h2>
              <p className="muted">
                Send a brief with the problem, users, and deadline. We will reply with whether the work fits and what a first
                slice should include.
              </p>
              <Link className="btn" href="/contact">
                Start with a brief
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
