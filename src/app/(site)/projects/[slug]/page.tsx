import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { getProjectBySlug, listProjects } from "@/lib/cms"

function getVariant(slug: string) {
  if (slug.includes("portal")) return "portal" as const
  if (slug.includes("automation")) return "automation" as const
  return "platform" as const
}

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

  const variant = getVariant(project.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div>
          <SectionHeading eyebrow={project.category} title={project.title} description={project.problem} level={1} />
          <div className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
        <BrandIllustration variant={variant} />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.64fr_0.36fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Solution</p>
            <p className="mt-4 text-sm leading-8 text-slate-700">{project.solution}</p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Outcome</p>
            <p className="mt-4 text-sm leading-8 text-slate-700">{project.results}</p>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Project snapshot</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.25rem] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Category</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{project.category}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Stack depth</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{project.stack.length} core technologies</p>
              </div>
              <div className="rounded-[1.25rem] bg-white px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Delivery focus</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Trust, operations, and maintainability</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Notes</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This case study structure is designed to scale into richer screenshots, walkthrough clips, and deeper delivery notes once the media library is populated.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              Discuss a similar build
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
