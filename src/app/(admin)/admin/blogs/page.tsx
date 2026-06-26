import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { BlogDeleteButton } from "@/components/admin-editor-forms"
import { adminAccentButton, adminGhostButton, adminInfoChip, adminSurface } from "@/lib/admin-ui"
import { listBlogPosts } from "@/lib/cms"

export default async function AdminBlogsPage() {
  const posts = await listBlogPosts()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Blogs"
          title="Manage blog posts and SEO metadata."
          description="Create, edit, publish, and remove long-form content from the admin surface."
        />
        <Link href="/admin/blogs/new" className={adminAccentButton}>New post</Link>
      </div>

      <div className="grid gap-5">
        {posts.map((post) => (
          <article key={post.id} className={`${adminSurface} p-6`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={adminInfoChip}>{post.category}</span>
                  <span className={post.isPublished ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"}>
                    {post.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">{post.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-3 py-1 text-xs font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {post.publishedAt ? `Published on ${format(new Date(post.publishedAt), "MMM d, yyyy")}` : "Saved as draft"}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={`/admin/blogs/${post.id}`}
                  className={adminGhostButton}
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
