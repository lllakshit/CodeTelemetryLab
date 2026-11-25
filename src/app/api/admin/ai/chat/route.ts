import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { runTurn } from "@/lib/ai/assistant"
import { listActions } from "@/lib/ai/store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

const bodySchema = z.object({ threadId: z.string().uuid().nullish(), message: z.string().trim().min(1).max(8000) })

/** One question to the admin AI assistant. Returns the saved question, answer and any proposals it made. */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Write a message (up to 8,000 characters)." }, { status: 400 })

  const result = await runTurn({ threadId: parsed.data.threadId, text: parsed.data.message, deadlineMs: 110_000 })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, threadId: result.thread?.id ?? null, user: result.user ?? null }, { status: result.status })
  }
  const actions = await listActions(result.thread.id).catch(() => [])
  return NextResponse.json({ ok: true, threadId: result.thread.id, title: result.thread.title, user: result.user, assistant: result.assistant, actions })
}
