import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { getHomeContent } from "@/lib/cms"
import { seoServices } from "@/lib/seo-markets"

export const metadata: Metadata = {
  title: "Software & AI Services | Development, Automation, SaaS, MVP",
  description:
    "Commercial service pages for AI development, automation, LLM apps, SaaS, MVP, React, Next.js, Python, CRM, APIs, and enterprise software.",
  alternates: { canonical: "/services" },
}

const deliverables = [
  "Discovery and scope framing",
  "Information architecture",
  "Responsive implementation",
  "Database and API setup",
  "Operations-ready content model",
  "Launch support and handoff",
]

export default async function ServicesPage() {
  const home = await getHomeContent()

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Service packages that feel like engineering work, not a generic agency menu."
        description="The scope is intentionally practical: build the product surface, make the content editable, and leave room for expansion."
        level={1}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seoServices.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
              {service.primaryKeyword}
            </p>
            <h2 className="mt-3 text-xl font-medium tracking-tight text-slate-950">{service.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 border-t border-slate-200">
        {home.services.map((service) => (
          <article key={service.title} className="grid gap-4 border-b border-slate-200 py-8 lg:grid-cols-[0.28fr_0.42fr_0.3fr]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">{service.notes}</p>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-slate-950">{service.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
            </div>
            <ul className="grid gap-3 text-sm text-slate-700">
              {deliverables.slice(0, 3).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-14 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Delivery scope</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">
            What the first phase usually includes
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {deliverables.map((item) => (
              <div key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Engagement rhythm</p>
          <p className="mt-3 text-2xl font-medium tracking-tight text-slate-950">Short cycles, clear checkpoints</p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            The work is organized so you always know what is being built, what is under review, and what is next.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start a conversation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
