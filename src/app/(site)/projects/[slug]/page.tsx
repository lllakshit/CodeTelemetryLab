import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SystemLayersDiagram } from "@/components/diagrams/engineering-diagrams"
import { SectionHeading } from "@/components/section-heading"
import { getCaseStudyNarrative } from "@/lib/case-studies"
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
  const narrative = getCaseStudyNarrative(slug)
  const leadVisual = getProjectVisual(project)

  return {
    title: project.title,
    description: narrative?.overview ?? project.problem,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} | CodeTelemetryLab`,
      description: narrative?.overview ?? project.problem,
      url: absoluteUrl(`/projects/${project.slug}`),
      type: "article",
      images: [leadVisual.image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | CodeTelemetryLab`,
      description: narrative?.overview ?? project.problem,
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

  const narrative = getCaseStudyNarrative(slug)
  const leadVisual = getProjectVisual(project)
  const hasScreenshots = hasRealProjectScreenshot(project.screenshots)
  const related = (await listProjects({ publishedOnly: true }))
    .filter((item) => item.slug !== project.slug)
    .slice(0, 2)

  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: narrative?.overview ?? project.problem,
    about: project.category,
    creator: organizationJsonLd,
    url: absoluteUrl(`/projects/${project.slug}`),
    keywords: project.stack.join(", "),
    image: leadVisual.image,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd) }}
      />
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow={project.category}
            title={project.title}
            description={narrative?.overview ?? project.problem}
            level={1}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <figure className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50">
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
              Brand overview visual — product walkthrough available in qualified conversations.
            </figcaption>
          ) : null}
        </figure>
      </div>

      {narrative ? (
        <div className="mt-14 space-y-10">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <h2 className="text-2xl font-medium text-slate-950">Client challenge</h2>
            <p className="mt-4 text-sm leading-8 text-slate-700">{narrative.challenge}</p>
            <h3 className="mt-8 text-lg font-semibold text-slate-950">Constraints</h3>
            <ul className="mt-4 space-y-2">
              {narrative.constraints.map((item) => (
                <li key={item} className="text-sm leading-7 text-slate-600">
                  • {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-medium tracking-tight text-slate-950">Engineering decisions</h2>
            <div className="mt-8 divide-y divide-slate-200 border-t border-slate-200">
              {narrative.decisions.map((item) => (
                <article key={item.title} className="py-8">
                  <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-medium text-slate-950">Architecture</h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">{narrative.architecture}</p>
              <h3 className="mt-8 text-lg font-semibold text-slate-950">Implementation</h3>
              <p className="mt-3 text-sm leading-8 text-slate-700">{narrative.implementation}</p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4">
              <SystemLayersDiagram className="h-auto w-full" />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">Tradeoffs</h2>
              <ul className="mt-4 space-y-3">
                {narrative.tradeoffs.map((item) => (
                  <li key={item} className="text-sm leading-7 text-slate-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">Lessons learned</h2>
              <ul className="mt-4 space-y-3">
                {narrative.lessons.map((item) => (
                  <li key={item} className="text-sm leading-7 text-slate-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <h2 className="text-2xl font-medium text-slate-950">Outcome</h2>
            <p className="mt-4 text-sm leading-8 text-slate-700">{narrative.outcome}</p>
            <h3 className="mt-8 text-lg font-semibold text-slate-950">Future improvements</h3>
            <p className="mt-3 text-sm leading-8 text-slate-700">{narrative.future}</p>
          </section>
        </div>
      ) : (
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
        </div>
      )}

      {hasScreenshots ? (
        <section className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
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
                    alt={`${project.title} interface ${index + 1}`}
                    width={1200}
                    height={720}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium text-slate-950">More work</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{item.category}</p>
                <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-medium text-white">
          Facing a similar constraint set?
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Tell us about the workflow, the tools involved, and what “done” means for the first release.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
        >
          {narrative?.ctaLabel ?? "Discuss a similar build"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
