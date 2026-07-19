import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Code2, Database, Layers3, ShieldCheck, Sparkles } from "lucide-react"
import { HeroPulse } from "@/components/hero-pulse"
import { SectionHeading } from "@/components/section-heading"
import { getHomeContent, listBlogPosts, listProjects } from "@/lib/cms"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "AI Development, Automation & Custom Software Agency",
  description:
    "Hire CodeTelemetryLabs for AI development, AI automation, SaaS, MVP, React/Next.js, and custom software. International delivery for US, Canada, UK, UAE, Australia, and India.",
  alternates: { canonical: "/" },
}

const trustPoints = [
  "US, Canada, UK, UAE, Australia & India delivery",
  "Buyer-intent AI, SaaS, MVP, and custom software focus",
  "Structured delivery instead of generic agency fluff",
]

const principles = [
  {
    icon: Layers3,
    title: "Structured delivery",
    description: "We keep scope, content, and implementation aligned so the site stays maintainable after launch.",
  },
  {
    icon: ShieldCheck,
    title: "Trust-first UI",
    description: "The interface is calm, readable, and serious enough to represent an engineering company.",
  },
  {
    icon: Code2,
    title: "Engineering depth",
    description: "The foundation includes secure workflows, data handling, and a content path so the site can evolve into a platform.",
  },
  {
    icon: Database,
    title: "Content operations",
    description: "Homepage, blogs, projects, and media all follow one content model instead of being hard-coded.",
  },
]

export default async function HomePage() {
  const [home, projects, blogs] = await Promise.all([
    getHomeContent(),
    listProjects({ publishedOnly: true }),
    listBlogPosts({ publishedOnly: true }),
  ])

  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)
  const leadProject = featuredProjects[0]
  const supportingProjects = featuredProjects.slice(1)

  return (
    <div>
      <section className="relative overflow-hidden">
        <HeroPulse />
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-28">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <Sparkles className="h-4 w-4" />
              {home.heroEyebrow}
            </div>
            <h1 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              {home.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              {home.heroDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={home.primaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                {home.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={home.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
              >
                {home.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-10 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-8 h-44 rounded-full bg-blue-500/12 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="relative overflow-hidden rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#f7fbff,#edf5ff)] p-3">
                <div className="absolute inset-x-10 top-0 h-16 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[1.45rem] border border-white/70 bg-white shadow-[0_18px_40px_rgba(59,130,246,0.12)]">
                  <Image
                    src="/uploads/dashboard-image.png"
                    alt="CodeTelemetryLabs dashboard interface preview"
                    width={1372}
                    height={830}
                    priority
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Delivery model</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">One owner. One system.</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Scope, build, content, and launch assets are organized so the project can move without
                    confusion.
                  </p>
                </div>
                <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#eef6ff)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-600">Engagement fit</p>
                  <p className="mt-3 text-xl font-semibold text-slate-950">Founders, agencies, ops teams</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Good for product launches, internal systems, and delivery support where reliability matters.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
                {home.stats.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.42fr_0.58fr]">
          <SectionHeading
            eyebrow="Services"
            title="A focused service catalog that reads like a real engineering practice."
            description="Each service is positioned to support product teams that need software built with structure, not just visual polish."
          />
          <div className="divide-y divide-slate-200">
            {home.services.map((service, index) => (
              <article
                key={service.title}
                className={cn("grid gap-4 py-6 md:grid-cols-[0.34fr_1fr]", index === 0 && "pt-0")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">
                  {service.notes}
                </p>
                <div>
                  <h3 className="text-2xl font-medium tracking-tight text-slate-950">{service.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            eyebrow="Why choose us"
            title="A calm, engineered experience that feels trustworthy from the first scroll."
            description="The site is intentionally minimal, but the structure underneath is ready for a content-driven agency platform."
          />
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {principles.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="border-t border-slate-200 pt-5">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Case studies"
          title="Representative work, presented like a real portfolio rather than a fake enterprise collage."
          description="These projects are framed to describe the problem, solution, stack, and outcome in a way a technical buyer can trust."
        />

        {leadProject ? (
          <div className="mt-10 space-y-8">
            <article className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">
                    {leadProject.category}
                  </p>
                  <h3 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">
                    {leadProject.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{leadProject.problem}</p>
                </div>
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Solution</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{leadProject.solution}</p>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-[1.9rem] bg-[linear-gradient(180deg,#f4f8ff,#eef3f8)] p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {leadProject.stack.map((item) => (
                      <div key={item} className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-blue-700">Result</p>
                    <p className="mt-3 text-base leading-7 text-slate-950">{leadProject.results}</p>
                  </div>
                </div>
                <Link
                  href={`/projects/${leadProject.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                >
                  Open full case study
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            {supportingProjects.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {supportingProjects.map((project) => (
                  <article key={project.id} className="rounded-[1.9rem] border border-slate-200 bg-white p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">
                      {project.category}
                    </p>
                    <h3 className="mt-4 text-2xl font-medium tracking-tight text-slate-950">{project.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{project.problem}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 border-t border-slate-200 pt-5 text-sm leading-7 text-slate-700">
                      {project.results}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100"
          >
            View all case studies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Process"
            title="A simple delivery rhythm that keeps the work focused and credible."
            description="The goal is to reduce waste in the first version and make the handoff straightforward when the product is ready to scale."
          />
          <div className="divide-y divide-slate-200">
            {home.process.map((step, index) => (
              <article key={step.title} className="grid gap-3 py-5 md:grid-cols-[5rem_1fr]">
                <p className="text-sm font-semibold text-blue-700">{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <p className="text-lg font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Feedback that sounds like actual delivery, not brochure copy."
          description="The wording stays restrained because the value is in the quality of the work, not inflated claims."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {home.testimonials.map((testimonial) => (
            <article key={testimonial.name} className="border-t border-slate-200 pt-6">
              <p className="text-sm leading-7 text-slate-700">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Next step</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                {home.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{home.ctaDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Book a call
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View case studies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Recent writing"
            title="Writing that supports real buying decisions."
            description="The blog system covers engineering, delivery, SEO, performance, and product operations with useful internal links."
          />
          <div className="divide-y divide-slate-200">
            {blogs.slice(0, 2).map((blog) => (
              <article key={blog.id} className="py-5 first:pt-0">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{blog.category}</span>
                  <span>|</span>
                  <span>{blog.tags.join(", ")}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{blog.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{blog.excerpt}</p>
                <Link href={`/blog/${blog.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
            <div className="pt-5">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                View all writing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
