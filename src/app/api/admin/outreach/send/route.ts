import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendOutreach } from "@/lib/outreach/service"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const result = await sendOutreach(payload)
  if (!result.ok) {
    return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status })
  }
  return NextResponse.json({
    ok: true,
    message: result.message,
    notice:
      result.sentAsLinks > 0
        ? `${result.sentAsLinks} large file${result.sentAsLinks === 1 ? " was" : "s were"} sent as download links.`
        : null,
  })
}
