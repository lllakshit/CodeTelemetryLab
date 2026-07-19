import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"

export const metadata: Metadata = {
  title: "About | Engineering Partner for AI & Software Delivery",
  description:
    "CodeTelemetryLabs is a remote-first software agency focused on AI, automation, SaaS, and custom product delivery with release discipline and clear handoff.",
  alternates: { canonical: "/about" },
}

const values = [
  {
    title: "Mission",
    text: "Build software that is reliable enough for production and readable enough for handoff.",
  },
  {
    title: "Engineering philosophy",
    text: "Reduce the problem to a stable release path, then expand the system only after the foundation is trustworthy.",
  },
  {
    title: "Quality standard",
    text: "Clear typography, disciplined spacing, predictable data flow, and operational tools that match the public site quality.",
  },
]

const workflow = [
  {
    label: "01",
    title: "Clarify the release target",
    text: "We start with the actual launch surface, the content owner, and the environment assumptions instead of pretending those decisions can wait.",
  },
  {
    label: "02",
    title: "Build the smallest credible system",
    text: "The first pass favors clarity, delivery speed, and maintainability over feature sprawl or decorative complexity.",
  },
  {
    label: "03",
    title: "Handoff with structure",
    text: "We leave behind documentation, environment notes, and a clear operating path that future collaborators can actually use.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="About"
          title="An engineering partner built around release discipline, not presentation theater."
          description="CodeTelemetryLabs is designed for teams that want the first public release to feel credible to customers, operators, and future developers at the same time."
          level={1}
        />
        <BrandIllustration variant="about" />
      </div>

      <div className="mt-16 border-t border-slate-200">
        {values.map((item) => (
          <article key={item.title} className="grid gap-4 border-b border-slate-200 py-8 lg:grid-cols-[0.32fr_0.68fr]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">{item.title}</p>
            <p className="max-w-3xl text-lg leading-8 text-slate-700">{item.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[0.42fr_0.58fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-700">Workflow</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950 sm:text-4xl">
            The working style is simple on purpose.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            The goal is to make good decisions early, keep the implementation narrow, and leave the site in a state that a real team can extend later.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-t border-slate-200">
          {workflow.map((item) => (
            <article key={item.label} className="grid gap-3 py-6 md:grid-cols-[4rem_1fr]">
              <p className="text-sm font-semibold text-blue-700">{item.label}</p>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-300">Working style</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
              Calm process, serious delivery, and no template-shop posturing.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              That means realistic timelines, practical architecture choices, and surfaces that can evolve into portals, operations tools, or internal systems without being rebuilt from zero.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Start a conversation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
