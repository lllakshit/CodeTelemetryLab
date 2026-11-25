import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { syncSearchConsole } from "@/lib/search-console/sync"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

/** Daily Search Console sync (Vercel Cron, see vercel.json): the last 10 days, since Google revises recent days. */
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const given = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  const result = await syncSearchConsole({ days: 10, trigger: "cron", deadlineMs: 280_000 })
  // Not connected yet is a normal state, not a failure worth alerting on.
  if (!result.ok && result.status === 409) return NextResponse.json({ ok: true, skipped: result.error })
  return NextResponse.json(result, { status: result.ok ? 200 : result.status })
}

export const GET = handle
export const POST = handle
