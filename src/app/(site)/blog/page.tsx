import type { Metadata } from "next"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { listBlogPosts } from "@/lib/cms"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read CodeTelemetryLabs articles on engineering systems, agency delivery, operations workflows, SEO structure, and product thinking.",
}

export default async function BlogPage() {
  const posts = await listBlogPosts({ publishedOnly: true })
  const leadPost = posts[0]
  const remainingPosts = posts.slice(1)

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

      {leadPost ? (
        <article className="mt-16 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#f4f8ff,#eef6ff)] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">{leadPost.category}</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950">{leadPost.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{leadPost.excerpt}</p>
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
    </div>
  )
}
