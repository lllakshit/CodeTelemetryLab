import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { listProjects } from "@/lib/cms"

export const metadata: Metadata = {
  title: "Projects | Selected Engineering Case Studies",
  description:
    "Selected CodeTelemetryLab engagements covering portals, automation, and SaaS foundations—problem, approach, stack, and outcome.",
  alternates: { canonical: "/projects" },
}

export default async function ProjectsPage() {
  const projects = await listProjects({ publishedOnly: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Projects"
        title="Selected work from recent product and operations engagements."
        description="Each case study documents the operating problem, the system we built, the stack, and what changed after launch."
        level={1}
      />

      <div className="mt-12 divide-y divide-slate-200 border-t border-slate-200">
        {projects.map((project) => (
          <article key={project.id} className="grid gap-6 py-8 lg:grid-cols-[0.28fr_0.4fr_0.32fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">
                {project.category}
              </p>
              <h2 className="mt-4 text-2xl font-medium tracking-tight text-slate-950">{project.title}</h2>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
              >
                Read case study
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Problem</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{project.problem}</p>
              <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-slate-500">Solution</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{project.solution}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Stack</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-slate-500">Outcome</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{project.results}</p>
            </div>
          </article>
        ))}
      </div>

      {!projects.length ? (
        <div className="mt-12 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">Case studies coming soon</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Meanwhile, send a brief and we can walk through relevant past work on a call.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Send a brief
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}
