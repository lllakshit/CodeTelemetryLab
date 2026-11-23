import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { runDiscovery } from "@/lib/lead-discovery/pipeline"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

/** "Run discovery now" from the admin Prospects screen. Same pipeline as the weekday cron. */
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await runDiscovery({ trigger: "manual" })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, summary: result.summary ?? null }, { status: result.status })
  }
  return NextResponse.json({ ok: true, runId: result.runId, summary: result.summary })
}
