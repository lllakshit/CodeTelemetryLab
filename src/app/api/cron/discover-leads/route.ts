import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { runDiscovery } from "@/lib/lead-discovery/pipeline"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

/**
 * Weekday lead discovery (Vercel Cron, see vercel.json). Protected by CRON_SECRET exactly like the Supabase
 * keepalive: Vercel sends "Authorization: Bearer <CRON_SECRET>". Saves at most 5 qualified prospects; never emails.
 */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return { ok: false as const, response: NextResponse.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 500 }) }
  const given = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) }
  }
  return { ok: true as const }
}

async function handle(request: Request) {
  const check = authorized(request)
  if (!check.ok) return check.response
  const result = await runDiscovery({ trigger: "cron" })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, runId: result.runId ?? null, summary: result.summary ?? null }, { status: result.status })
  }
  const { summary } = result
  return NextResponse.json({
    ok: true,
    runId: result.runId,
    candidatesFound: summary.candidates,
    deduplicated: summary.deduplicated,
    qualified: summary.qualified,
    inserted: summary.inserted,
    summary,
  })
}

export const GET = handle
export const POST = handle
