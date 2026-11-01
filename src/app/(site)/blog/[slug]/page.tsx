import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { PostCover } from "@/components/post-cover"
import { SectionHeading } from "@/components/section-heading"
import { cleanSeoDescription, realCoverImage } from "@/lib/blog-quality"
import { getBlogPostBySlug, listBlogPosts } from "@/lib/cms"
import { mdxComponents } from "@/components/mdx-components"
import { absoluteUrl, breadcrumbJsonLd, buildPageMetadata, organizationJsonLd } from "@/lib/seo"

// Articles are served from the CDN cache and refreshed in the background; the admin
// publish/edit actions also revalidate on demand, so edits never wait for this window.
export const revalidate = 600

/** Contact link that carries campaign attribution so leads can be traced back to the article. */
function contactHref(slug: string, content: string) {
  const params = new URLSearchParams({
    utm_source: "blog",
    utm_medium: "article",
    utm_campaign: slug,
    utm_content: content,
  })
  return `/contact?${params.toString()}`
}

function findRelatedPosts(
  posts: Awaited<ReturnType<typeof listBlogPosts>>,
  current: Awaited<ReturnType<typeof listBlogPosts>>[number],
) {
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()))

  return posts
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      const sharesCategory = candidate.category === current.category
      const sharedTags = candidate.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length
      const score = (sharesCategory ? 2 : 0) + sharedTags
      return { candidate, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.candidate)
}

function stripLeadingHeading(content: string, title: string) {
  // CMS rows saved from the admin editor use CRLF; normalise so the duplicate H1 is still detected.
  const normalized = content.replace(/\r\n/g, "\n").trimStart()
  const leadingHeading = `# ${title}`.trim()
  if (normalized.startsWith(`${leadingHeading}\n`)) {
    return normalized.slice(leadingHeading.length + 1).trimStart()
  }
  if (normalized === leadingHeading) {
    return ""
  }
  return normalized
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post || !post.isPublished) return {}

  const title = post.seoTitle || post.title
  const description = cleanSeoDescription(post)
  const image = realCoverImage(post) ?? "/brand/ct-labs-logo.png"
  const base = buildPageMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
  })

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: [image],
      tags: post.tags,
    },
    twitter: {
      ...base.twitter,
      images: [image],
    },
  }
}

export async function generateStaticParams() {
  const posts = await listBlogPosts({ publishedOnly: true })
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post || !post.isPublished) notFound()

  const readTime = estimateReadTime(post.content)
  const coverImage = realCoverImage(post)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: cleanSeoDescription(post),
    image: coverImage
      ? coverImage.startsWith("http")
        ? coverImage
        : absoluteUrl(coverImage)
      : absoluteUrl("/brand/ct-labs-logo.png"),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: post.content.trim().split(/\s+/).filter(Boolean).length,
    inLanguage: "en",
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: organizationJsonLd.name,
      url: organizationJsonLd.url,
    },
    publisher: organizationJsonLd,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ])

  const allPosts = await listBlogPosts({ publishedOnly: true })
  const relatedPosts = findRelatedPosts(allPosts, post)

  const { content } = await compileMDX({
    source: stripLeadingHeading(post.content, post.title),
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog" className="hover:text-slate-900">
              Blog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-900">{post.title}</li>
        </ol>
      </nav>

      <Link
        href="/blog"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to writing
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading eyebrow={post.category} title={post.title} description={post.excerpt} level={1} />
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                {tag}
              </span>
            ))}
            {post.publishedAt ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
              {readTime} min read
            </span>
          </div>
        </div>
        <BrandIllustration variant="blog" />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.72fr_0.28fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <figure className="mb-8">
            <PostCover post={post} variant="hero" priority sizes="(min-width: 1024px) 720px, 100vw" />
            {post.featuredImageAttribution && coverImage ? (
              <figcaption className="mt-3 px-1 text-xs leading-5 text-slate-500">
                  Image:{" "}
                  {post.featuredImageSourceUrl ? (
                    <a href={post.featuredImageSourceUrl} className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2">
                      {post.featuredImageAttribution}
                    </a>
                  ) : (
                    <span>{post.featuredImageAttribution}</span>
                  )}
                  {post.featuredImageLicense ? (
                    <>
                      {" "}
                      under{" "}
                      {post.featuredImageLicenseUrl ? (
                        <a href={post.featuredImageLicenseUrl} className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2">
                          {post.featuredImageLicense}
                        </a>
                      ) : (
                        <span>{post.featuredImageLicense}</span>
                      )}
                    </>
                  ) : null}
                </figcaption>
              ) : null}
          </figure>
          <div className="max-w-none">{content}</div>

          <section
            aria-labelledby="article-cta"
            className="mt-12 rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-6 sm:p-8"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Planning something like this?</p>
            <h2 id="article-cta" className="mt-3 text-2xl font-medium tracking-[-0.02em] text-slate-950">
              Tell us what you need to build. You get a grounded reply within one business day.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Share the workflow, timeline, and systems involved. We respond with questions or a proposed next step, not a sales deck.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={contactHref(post.slug, "article-footer")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Send a project brief
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/services" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                See how we work
              </Link>
            </div>
          </section>
        </article>

        <aside className="space-y-5">
          {relatedPosts.length ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Related reading</p>
              <div className="mt-4 flex flex-col gap-4 text-sm">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group block"
                  >
                    <PostCover post={related} variant="thumb" sizes="(min-width: 1024px) 280px, 100vw" className="mb-3" />
                    <p className="font-medium text-slate-950 transition group-hover:text-blue-700">{related.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{related.category}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Related services</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/services" className="font-medium text-slate-700 transition hover:text-slate-950">
                Browse services
              </Link>
              <Link href="/projects" className="font-medium text-slate-700 transition hover:text-slate-950">
                View projects
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Need this built?</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Send a short brief with the workflow, timeline, and systems that need to connect.
            </p>
            <Link
              href={contactHref(post.slug, "article-sidebar")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
            >
              Send a project brief
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
