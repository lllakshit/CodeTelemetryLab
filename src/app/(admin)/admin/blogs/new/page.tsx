import { SectionHeading } from "@/components/section-heading"
import { BlogEditorForm } from "@/components/admin-editor-forms"

export default function NewBlogPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="New blog"
        title="Create a new post"
        description="Use MDX-ready content with category, tags, and SEO fields."
      />
      <BlogEditorForm />
    </div>
  )
}
