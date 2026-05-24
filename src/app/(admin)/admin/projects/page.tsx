import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { ProjectDeleteButton } from "@/components/admin-editor-forms"
import { listProjects } from "@/lib/cms"

export default async function AdminProjectsPage() {
  const projects = await listProjects()

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Projects"
          title="Manage case studies and screenshots."
          description="Keep the project portfolio aligned with the public case study pages."
        />
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          New project
        </Link>
      </div>

      <div className="grid gap-5">
        {projects.map((project) => (
          <article key={project.id} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{project.category}</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{project.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{project.results}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8"
                >
                  Edit
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <ProjectDeleteButton id={project.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
