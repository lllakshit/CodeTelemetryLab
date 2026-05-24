import { notFound } from "next/navigation"
import { SectionHeading } from "@/components/section-heading"
import { BlogEditorForm } from "@/components/admin-editor-forms"
import { getBlogPostById } from "@/lib/cms"

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getBlogPostById(id)
  if (!post) notFound()

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Edit blog"
        title={post.title}
        description="Update the post without leaving the admin system."
      />
      <BlogEditorForm post={post} />
    </div>
  )
}
