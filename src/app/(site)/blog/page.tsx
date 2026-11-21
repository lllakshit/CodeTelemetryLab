import type { Metadata } from "next"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight, Search } from "lucide-react"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { SceneHero, revealDelay } from "@/components/site3d/site-3d-ui"
import { listBlogPosts } from "@/lib/cms"
import { absoluteUrl, buildPageMetadata } from "@/lib/seo"
import { BlogCover } from "./blog-cover"

const POSTS_PER_PAGE = 12

type BlogSearchParams = { q?: string; category?: string; page?: string }
type Post = Awaited<ReturnType<typeof listBlogPosts>>[number]

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<BlogSearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const page = Number.parseInt(params?.page ?? "1", 10)
  const paged = Number.isFinite(page) && page > 1
  const filtered = Boolean(params?.q?.trim() || params?.category?.trim())

  const base = buildPageMetadata({
    title: paged
      ? `Blog, Page ${page} | Engineering Notes on Software, AI & Delivery`
      : "Blog | Engineering Notes on Software, AI & Delivery",
    description:
      "Articles from CodeTelemetryLab on AI automation, SaaS architecture, MVP delivery, and building systems operators can run.",
    // Each paginated page is its own canonical URL; search/filter views canonicalize to /blog.
    path: paged && !filtered ? `/blog?page=${page}` : "/blog",
  })

  // Search and category views are thin, duplicate-prone result sets: keep them out of the index.
  return filtered ? { ...base, robots: { index: false, follow: true } } : base
}

/** The text the server search looks through. The client filter (data-text) uses the same text, so both agree. */
function searchText(post: Post) {
  return [post.title, post.excerpt, post.category, post.tags.join(" ")].filter(Boolean).join(" ").toLowerCase()
}

function postMatchesSearch(post: Post, query: string, category: string) {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedCategory = category.trim().toLowerCase()

  return (
    (!normalizedQuery || searchText(post).includes(normalizedQuery)) &&
    (!normalizedCategory || post.category.toLowerCase() === normalizedCategory)
  )
}

