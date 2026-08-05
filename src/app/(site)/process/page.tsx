import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProcessFlowDiagram, SystemLayersDiagram } from "@/components/diagrams/engineering-diagrams"
import { SectionHeading } from "@/components/section-heading"
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

export default function ProcessPage() {
  return (
    <div className="site-page">
      <SectionHeading
        eyebrow="Process"
        title="How engagements run from first brief to systems your team can operate."
        description="The sequence is intentionally boring: clarify, design boundaries, ship slices, harden, then leave the lights on."
        level={1}
      />

      <div className="mt-16 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-6">
        <ProcessFlowDiagram className="h-auto w-full" />
      </div>

      <div className="mt-16 divide-y divide-slate-200 border-t border-slate-200">
        {stages.map((stage, index) => (
          <article key={stage.title} className="grid gap-4 py-8 lg:grid-cols-[0.22fr_0.78fr]">
            <p className="text-sm font-semibold text-blue-700">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-slate-950">{stage.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{stage.text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">System shape</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">
            We design in layers so change stays local.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Interfaces, application services, data, and integrations stay separable. That is how a portal can grow an
            automation console without rewriting auth for the third time.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
          >
            Browse services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4">
          <SystemLayersDiagram className="h-auto w-full" />
        </div>
      </div>

      <section className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">Process FAQs</h2>
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
        <h2 className="text-3xl font-medium tracking-tight text-white">Want this cadence on your next release?</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Send a brief with the problem, users, and deadline. We will reply with whether the work fits and what a first
          slice should include.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
        >
          Start with a brief
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
