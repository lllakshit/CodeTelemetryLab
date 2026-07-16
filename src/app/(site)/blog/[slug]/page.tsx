import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { getBlogPostBySlug, listBlogPosts } from "@/lib/cms"
import { mdxComponents } from "@/components/mdx-components"
import { absoluteUrl, organizationJsonLd } from "@/lib/seo"

export const dynamic = "force-dynamic"

function stripLeadingHeading(content: string, title: string) {
  const normalized = content.trimStart()
  const leadingHeading = `# ${title}`.trim()
  if (normalized.startsWith(`${leadingHeading}\n`)) {
    return normalized.slice(leadingHeading.length + 1).trimStart()
  }
  if (normalized === leadingHeading) {
    return ""
  }
  return content
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

  if (!post) return {}

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: post.featuredImage ? [post.featuredImage] : ["/og-image.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : ["/og-image.svg"],
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

  if (!post) notFound()

  const readTime = estimateReadTime(post.content)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.featuredImage ? absoluteUrl(post.featuredImage) : absoluteUrl("/og-image.svg"),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: organizationJsonLd.name,
      url: organizationJsonLd.url,
    },
    publisher: organizationJsonLd,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }

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
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
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
          {post.featuredImage ? (
            <figure className="mb-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
              <Image src={post.featuredImage} alt={post.title} width={1400} height={840} className="h-full w-full object-cover" />
              {post.featuredImageAttribution ? (
                <figcaption className="border-t border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
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
          ) : null}
          <div className="max-w-none">{content}</div>
        </article>

        <aside className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Article focus</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Each article is written to support trust, clarify delivery thinking, and make the engineering brand feel grounded.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Need this built?</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              The same structure behind the article is what drives the product work: clear scope, disciplined implementation, and a handoff path.
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
