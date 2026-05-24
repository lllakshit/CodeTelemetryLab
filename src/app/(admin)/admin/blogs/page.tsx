import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { BlogDeleteButton } from "@/components/admin-editor-forms"
import { listBlogPosts } from "@/lib/cms"

export default async function AdminBlogsPage() {
  const posts = await listBlogPosts()

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Blogs"
          title="Manage blog posts and SEO metadata."
          description="Create, edit, publish, and remove long-form content from the admin surface."
        />
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          New post
        </Link>
      </div>

      <div className="grid gap-5">
        {posts.map((post) => (
          <article key={post.id} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{post.category}</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{post.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {post.isPublished ? "Published" : "Draft"}{" "}
                  {post.publishedAt ? `on ${format(new Date(post.publishedAt), "MMM d, yyyy")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/blogs/${post.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8"
                >
                  Edit
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <BlogDeleteButton id={post.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
