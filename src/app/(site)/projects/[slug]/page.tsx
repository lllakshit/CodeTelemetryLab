import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { getProjectBySlug, listProjects } from "@/lib/cms"
import { absoluteUrl, organizationJsonLd } from "@/lib/seo"
import { getProjectVisual, hasRealProjectScreenshot } from "@/lib/project-media"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return {}
  const leadVisual = getProjectVisual(project)

  return {
    title: project.title,
    description: project.problem,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: project.title,
      description: project.problem,
      url: absoluteUrl(`/projects/${project.slug}`),
      type: "article",
      images: [leadVisual.image],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.problem,
      images: [leadVisual.image],
    },
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

  const leadVisual = getProjectVisual(project)
  const hasScreenshots = hasRealProjectScreenshot(project.screenshots)
  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.problem,
    about: project.category,
    creator: organizationJsonLd,
    url: absoluteUrl(`/projects/${project.slug}`),
    keywords: project.stack.join(", "),
    image: leadVisual.image,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />
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
        <figure className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <div className="aspect-[5/3] overflow-hidden">
            <Image
              src={leadVisual.image}
              alt={leadVisual.alt}
              width={1400}
              height={840}
              className="h-full w-full object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          </div>
          {leadVisual.isIllustrative ? (
            <figcaption className="bg-white px-5 py-3 text-xs text-slate-500">
              Brand overview visual — product screenshots available on request for qualified conversations.
            </figcaption>
          ) : null}
        </figure>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.64fr_0.36fr]">
        <div className="space-y-6">
          {hasScreenshots ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Screenshots</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {project.screenshots
                  .filter(
                    (screenshot) =>
                      !screenshot.includes("/og-image.svg") &&
                      !screenshot.toLowerCase().includes("placeholder"),
                  )
                  .map((screenshot, index) => (
                    <div
                      key={`${screenshot}-${index}`}
                      className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                    >
                      <Image
                        src={screenshot}
                        alt={`${project.title} screenshot ${index + 1}`}
                        width={1200}
                        height={720}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </section>
          ) : null}

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
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Next step</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              If this problem shape matches yours, send a brief with constraints and timeline. We will reply with a
              scoped next step.
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
