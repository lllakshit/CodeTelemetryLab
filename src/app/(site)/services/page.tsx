import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { buildPageMetadata } from "@/lib/seo"
import { seoServices } from "@/lib/seo-markets"

export const metadata: Metadata = buildPageMetadata({
  title: "Services | AI, Automation, SaaS & Custom Software",
  description:
    "Engineering services from CodeTelemetryLab: AI development, automation, SaaS foundations, APIs, and custom software—each page explains problems, approach, and FAQs.",
  path: "/services",
})

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Engineering services for product launches and operating systems."
        description="Pick a focus area to read how we approach the work—problems, architecture, stack, and the questions teams usually ask before starting."
        level={1}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seoServices.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <h2 className="text-xl font-medium tracking-tight text-slate-950">{service.name}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              Read the approach
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16 rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
        <h2 className="text-2xl font-medium text-slate-950">Not sure which service fits?</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Describe the workflow and constraints. We will point you to the right engagement shape—or tell you if the
          problem is not a fit.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Send a brief
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/process"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950"
          >
            See the process
          </Link>
        </div>
      </div>
    </div>
  )
}
