import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { ProjectDeleteButton } from "@/components/admin-editor-forms"
import { adminAccentButton, adminGhostButton, adminInfoChip, adminSurface } from "@/lib/admin-ui"
import { listProjects } from "@/lib/cms"

export default async function AdminProjectsPage() {
  const projects = await listProjects()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Projects"
          title="Manage case studies and screenshots."
          description="Keep the project portfolio aligned with the public case study pages."
        />
        <Link href="/admin/projects/new" className={adminAccentButton}>New project</Link>
      </div>

      <div className="grid gap-5">
        {projects.map((project) => (
          <article key={project.id} className={`${adminSurface} p-6`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={adminInfoChip}>{project.category}</span>
                  {project.featured ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Featured</span>
                  ) : null}
                  <span className={project.isPublished ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"}>
                    {project.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">{project.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{project.results}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span key={item} className="rounded-full border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className={adminGhostButton}
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
