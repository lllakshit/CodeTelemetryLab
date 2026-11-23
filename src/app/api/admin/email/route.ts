import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createEmailLog, listEmailLogs } from "@/lib/email-logs"
import { markProspectContacted } from "@/lib/lead-discovery/store"
import { parseOutboundEmailPayload, sendOutboundEmail } from "@/lib/outbound-email"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const logs = await listEmailLogs(50)
  return NextResponse.json({ logs })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = parseOutboundEmailPayload(payload)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError =
      fieldErrors.to?.[0] ||
      fieldErrors.cc?.[0] ||
      fieldErrors.bcc?.[0] ||
      fieldErrors.subject?.[0] ||
      fieldErrors.body?.[0] ||
      "Invalid email request"

    return NextResponse.json(
      {
        error: firstError,
        fieldErrors,
      },
      { status: 400 },
    )
  }

  // Optional link to a discovered prospect (from "Write Email"); a bad id is ignored, never blocks the send.
  const rawProspectId = (payload as { prospectId?: unknown } | null)?.prospectId
  const prospectId =
    typeof rawProspectId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProspectId) ? rawProspectId : null

  const result = await sendOutboundEmail(parsed.data)

  const log = await createEmailLog({
    recipient: parsed.data.to.join(", "),
    cc: parsed.data.cc,
    bcc: parsed.data.bcc,
    subject: parsed.data.subject,
    body: parsed.data.body,
    status: result.ok ? "sent" : "failed",
    errorMessage: result.ok ? null : result.error,
    resendId: result.ok ? result.id : null,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  let prospectUpdated = false
  if (prospectId) {
    try {
      prospectUpdated = await markProspectContacted(prospectId, log.id)
    } catch (error) {
      console.error("Email sent, but the prospect status could not be updated", error)
    }
  }

  return NextResponse.json({
    ok: true,
    message:
      parsed.data.to.length > 1
        ? `Email sent successfully to ${parsed.data.to.length} recipients`
        : "Email sent successfully",
    id: result.id,
    ...(prospectId ? { prospectUpdated } : {}),
  })
}
