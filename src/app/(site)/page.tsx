import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { ProcessFlowDiagram } from "@/components/diagrams/engineering-diagrams"
import { HeroPulse } from "@/components/hero-pulse"
import { SectionHeading } from "@/components/section-heading"
import { getHomeContent, listBlogPosts, listProjects } from "@/lib/cms"
import { seoServices } from "@/lib/seo-markets"

export const metadata: Metadata = {
  title: {
    absolute: "CodeTelemetryLab | Custom Software, AI Systems & Product Delivery",
  },
  description:
    "CodeTelemetryLab helps founders and operators ship AI features, automation, SaaS products, and custom software with clear scope, durable architecture, and a handoff your team can run.",
  alternates: { canonical: "/" },
}

const audiences = [
  {
    title: "Founders launching a first product",
    text: "You need an MVP that real users can operate—not a prototype that collapses when permissions and edge cases arrive.",
  },
  {
    title: "Operators drowning in manual handoffs",
    text: "Status lives in chat. Spreadsheets became the database. You need a console or portal that matches how work actually moves.",
  },
  {
    title: "Product teams extending a working system",
    text: "The codebase must stay navigable. You want a partner who leaves boundaries, docs, and tests—not a mysterious patch.",
  },
]

const tech = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Supabase",
  "Docker",
  "OpenAI / Anthropic APIs",
  "Auth.js",
]

const homeFaqs = [
  {
    q: "What kinds of projects do you take?",
    a: "AI features inside products, automation and ops consoles, SaaS foundations, client portals, and custom internal tools. Pure one-page brochure sites without a data or workflow problem are usually a poor fit.",
  },
  {
    q: "How do engagements start?",
    a: "You send a brief. We reply within one business day with clarifying questions or a proposed first slice. Paid discovery is used when scope is large or ambiguous.",
  },
  {
    q: "Do you work with our in-house engineers?",
    a: "Yes. We collaborate in your repositories, write for the next reader, and prefer pair reviews over black-box deliveries.",
  },
  {
    q: "Where are you based?",
    a: "Jaipur, India, with remote delivery across North America, Europe, the UAE, and Australia. Time-zone overlap is planned into the cadence.",
  },
]

export default async function HomePage() {
  const [home, projects, blogs] = await Promise.all([
    getHomeContent(),
    listProjects({ publishedOnly: true }),
    listBlogPosts({ publishedOnly: true }),
  ])

  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)
  const spotlightServices = seoServices.filter((s) =>
    ["ai-development", "ai-automation", "saas-development", "custom-software-development", "mvp-development", "api-development"].includes(
      s.slug,
    ),
  )

  return (
    <div>
      <section className="relative overflow-hidden">
        <HeroPulse />
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
          <div className="relative z-10">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">
              Software engineering for product teams
            </p>
            <h1 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              Build systems your operators can run—AI, automation, SaaS, and custom software with clear ownership.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              CodeTelemetryLab partners with founders, CTOs, and operations leads who need production workflows: validated
              data, role-aware access, documented handoffs, and releases that survive contact with real users.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Send a project brief
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/process"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
              >
                How we deliver
              </Link>
            </div>
            <ul className="mt-10 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
              {[
                "Scoped first releases in weeks, not vague roadmaps",
                "Architecture that leaves room for the next phase",
                "Remote delivery with written decisions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 top-8 h-44 rounded-full bg-blue-500/12 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-50">
                <Image
                  src="/uploads/dashboard-image.png"
                  alt="Product operations interface with workflows and status"
                  width={1372}
                  height={830}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {home.stats.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who we help"
          title="Built for people accountable for shipping and running software."
          description="If you own the outcome after launch, you are the reader we write for."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {audiences.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.4fr_0.6fr]">
          <SectionHeading
            eyebrow="Capabilities"
            title="What we build when the workflow has to work on day one."
            description="Each service page explains problems, approach, architecture, and FAQs—not a slogan list."
          />
          <div className="divide-y divide-slate-200">
            {spotlightServices.map((service) => (
              <article key={service.slug} className="py-5 first:pt-0">
                <h3 className="text-xl font-medium text-slate-950">
                  <Link href={`/services/${service.slug}`} className="transition hover:text-blue-700">
                    {service.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{service.description}</p>
                <Link
                  href={`/services/${service.slug}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                >
                  Read the approach
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <Link href="/services" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            View all services
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
          <SectionHeading
            eyebrow="Engineering process"
            title="Discover, architect, build, harden, operate."
            description="The same cadence appears on every engagement. Details live on the process page."
          />
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4">
            <ProcessFlowDiagram className="h-auto w-full" />
          </div>
        </div>
        <Link
          href="/process"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
        >
          Read the full process
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Technologies"
          title="Tools chosen for the problem—not for a buzzword slide."
          description="We work primarily in TypeScript product stacks, with Python where data and AI pipelines fit better."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          {tech.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600">
          Stack decisions are documented in the engagement so your next hire understands why something exists—not only
          that it compiles.
        </p>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Selected work"
          title="Case studies written as engineering narratives."
          description="Problem, constraints, decisions, tradeoffs, and outcomes—without invented metrics."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <article key={project.id} className="flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">{project.category}</p>
              <h3 className="mt-4 text-xl font-medium text-slate-950">{project.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{project.problem}</p>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
              >
                Read case study
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        <Link href="/projects" className="mt-8 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
          Browse projects
        </Link>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why teams work with us"
          title="Competence shown in the work, not claimed in adjectives."
          description="Clients return when the first release was honest, operable, and documented."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <p className="text-sm leading-7 text-slate-700">
            We write down decisions. We separate marketing surfaces from product surfaces. We refuse to invent customer
            logos or vanity metrics. When we do not know something, we say so and propose how to learn it cheaply.
          </p>
          <p className="text-sm leading-7 text-slate-700">
            Success is measured by whether operators can run the system, whether the next engineer can change it safely,
            and whether the first release answered the business question you actually asked.
          </p>
        </div>
        <Link href="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
          About the practice
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-medium tracking-tight text-slate-950">Questions before you write</h2>
        <div className="mt-8 space-y-6">
          {homeFaqs.map((item) => (
            <div key={item.q} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
              <h3 className="text-lg font-medium text-slate-950">{item.q}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">Next step</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-white sm:text-4xl">
            {home.ctaTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">{home.ctaDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
            >
              Send a brief
            </Link>
            <Link
              href="/locations"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
            >
              Markets we serve
            </Link>
          </div>
        </div>
      </section>

      {blogs.length ? (
        <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Notes"
            title="Recent writing from the practice."
            description="Architecture and delivery notes for teams deciding what to build next."
          />
          <div className="mt-8 divide-y divide-slate-200">
            {blogs.slice(0, 3).map((blog) => (
              <article key={blog.id} className="py-5">
                <p className="text-xs text-slate-500">{blog.category}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  <Link href={`/blog/${blog.slug}`} className="hover:text-blue-700">
                    {blog.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{blog.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
