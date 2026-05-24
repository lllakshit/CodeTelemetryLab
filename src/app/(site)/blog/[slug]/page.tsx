import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { format } from "date-fns"
import { SectionHeading } from "@/components/section-heading"
import { getBlogPostBySlug, listBlogPosts } from "@/lib/cms"
import { mdxComponents } from "@/components/mdx-components"

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

  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow={post.category}
        title={post.title}
        description={post.excerpt}
      />
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
        {post.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
            {tag}
          </span>
        ))}
        {post.publishedAt ? (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300">
            {format(new Date(post.publishedAt), "MMMM d, yyyy")}
          </span>
        ) : null}
      </div>

      <article className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="max-w-none">{content}</div>
      </article>
    </div>
  )
}
