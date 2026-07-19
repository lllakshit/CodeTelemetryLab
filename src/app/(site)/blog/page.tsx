import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight, Search } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { listBlogPosts } from "@/lib/cms"

const POSTS_PER_PAGE = 12

export const metadata: Metadata = {
  title: "Blog | AI, Software, SaaS & Automation Insights",
  description:
    "Buyer-intent articles on AI automation, SaaS, MVP development, React/Next.js, SEO, and hiring engineering partners—written to support qualified inquiries.",
  alternates: { canonical: "/blog" },
}

function postMatchesSearch(
  post: Awaited<ReturnType<typeof listBlogPosts>>[number],
  query: string,
  category: string,
) {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedCategory = category.trim().toLowerCase()
  const haystack = [
    post.title,
    post.excerpt,
    post.category,
    post.tags.join(" "),
    post.primaryKeyword,
    post.searchIntent,
    post.targetAudience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    (!normalizedQuery || haystack.includes(normalizedQuery)) &&
    (!normalizedCategory || post.category.toLowerCase() === normalizedCategory)
  )
}

function getPageNumber(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const posts = await listBlogPosts({ publishedOnly: true })
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams?.q ?? ""
  const selectedCategory = resolvedSearchParams?.category ?? ""
  const requestedPage = getPageNumber(resolvedSearchParams?.page)
  const categories = Array.from(new Set(posts.map((post) => post.category))).sort((a, b) => a.localeCompare(b))
  const visiblePosts = posts.filter((post) => postMatchesSearch(post, query, selectedCategory))
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / POSTS_PER_PAGE))
  const currentPage = Math.min(requestedPage, totalPages)
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedPosts = visiblePosts.slice(pageStart, pageStart + POSTS_PER_PAGE)
  const leadPost = paginatedPosts[0]
  const remainingPosts = paginatedPosts.slice(1)
  const showingStart = visiblePosts.length ? pageStart + 1 : 0
  const showingEnd = Math.min(pageStart + paginatedPosts.length, visiblePosts.length)

  function pageHref(page: number) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (selectedCategory) params.set("category", selectedCategory)
    if (page > 1) params.set("page", String(page))
    const queryString = params.toString()
    return queryString ? `/blog?${queryString}` : "/blog"
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <SectionHeading
          eyebrow="Blog"
          title="Writing that supports the engineering brand with real operating substance."
          description="The editorial system is designed for SEO, publishing operations, and product credibility, not filler content."
          level={1}
        />
        <BrandIllustration variant="blog" />
      </div>

      <form action="/blog" className="mt-12 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_14rem_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
            placeholder="Search services, keywords, or topics"
          />
        </label>
        <select
          name="category"
          defaultValue={selectedCategory}
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Search
          </button>
          {query || selectedCategory ? (
            <Link
              href="/blog"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {visiblePosts.length ? (
        <p className="mt-5 text-sm text-slate-600">
          Showing {showingStart}-{showingEnd} of {visiblePosts.length} article
          {visiblePosts.length === 1 ? "" : "s"}
          {selectedCategory ? ` in ${selectedCategory}` : ""}
          {query ? ` matching "${query}"` : ""}.
        </p>
      ) : null}

      {leadPost ? (
        <article className="mt-16 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
          <div className="grid gap-6">
            {leadPost.featuredImage ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
                <Image
                  src={leadPost.featuredImage}
                  alt={leadPost.title}
                  width={1200}
                  height={720}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#eef6ff)] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">{leadPost.category}</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">{leadPost.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">{leadPost.excerpt}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div className="flex flex-wrap gap-2">
              {leadPost.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  {tag}
                </span>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500">
                {leadPost.publishedAt ? format(new Date(leadPost.publishedAt), "MMMM d, yyyy") : "Draft"}
              </p>
              <Link
                href={`/blog/${leadPost.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
              >
                Read feature article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      <div className="mt-16 divide-y divide-slate-200 border-t border-slate-200">
        {remainingPosts.map((post) => (
          <article key={post.id} className="grid gap-6 py-8 lg:grid-cols-[0.24fr_0.5fr_0.26fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">{post.category}</p>
              <p className="mt-4 text-sm text-slate-500">
                {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}
              </p>
            </div>
            <div>
              {post.featuredImage ? (
                <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    width={1200}
                    height={720}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <h3 className="text-2xl font-medium tracking-tight text-slate-950">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                Read article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Blog pagination"
          className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={pageHref(Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                currentPage === 1
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Link>
            <Link
              href={pageHref(Math.min(totalPages, currentPage + 1))}
              aria-disabled={currentPage === totalPages}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                currentPage === totalPages
                  ? "pointer-events-none border-slate-200 text-slate-300"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      ) : null}

      {!visiblePosts.length ? (
        <div className="mt-12 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">No articles found</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try a broader service, technology, or category search.
          </p>
        </div>
      ) : null}
    </div>
  )
}
