import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SystemLayersDiagram } from "@/components/diagrams/engineering-diagrams"
import { SectionHeading } from "@/components/section-heading"
import { BRAND_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `About ${BRAND_NAME} | Engineering Philosophy & Working Principles`,
  description:
    "Why CodeTelemetryLab exists, how we approach projects, how we communicate, and how we measure success—without invented credentials.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${BRAND_NAME}`,
    images: ["/brand/about-us.png"],
  },
}

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

const collaboration = [
  {
    title: "Communication",
    text: "Weekly working sessions, async updates in a shared channel, and decisions written where the team can find them later. Surprises belong in the product backlog—not in status reporting.",
  },
  {
    title: "Quality bar",
    text: "Typed contracts where they prevent drift. Tests on irreversible paths. Accessibility basics on interactive surfaces. Review focused on failure modes, not only style.",
  },
  {
    title: "Long-term thinking",
    text: "We design seams for the next phase—billing, richer admin, extra integrations—without building them prematurely. Debt is named when we accept it.",
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

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="About"
          title="A software practice for teams who stay accountable after launch."
          description={`${BRAND_NAME} exists to design and ship AI features, automation, SaaS products, and custom tools with the same seriousness we expect from production systems—not from pitch decks.`}
          level={1}
        />
        <BrandIllustration variant="about" />
      </div>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-3xl font-medium tracking-tight text-slate-950">Engineering philosophy</h2>
        <p className="mt-5 text-base leading-8 text-slate-700">
          Software fails in the seams: unclear ownership, missing validation, silent jobs, and interfaces that hide
          state. Our philosophy is to make those seams visible. Discovery produces a decision log. Architecture
          produces boundaries. Implementation produces vertical slices. Handoff produces runbooks. If a step does not
          leave an artifact someone else can use, it is incomplete.
        </p>
        <p className="mt-5 text-base leading-8 text-slate-700">
          We are comfortable saying no to scope that would make the first release dishonest. That is not austerity for
          its own sake—it is how you learn whether the product works before you decorate it.
        </p>
      </section>

      <section className="mt-16 border-t border-slate-200">
        <h2 className="pt-10 text-3xl font-medium tracking-tight text-slate-950">Working principles</h2>
        <div className="mt-8 divide-y divide-slate-200">
          {principles.map((item) => (
            <article key={item.title} className="grid gap-4 py-8 lg:grid-cols-[0.32fr_0.68fr]">
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Problem solving</p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-slate-950">
            Start from the operating pain, then choose tools.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Model choice, framework choice, and vendor choice come after we understand the workflow, data, and review
            capacity. Layers stay separable so AI features, portals, and integrations can evolve independently.
          </p>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4">
          <SystemLayersDiagram className="h-auto w-full" />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-medium tracking-tight text-slate-950">Collaboration model</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {collaboration.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
        <h2 className="text-2xl font-medium text-slate-950">About FAQs</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="text-lg font-medium text-slate-950">{item.q}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-medium text-white">See how an engagement would feel on your problem.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Read the process, skim a case study, or send a brief. We reply with clarity—not a script.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/process"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
          >
            Delivery process
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  )
}
