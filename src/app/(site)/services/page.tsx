import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { seoServices } from "@/lib/seo-markets"

export const metadata: Metadata = {
  title: "Services | AI, Automation, SaaS & Custom Software",
  description:
    "CodeTelemetryLab services: AI development, automation, SaaS platforms, MVP builds, APIs, and custom software for product and operations teams.",
  alternates: { canonical: "/services" },
}

const phaseIncludes = [
  "Discovery and written scope",
  "Architecture for the first release",
  "Implementation with review checkpoints",
  "Integrations your operators need",
  "Documentation and environment notes",
  "Launch support and handoff",
]

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Engineering services for product launches and operating systems."
        description="Choose a focused engagement—or combine services when the release needs more than one surface."
        level={1}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seoServices.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">Service</p>
            <h2 className="mt-3 text-xl font-medium tracking-tight text-slate-950">{service.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              View details
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-14 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">First phase</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">
            What a typical engagement includes
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {phaseIncludes.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Rhythm</p>
          <p className="mt-3 text-2xl font-medium tracking-tight text-slate-950">Short cycles, visible checkpoints</p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            You always know what is in build, what is under review, and what lands in the next cut.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Discuss your scope
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
