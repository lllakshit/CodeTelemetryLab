import Link from "next/link"
import { ArrowRight, CheckCircle2, Code2, Database, Layers3, ShieldCheck, Sparkles } from "lucide-react"
import { HeroPulse } from "@/components/hero-pulse"
import { SectionHeading } from "@/components/section-heading"
import { getHomeContent, listBlogPosts, listProjects } from "@/lib/cms"
import { cn, filenameFromUrl } from "@/lib/utils"

const trustPoints = [
  "Built for USA and Canada remote collaboration",
  "Structured delivery instead of generic template work",
  "Content and admin flows designed to scale",
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
    description: "The foundation includes auth, data handling, and a CMS path so the site can evolve into a platform.",
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

  return (
    <div>
      <section className="relative overflow-hidden">
        <HeroPulse />
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
              <Sparkles className="h-4 w-4" />
              {home.heroEyebrow}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              {home.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {home.heroDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={home.primaryCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-cyan-500"
              >
                {home.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={home.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
              >
                {home.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-8 h-44 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery model</p>
                  <p className="mt-3 text-xl font-semibold text-white">One owner. One system.</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Scope, build, content, and launch assets are organized so the project can move without
                    confusion.
                  </p>
                </div>
                <div className="rounded-3xl border border-cyan-300/15 bg-cyan-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Engagement fit</p>
                  <p className="mt-3 text-xl font-semibold text-white">Founders, agencies, ops teams</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200/80">
                    Good for product launches, internal systems, and delivery support where reliability matters.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {home.stats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/25 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-sm font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-[#09111f] p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Snapshot</p>
                    <p className="mt-2 text-base font-medium text-white">Clear execution, not flashy theatre</p>
                  </div>
                  <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                    Phase 1
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Next.js App Router",
                    "Custom admin panel",
                    "Prisma schema",
                    "JWT auth",
                    "Blog + project CMS",
                    "Media library",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Services"
          title="A focused service catalog that reads like a real engineering practice."
          description="Each service is positioned to support product teams that need software built with structure, not just visual polish."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {home.services.map((service, index) => (
            <article
              key={service.title}
              className={cn(
                "group rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-blue-400/25 hover:bg-white/[0.055]",
                index === 0 && "md:col-span-2 xl:col-span-1",
              )}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{service.notes}</p>
              <h3 className="mt-4 text-xl font-semibold text-white">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            eyebrow="Why choose us"
            title="A calm, engineered experience that feels trustworthy from the first scroll."
            description="The site is intentionally minimal, but the structure underneath is ready for a content-driven agency platform."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Case studies"
          title="Representative work, presented like a real portfolio rather than a fake enterprise collage."
          description="These projects are framed to describe the problem, solution, stack, and outcome in a way a technical buyer can trust."
        />
        <div className="mt-10 grid gap-6">
          {featuredProjects.map((project, index) => (
            <article
              key={project.id}
              className={cn(
                "grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1fr_1.2fr]",
                index % 2 === 1 && "lg:grid-cols-[1.2fr_1fr]",
              )}
            >
              <div className={cn("rounded-[1.6rem] border border-white/10 bg-slate-950/35 p-6", index % 2 === 1 && "lg:order-2")}>
                <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{project.category}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">{project.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">{project.problem}</p>
                <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Solution</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{project.solution}</p>
                </div>
              </div>

              <div className={cn("flex flex-col justify-between gap-5", index % 2 === 1 && "lg:order-1")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {project.stack.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="rounded-[1.6rem] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.2))] p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Result</p>
                  <p className="mt-3 text-base leading-7 text-white">{project.results}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {project.screenshots.slice(0, 2).map((shot) => (
                    <div
                      key={shot}
                      className="flex min-h-32 items-end rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.35))] p-4"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Screenshot</p>
                        <p className="mt-1 text-sm text-white">{filenameFromUrl(shot)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
          >
            View all case studies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Process"
            title="A simple delivery rhythm that keeps the work focused and credible."
            description="The goal is to reduce waste in the first version and make the handoff straightforward when the product is ready to scale."
          />
          <div className="grid gap-4">
            {home.process.map((step) => (
              <article
                key={step.title}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-sm font-semibold text-blue-200">{step.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Feedback that sounds like actual delivery, not brochure copy."
          description="The wording stays restrained because the value is in the quality of the work, not inflated claims."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {home.testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm leading-7 text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6 border-t border-white/8 pt-4">
                <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,23,42,0.85)_48%,rgba(6,182,212,0.18))] px-6 py-10 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Next step</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {home.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/80">{home.ctaDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Book a call
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Admin access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Recent writing"
            title="Blog content is ready for a CMS workflow."
            description="The blog system supports MDX content, categories, tags, SEO metadata, and a featured image field."
          />
          <div className="grid gap-4">
            {blogs.slice(0, 2).map((blog) => (
              <article key={blog.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{blog.category}</span>
                  <span>•</span>
                  <span>{blog.tags.join(", ")}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">{blog.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{blog.excerpt}</p>
                <Link href={`/blog/${blog.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
