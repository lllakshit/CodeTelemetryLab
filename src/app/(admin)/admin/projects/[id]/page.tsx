import { notFound } from "next/navigation"
import { SectionHeading } from "@/components/section-heading"
import { ProjectEditorForm } from "@/components/admin-editor-forms"
import { getProjectById } from "@/lib/cms"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectById(id)
  if (!project) notFound()

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Edit project"
        title={project.title}
        description="Update the case study details."
      />
      <ProjectEditorForm project={project} />
    </div>
  )
}
