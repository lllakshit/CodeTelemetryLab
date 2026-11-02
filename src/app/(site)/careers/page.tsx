import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { GENERAL_APPLICATION, careerBenefits, jobOpenings, jobTeams } from "@/lib/careers"
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Careers | Join the Team",
  description:
    "Open roles in engineering, AI and automation, design, delivery, growth, and content at CodeTelemetryLab. Remote-friendly, with real client work for US and Canadian teams.",
  path: "/careers",
})

export default async function CareersPage({ searchParams }: { searchParams?: Promise<{ team?: string }> }) {
  const params = await searchParams
  const team = jobTeams.find((item) => item === params?.team)
  const visible = team ? jobOpenings.filter((job) => job.team === team) : jobOpenings

  return (
    <div className="site-page">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Careers", path: "/careers" },
            ]),
          ),
        }}
      />

      <SectionHeading
        eyebrow="Careers"
        title="Build software that has to survive contact with real operators."
        description="We are a small, senior-leaning team shipping AI, automation, and SaaS products for clients in the US and Canada. Pick a role below, or tell us what you do best."
        level={1}
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {careerBenefits.map((benefit) => (
          <li key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-semibold text-slate-950">{benefit.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
          </li>
        ))}
      </ul>

      <div id="openings" className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Open roles</p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-slate-950">
            {visible.length} {visible.length === 1 ? "opening" : "openings"}
            {team ? ` in ${team}` : ""}
          </h2>
        </div>
        <nav aria-label="Filter roles by team" className="flex flex-wrap gap-2">
          <Link
            href="/careers#openings"
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              team ? "border-slate-200 text-slate-600 hover:border-slate-400" : "border-slate-950 bg-slate-950 text-white"
            }`}
          >
            All teams
          </Link>
          {jobTeams.map((item) => (
            <Link
              key={item}
              href={`/careers?team=${encodeURIComponent(item)}#openings`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                item === team
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>

      <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {visible.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/careers/${job.slug}`}
              className="group grid gap-4 py-6 transition lg:grid-cols-[1.4fr_1fr_auto] lg:items-center"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">{job.team}</p>
                <h3 className="mt-2 text-xl font-medium tracking-tight text-slate-950 group-hover:text-blue-700">
                  {job.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{job.summary}</p>
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <li className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {job.location}
                </li>
                <li className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {job.employmentType}
                </li>
                <li className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {job.experience}
                </li>
              </ul>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                View role
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-12 rounded-[2rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Not seeing your role?</p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-slate-950">Send a general application.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">{GENERAL_APPLICATION.summary}</p>
        <Link
          href={`/careers/${GENERAL_APPLICATION.slug}#apply`}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Apply without a specific role
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
