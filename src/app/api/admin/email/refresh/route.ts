import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { listEmailLogs, refreshEmailLogStatuses } from "@/lib/email-logs"

/** Refreshes delivery status for the existing admin Email log. Read-only against Resend. */
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let readable = true
  try {
    readable = (await refreshEmailLogStatuses()).readable
  } catch (error) {
    console.error("Email log status refresh failed", error)
  }
  return NextResponse.json({ logs: await listEmailLogs(50), readable })
}
