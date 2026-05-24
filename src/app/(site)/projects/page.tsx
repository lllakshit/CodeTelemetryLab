import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { listProjects } from "@/lib/cms"

export default async function ProjectsPage() {
  const projects = await listProjects({ publishedOnly: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Projects"
        title="Case studies built around the real problem, the solution, and the delivery surface."
        description="The project detail model is ready for screenshots, stack data, outcomes, and future filtering without needing a redesign."
      />

      <div className="mt-10 grid gap-6">
        {projects.map((project) => (
          <article
            key={project.id}
            className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.95fr_1.05fr]"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{project.category}</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">{project.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{project.problem}</p>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300"
              >
                Open case study
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Solution</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{project.solution}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {project.stack.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-[1.5rem] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.2))] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-blue-100">Outcome</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{project.results}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
