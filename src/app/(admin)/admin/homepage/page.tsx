import { SectionHeading } from "@/components/section-heading"
import { HomepageEditorForm } from "@/components/admin-editor-forms"
import { getHomeContent } from "@/lib/cms"

export default async function AdminHomepagePage() {
  const homepage = await getHomeContent()

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Homepage CMS"
        title="Edit the hero, services, testimonials, stats, and CTA copy."
        description="The homepage is split into structured sections so non-code content changes stay predictable."
      />
      <HomepageEditorForm homepage={homepage} />
    </div>
  )
}
