import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { getProjectBySlug, listProjects } from "@/lib/cms"
import { filenameFromUrl } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}

  return {
    title: project.title,
    description: project.problem,
  }
}

export async function generateStaticParams() {
  const projects = await listProjects({ publishedOnly: true })
  return projects.map((project) => ({ slug: project.slug }))
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mt-6">
        <SectionHeading eyebrow={project.category} title={project.title} description={project.problem} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Solution</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">{project.solution}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {project.stack.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.2))] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-blue-100">Outcome</p>
            <p className="mt-3 text-sm leading-7 text-slate-200">{project.results}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {project.screenshots.map((shot, index) => (
            <div
              key={shot}
              className="flex min-h-44 items-end rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.35))] p-5"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Screenshot {index + 1}</p>
                <p className="mt-1 text-sm text-white">{filenameFromUrl(shot)}</p>
              </div>
            </div>
          ))}
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Notes</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              This case study structure is ready for real screenshots and richer comparisons once the media library is connected.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300">
              Discuss a similar build
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
