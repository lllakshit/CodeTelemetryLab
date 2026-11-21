import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { Glyph, Rcube, SceneHero } from "@/components/site3d/site-3d-ui"
import { BRAND_NAME, buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: `About ${BRAND_NAME} | Engineering Philosophy & Working Principles`,
  description:
    "Why CodeTelemetryLab exists, how we approach projects, how we communicate, and how we measure success—without invented credentials.",
  path: "/about",
})

/** The four phases of the operating model (formerly the about illustration), shown as faces of the 3D ring. */
const operatingModel: Array<{ name: string; color: string; tint: string; icon: ReactNode }> = [
  {
    name: "Discover",
    color: "#3b5bdb",
    tint: "#e4eaff",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  },
  {
    name: "Build",
    color: "#e8912d",
    tint: "#fdebd6",
    icon: (
      <>
        <rect x="3" y="12" width="8" height="8" rx="2" />
        <rect x="13" y="12" width="8" height="8" rx="2" />
        <rect x="8" y="3" width="8" height="8" rx="2" />
      </>
    ),
  },
  {
    name: "Handoff",
    color: "#7a4fe0",
    tint: "#ece4ff",
    icon: (
      <>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
        <rect x="3" y="3" width="18" height="18" rx="5" />
      </>
    ),
  },
  {
    name: "Grow",
    color: "#12a37f",
    tint: "#dcf6ee",
    icon: (
      <>
        <path d="M5 19c1-4 3-6 7-8 4-2 6-4 7-7-4 1-6 3-8 7-2 4-4 6-8 7z" />
        <path d="m9 15-4 4" />
      </>
    ),
  },
]

const principles = [
  {
    title: "Clarify before coding",
    text: "Ambiguity is expensive in production. We spend early time on users, constraints, data ownership, and non-goals so implementation time is spent on the workflow that must work.",
  },
  {
    title: "Prefer operable systems",
    text: "A feature nobody can pause, audit, or explain is a liability. Logs, roles, and failure paths are part of design—not a polish pass after the demo.",
  },
  {
    title: "Write for the next engineer",
    text: "Naming, boundaries, and short decision notes matter more than clever abstractions. The codebase should survive the first staffing change.",
  },
  {
    title: "Tell the truth about scope",
    text: "We will not invent metrics, logos, or certainty. If a first release cannot include something, it goes on a written non-goals list.",
  },
]

/** System layers (formerly the SystemLayersDiagram), top to bottom. `l` pairs each row with its isometric layer. */
const layers = [
  { l: 3, label: "Interfaces", detail: "Web apps, portals, admin consoles" },
  { l: 2, label: "Application services", detail: "Auth, domain rules, validation, jobs" },
  { l: 1, label: "Data & events", detail: "Postgres, object storage, audit logs" },
  { l: 0, label: "Integrations", detail: "CRM, email, payments, model APIs" },
]

/** Isometric stack, bottom (0) to top (3). */
const isoLayers = [
  { pattern: "d-grid", c1: "#dfe7ff", c2: "#aebfff" },
  { pattern: "d-lines", c1: "#c9d6ff", c2: "#86a1ff" },
  { pattern: "d-bars", c1: "#b1c3ff", c2: "#5f7fff" },
  { pattern: "d-dots", c1: "#8fa8ff", c2: "#2b4fe0" },
]

