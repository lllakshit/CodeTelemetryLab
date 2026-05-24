import { SectionHeading } from "@/components/section-heading"
import { ProjectEditorForm } from "@/components/admin-editor-forms"

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="New project"
        title="Create a case study"
        description="Add a project title, stack, screenshots, and the result statement."
      />
      <ProjectEditorForm />
    </div>
  )
}
