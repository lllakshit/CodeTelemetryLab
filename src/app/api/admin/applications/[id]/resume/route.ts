import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createResumeSignedUrl, getApplication } from "@/lib/applications"

/** Admin-only: redirects to a short-lived signed link to the applicant's private résumé. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const application = await getApplication(id)
  if (!application?.resumePath) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const url = await createResumeSignedUrl(application.resumePath, 300)
  return NextResponse.redirect(url, 302)
}