function getPageNumber(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function postDate(post: Post) {
  return post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"
}

/** Data the page behaviours read: the search filter (text, category, tags) and the 3D sheets in the hero. */
function postData(post: Post) {
  return {
    "data-text": searchText(post),
    "data-cat": post.category,
    "data-tags": `|${post.tags.map((t) => t.toLowerCase()).join("|")}|`,
    "data-sheet-title": post.title,
    "data-sheet-cat": post.category,
    "data-sheet-date": postDate(post),
  }
}

function PostTime({ post }: { post: Post }) {
  return <time dateTime={post.publishedAt ?? undefined}>{postDate(post)}</time>
}

function Tags({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={className ? `tags ${className}` : "tags"}>
      {tags.map((tag, i) => (
        <li key={`${tag}-${i}`}>{tag}</li>
      ))}
    </ul>
  )
}

const linkStyle = { color: "var(--accent)", fontWeight: 600 }

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<BlogSearchParams>
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

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CodeTelemetryLab Blog",
    url: absoluteUrl("/blog"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: paginatedPosts.map((post, index) => ({
        "@type": "ListItem",
        position: pageStart + index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.title,
      })),
    },
  }

  const prevDisabled = currentPage === 1
  const nextDisabled = currentPage === totalPages

  return (
    <Site3DPage>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <div className="wrap">
        <SceneHero
          id="h1-blog"
          eyebrow="Blog"
          title="Notes on building software that has to survive contact with operators."
          lead="Architecture trade-offs, delivery patterns, and product decisions we see across AI, automation, and SaaS work."
          scene="blog"
          label="Interactive 3D fan of recent articles"
          hint="Drag · tap a sheet · tap again to read"
          dots={paginatedPosts.slice(0, 5).map((post) => post.title)}
        />

        <section className="sec">
          <div className="card edit rv" data-tilt="2">
            <div className="z2">
              <div className="ws" role="img" aria-label="CodeTelemetryLab editorial workspace for engineering articles">
                <div className="ws-in" data-tilt="9" aria-hidden="true">
                  <div className="ws-p a">
                    <span className="tg">GUIDE</span>
                    <span className="tg">SAAS</span>
                    <div className="ln x" style={{ marginTop: 14 }} />
                    <div className="ln m" />
                    <div className="ln x" />
                    <div className="ln s" />
                    <div className="ln m" />
                  </div>
                  <div className="ws-p b">
                    <div className="ln m" />
                    <div className="ln x" />
                    <div className="ln s" />
                  </div>
                  <div className="ws-p c">
                    <span className="tg">AI</span>
                    <div className="ln x" style={{ marginTop: 12 }} />
                    <div className="ln m" />
                  </div>
                  <span className="ws-dot" style={{ left: "12%", top: "8%" }} />
                  <span className="ws-dot" style={{ right: "14%", bottom: "18%", animationDelay: "-2s" }} />
                </div>
              </div>
            </div>
            <div className="z1">
              <p className="eyebrow-s">Editorial system</p>
              <h2 className="h2">Writing that documents how we build and operate software systems.</h2>
              <p className="muted">
                Most of these posts come out of client work: a data model that needed rethinking, an automation that
                broke quietly, a launch checklist we wished existed sooner. If a post overlaps with something you are
                scoping, our{" "}
                <Link href="/services" style={linkStyle}>
                  services
                </Link>{" "}
                pages go deeper on approach, and the{" "}
                <Link href="/process" style={linkStyle}>
                  process
                </Link>{" "}
                page explains how an engagement actually runs.
              </p>
            </div>
          </div>
        </section>

        <section className="sec" style={{ paddingTop: 0 }} aria-label="Articles">
          {/* Submits to the server (data-server), which searches every page; typing filters this page's posts at once. */}
          <form action="/blog" className="card filters rv" id="blogFilter" data-tilt="2" data-server="1" role="search">
            <div className="z1">
              <label htmlFor="bq">Search articles</label>
              <div style={{ position: "relative" }}>
                <Search
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 15,
                    top: "50%",
                    width: 16,
                    height: 16,
                    translate: "0 -50%",
                    color: "#8a97a8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="inp"
                  id="bq"
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="Search articles by topic"
                  autoComplete="off"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>
            <div className="z1">
              <select className="inp" name="category" defaultValue={selectedCategory} aria-label="Filter by category">
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="z2" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button className="btn" type="submit">
                Search
              </button>
              {query || selectedCategory ? (
                <Link className="btn ghost" href="/blog">
                  Clear
                </Link>
              ) : null}
            </div>
          </form>

          {visiblePosts.length ? (
            <p className="count" id="blogCount">
              Showing {showingStart}-{showingEnd} of {visiblePosts.length} article
              {visiblePosts.length === 1 ? "" : "s"}
              {selectedCategory ? ` in ${selectedCategory}` : ""}
              {query ? ` matching “${query}”` : ""}.
            </p>
          ) : null}
          {paginatedPosts.length ? (
            <p className="empty" id="blogEmpty">
              No articles match that search on this page. Press Search to look through every page.
            </p>
          ) : null}

          {leadPost ? (
            <article className="card feat rv" data-tilt="2" {...postData(leadPost)}>
              <Link href={`/blog/${leadPost.slug}`} tabIndex={-1} aria-hidden="true" className="z2">
                <BlogCover
                  post={leadPost}
                  index={0}
                  priority
                  sizes="(min-width: 1280px) 600px, (min-width: 981px) 50vw, 100vw"
                />
              </Link>
              <div className="pane z1">
                <p className="cat">{leadPost.category}</p>
                <h2 className="h2" style={{ fontSize: "clamp(24px,3vw,34px)" }}>
                  <Link href={`/blog/${leadPost.slug}`}>{leadPost.title}</Link>
                </h2>
                <p className="muted">{leadPost.excerpt}</p>
                <Tags tags={leadPost.tags} />
                <div className="foot">
                  <PostTime post={leadPost} />
                  <Link className="rc" href={`/blog/${leadPost.slug}`}>
                    Read article
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {remainingPosts.length ? (
            <div className="posts">
              {remainingPosts.map((post, i) => (
                <article
                  key={post.id}
                  className="card post rv"
                  data-tilt="5"
                  style={vars({ "--d": revealDelay(i + 1) })}
                  {...postData(post)}
                >
                  <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
                    <BlogCover
                      post={post}
                      index={i + 1}
                      sizes="(min-width: 1280px) 400px, (min-width: 981px) 33vw, (min-width: 621px) 50vw, 100vw"
                    />
                  </Link>
                  <p className="cat z1">{post.category}</p>
                  <PostTime post={post} />
                  <h3 className="h3">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="ex">{post.excerpt}</p>
                  <Tags tags={post.tags} className="z1" />
                  <div className="foot z2">
                    <Link className="rc" href={`/blog/${post.slug}`}>
                      Read article
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {totalPages > 1 ? (
            <nav className="pager" aria-label="Blog pagination">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Link
                className="btn"
                href={pageHref(Math.max(1, currentPage - 1))}
                aria-disabled={prevDisabled}
                tabIndex={prevDisabled ? -1 : undefined}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Link>
              <Link
                className="btn"
                href={pageHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={nextDisabled}
                tabIndex={nextDisabled ? -1 : undefined}
              >
                Next
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </nav>
          ) : null}

          {!visiblePosts.length ? (
            <div className="card rv" style={{ textAlign: "center", marginTop: 12 }}>
              <p className="h3">No articles found</p>
              <p className="muted">Try a different topic or clear the filters.</p>
            </div>
          ) : null}
        </section>
      </div>
    </Site3DPage>
  )
}
