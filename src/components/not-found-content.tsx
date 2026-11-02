import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

const popularPages = [
  { href: "/services", title: "Services", description: "AI, automation, SaaS, and custom software we build." },
  { href: "/projects", title: "Projects", description: "Case studies with the problem, the build, and the result." },
  { href: "/blog", title: "Blog", description: "Engineering notes on software, AI, and delivery." },
  { href: "/process", title: "Process", description: "How an engagement runs from discovery to handoff." },
  { href: "/careers", title: "Careers", description: "Open roles across engineering, design, and delivery." },
  { href: "/contact", title: "Contact", description: "Send a brief and get a grounded reply within a day." },
] as const

export function NotFoundContent() {
  return (
    <div data-not-found className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="inline-flex items-center gap-3">
        <span className="h-px w-8 bg-slate-300" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-700">Error 404</p>
      </div>
      <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
        This page took a different route.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
        The address may have changed, or the page may never have existed. Search the blog, or jump to one of the
        pages below.
      </p>

      <form action="/blog" role="search" className="mt-8 flex max-w-xl gap-2">
        <label className="relative block flex-1">
          <span className="sr-only">Search articles</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            name="q"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
            placeholder="Search articles by topic"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to home
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
        >
          Report a broken link
        </Link>
      </div>

      <h2 className="mt-14 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Popular pages</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {popularPages.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
            >
              <span className="flex items-center justify-between text-base font-semibold text-slate-950">
                {page.title}
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-950" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{page.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
