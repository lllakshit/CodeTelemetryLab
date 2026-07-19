import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { listProjects } from "@/lib/cms"
import { getProjectVisual } from "@/lib/project-media"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse CodeTelemetryLabs case studies with real problem statements, solution summaries, tech stacks, and delivery outcomes.",
}

export default async function ProjectsPage() {
  const projects = await listProjects({ publishedOnly: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Projects"
        title="Case studies built around the real problem, the solution, and the delivery surface."
        description="The project detail model is ready for screenshots, stack data, outcomes, and future filtering without needing a redesign."
        level={1}
      />

      <div className="mt-12 divide-y divide-slate-200 border-t border-slate-200">
        {projects.map((project) => {
          const visual = getProjectVisual(project)

          return (
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
                  Open case study
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div>
                <figure className="mb-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  <div className="aspect-[5/3] overflow-hidden">
                    <Image
                      src={visual.image}
                      alt={visual.alt}
                      width={1200}
                      height={720}
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                  {visual.isIllustrative && visual.sourceUrl ? (
                    <figcaption className="bg-white px-4 py-2 text-[11px] text-slate-500">
                      Illustrative project visual ·{" "}
                      <a
                        href={visual.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2"
                      >
                        Unsplash
                      </a>
                    </figcaption>
                  ) : null}
                </figure>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Problem</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{project.problem}</p>
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Solution</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{project.solution}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">Outcome</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{project.results}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