const collaboration: Array<{ title: string; text: string; icon: ReactNode }> = [
  {
    title: "Communication",
    text: "Weekly working sessions, async updates in a shared channel, and decisions written where the team can find them later. Surprises belong in the product backlog—not in status reporting.",
    icon: <path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" />,
  },
  {
    title: "Quality bar",
    text: "Typed contracts where they prevent drift. Tests on irreversible paths. Accessibility basics on interactive surfaces. Review focused on failure modes, not only style.",
    icon: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  {
    title: "Long-term thinking",
    text: "We design seams for the next phase—billing, richer admin, extra integrations—without building them prematurely. Debt is named when we accept it.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
]

const faqs = [
  {
    q: "Why does CodeTelemetryLab exist?",
    a: "Because too many deliveries look finished in a slide and fail under operators. The practice exists to ship systems that remain understandable after launch.",
  },
  {
    q: "How do clients typically return?",
    a: "After a first release that was honest and operable—portals that need new modules, automation consoles that gain jobs, SaaS foundations that add billing. Continuity comes from trust in the boundary work, not from lock-in.",
  },
  {
    q: "How is success measured?",
    a: "Can operators run it? Can the next engineer change it safely? Did the release answer the business question you asked? Vanity traffic claims are not on that list.",
  },
]

/** Reveal delay for the i-th card in a row, `step` seconds apart. */
const stagger = (i: number, step: number) => `${(i * step).toFixed(2)}s`

export default function AboutPage() {
  return (
    <Site3DPage>
      <div className="wrap">
        <SceneHero
          id="h1-about"
          eyebrow="About"
          title="A software practice for teams who stay accountable after launch."
          lead={`${BRAND_NAME} exists to design and ship AI features, automation, SaaS products, and custom tools with the same seriousness we expect from production systems—not from pitch decks.`}
          scene="about"
          label="Interactive 3D field of blocks that rise where you move the pointer"
          hint="Move · tap · drag"
        />

        <section className="sec" aria-labelledby="about-model">
          <div className="sec-head rv">
            <p className="eyebrow-s" id="about-model">
              Operating model
            </p>
            <p className="h2" style={{ marginBottom: 0 }}>
              Discover, build, handoff, and grow — one partner from idea to production.
            </p>
          </div>
          <div
            className="ring3d rv"
            tabIndex={0}
            role="group"
            aria-label={`${BRAND_NAME} operating model: Discover, Build, Handoff, and Grow. Left and right arrow keys turn the ring.`}
          >
            <div className="ring3d-in" aria-hidden="true">
              {operatingModel.map((phase, i) => (
                <div key={phase.name} className="ring3d-face" style={vars({ "--c": phase.color, "--t": phase.tint })}>
                  <Glyph size={54} color={phase.color} width={1.7}>
                    {phase.icon}
                  </Glyph>
                  <i>{String(i + 1).padStart(2, "0")}</i>
                  <b>{phase.name}</b>
                </div>
              ))}
            </div>
          </div>
          <p className="ring3d-hint" aria-hidden="true">
            Drag to rotate · tap a phase
          </p>
        </section>

        <section className="sec">
          <div className="card philo rv" data-tilt="2">
            <div className="z2">
              <h2 className="big">Engineering philosophy</h2>
            </div>
            <div className="z1">
              <p className="muted" style={{ fontSize: 17 }}>
                Software fails in the seams: unclear ownership, missing validation, silent jobs, and interfaces that hide
                state. Our philosophy is to make those seams visible. Discovery produces a decision log. Architecture
                produces boundaries. Implementation produces vertical slices. Handoff produces runbooks. If a step does
                not leave an artifact someone else can use, it is incomplete.
              </p>
              <p className="muted" style={{ fontSize: 17 }}>
                We are comfortable saying no to scope that would make the first release dishonest. That is not austerity
                for its own sake—it is how you learn whether the product works before you decorate it.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-head rv">
            <h2 className="h2">Working principles</h2>
          </div>
          <div className="prin">
            {principles.map((item, i) => (
              <article key={item.title} className="card rv" data-tilt="5" style={vars({ "--d": stagger(i, 0.07) })}>
                <span className="num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="h3 z2">{item.title}</h3>
                <p className="z1">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="card sysgrid rv" data-tilt="2" data-layers="">
            <div className="z1">
              <p className="eyebrow-s">Problem solving</p>
              <h2 className="h2">Start from the operating pain, then choose tools.</h2>
              <p className="muted">
                Model choice, framework choice, and vendor choice come after we understand the workflow, data, and review
                capacity. Layers stay separable so AI features, portals, and integrations can evolve independently.
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
                  {isoLayers.map((l, i) => (
                    <i
                      key={l.pattern}
                      className={`iso-l ${l.pattern}`}
                      data-i={i}
                      style={vars({ "--i": String(i), "--c1": l.c1, "--c2": l.c2 })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-head rv">
            <h2 className="h2">Collaboration model</h2>
          </div>
          <div className="collab">
            {collaboration.map((item, i) => (
              <article key={item.title} className="card rv" data-tilt="5" style={vars({ "--d": stagger(i, 0.08) })}>
                <div className="ibadge">
                  <Glyph>{item.icon}</Glyph>
                </div>
                <h3 className="h3 z2">{item.title}</h3>
                <p className="z1">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="card rv" data-tilt="2" style={{ padding: "clamp(22px,3vw,40px)" }}>
            <h2 className="h2 z1">About FAQs</h2>
            <div className="faqs z1">
              {faqs.map((item, i) => (
                <div key={item.q} className={`faq-item${i === 0 ? " open" : ""}`}>
                  <h3 className="faq-h">
                    <button type="button" className="faq-q" id={`aq${i}`} aria-expanded={i === 0} aria-controls={`aa${i}`}>
                      <span>{item.q}</span>
                      <i className="chev" aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="faq-a" id={`aa${i}`} role="region" aria-labelledby={`aq${i}`}>
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
              <h2 className="h2">See how an engagement would feel on your problem.</h2>
              <p className="muted">Read the process, skim a case study, or send a brief. We reply with clarity—not a script.</p>
              <Link className="btn ghost" href="/process">
                Delivery process
              </Link>
              <Link className="btn" href="/contact">
                Contact
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
