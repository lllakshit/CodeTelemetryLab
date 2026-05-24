import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { listBlogPosts } from "@/lib/cms"

export default async function BlogPage() {
  const posts = await listBlogPosts({ publishedOnly: true })

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Blog"
        title="Writing that supports the engineering brand, with MDX-ready content under the hood."
        description="Posts can carry SEO metadata, tags, categories, and featured images while the admin system manages them without code edits."
      />

      <div className="mt-10 grid gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(15,23,42,0.5))] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-200">{post.category}</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">{post.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{post.excerpt}</p>
            </div>
            <div className="flex flex-col justify-between gap-5">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4">
                <p className="text-sm text-slate-500">
                  {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}
                </p>
                <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-300">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
