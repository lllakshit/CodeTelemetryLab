import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { MAX_HISTORY_DAYS } from "@/lib/search-console/dates"
import { syncSearchConsole } from "@/lib/search-console/sync"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

const bodySchema = z.object({ days: z.number().int().min(1).max(MAX_HISTORY_DAYS).default(90) })

/** "Sync now" / "Load 16 months" from the admin Search Console screen. */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "days must be 1-486" }, { status: 400 })
  const result = await syncSearchConsole({ days: parsed.data.days, trigger: "manual", deadlineMs: 280_000 })
  if (!result.ok) return NextResponse.json(result, { status: result.status })
  return NextResponse.json(result)
}
