import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { BRAND_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `About ${BRAND_NAME} | Engineering Partner for Product Teams`,
  description:
    "CodeTelemetryLab is a remote-first software practice focused on AI features, automation, SaaS products, and custom systems with clear scope and durable handoff.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${BRAND_NAME}`,
    description:
      "How CodeTelemetryLab approaches discovery, build, and handoff for product and operations teams.",
    images: ["/brand/about-us.png"],
  },
}

const values = [
  {
    title: "Mission",
    text: "Help teams ship software that works in production and remains understandable when the next engineer opens the repo.",
  },
  {
    title: "Working stance",
    text: "Prefer the smallest release that proves the workflow. Expand only after the foundation is trusted by operators.",
  },
  {
    title: "Quality bar",
    text: "Readable interfaces, predictable data flow, explicit ownership, and documentation that matches what is actually live.",
  },
]

const workflow = [
  {
    label: "01",
    title: "Name the release target",
    text: "We start with users, constraints, environments, and what “done” means for the first public or internal cut.",
  },
  {
    label: "02",
    title: "Build the smallest credible system",
    text: "Implementation stays narrow: the workflow that matters, the integrations that must work, and the controls operators need.",
  },
  {
    label: "03",
    title: "Handoff with structure",
    text: "You leave with environment notes, runbooks, and a clear path for the next release—not a black box.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="About"
          title="An engineering partner for teams that need the first release to hold up under real use."
          description={`${BRAND_NAME} works with founders and operators who need AI features, automation, SaaS products, or custom systems delivered with discipline—not theatre.`}
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
            How engagements usually run
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Discover, build, handoff, then grow. The sequence stays simple so decisions stay visible.
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
              Calm process. Serious delivery.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Realistic timelines, practical architecture, and surfaces that can grow into portals or internal
              tools without starting over.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Let&apos;s discuss your project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
