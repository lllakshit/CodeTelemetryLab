import { createSupabaseAdminClient } from "@/lib/supabase"

/** Saved AI threads, messages and proposed changes. Server only (service role). */

export type ToolCallLog = { name: string; args: Record<string, unknown>; ok: boolean; preview: string }

export type Thread = {
  id: string
  title: string
  summary: string
  summarizedThrough: string | null
  pinned: boolean
  archived: boolean
  messageCount: number
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: string
  threadId: string
  role: "user" | "assistant"
  content: string
  toolCalls: ToolCallLog[]
  model: string | null
  tokens: number | null
  createdAt: string
}

export type ActionKind = "blog_seo" | "lead_update" | "application_update"
export type ActionStatus = "pending" | "applied" | "dismissed" | "failed"

export type Action = {
  id: string
  threadId: string | null
  messageId: string | null
  kind: ActionKind
  targetId: string
  targetLabel: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  reason: string
  status: ActionStatus
  error: string | null
  createdAt: string
}

const db = () => createSupabaseAdminClient()

type ThreadRow = {
  id: string
  title: string
  summary: string
  summarized_through: string | null
  pinned: boolean
  archived: boolean
  message_count: number
  created_at: string
  updated_at: string
}

const toThread = (r: ThreadRow): Thread => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  summarizedThrough: r.summarized_through,
  pinned: r.pinned,
  archived: r.archived,
  messageCount: r.message_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

type MessageRow = { id: string; thread_id: string; role: "user" | "assistant"; content: string; tool_calls: ToolCallLog[] | null; model: string | null; tokens: number | null; created_at: string }

const toMessage = (r: MessageRow): Message => ({
  id: r.id,
  threadId: r.thread_id,
  role: r.role,
  content: r.content,
  toolCalls: r.tool_calls ?? [],
  model: r.model,
  tokens: r.tokens,
  createdAt: r.created_at,
})

type ActionRow = {
  id: string
  thread_id: string | null
  message_id: string | null
  kind: ActionKind
  target_id: string
  target_label: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  reason: string
  status: ActionStatus
  error: string | null
  created_at: string
}

const toAction = (r: ActionRow): Action => ({
  id: r.id,
  threadId: r.thread_id,
  messageId: r.message_id,
  kind: r.kind,
  targetId: r.target_id,
  targetLabel: r.target_label,
  before: r.before ?? {},
  after: r.after ?? {},
  reason: r.reason,
  status: r.status,
  error: r.error,
  createdAt: r.created_at,
})

function fail(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`)
}

export async function listThreads(input: { archived?: boolean; search?: string; limit?: number } = {}): Promise<Thread[]> {
  let query = db()
    .from("ai_threads")
    .select("*")
    .eq("archived", Boolean(input.archived))
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 100)
  const term = input.search?.replace(/[%,()]/g, " ").trim()
  if (term) query = query.ilike("title", `%${term}%`)
  const { data, error } = await query
  fail("Loading chats", error)
  return ((data ?? []) as ThreadRow[]).map(toThread)
}

export async function getThread(id: string): Promise<Thread | null> {
  const { data, error } = await db().from("ai_threads").select("*").eq("id", id).maybeSingle()
  fail("Loading chat", error)
  return data ? toThread(data as ThreadRow) : null
}

export async function createThread(title: string): Promise<Thread> {
  const { data, error } = await db().from("ai_threads").insert({ title: title.slice(0, 120) || "New chat" }).select("*").single()
  fail("Creating chat", error)
  return toThread(data as ThreadRow)
}

export async function updateThread(id: string, patch: Partial<{ title: string; pinned: boolean; archived: boolean; summary: string; summarizedThrough: string | null }>) {
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title.slice(0, 120)
  if (patch.pinned !== undefined) row.pinned = patch.pinned
  if (patch.archived !== undefined) row.archived = patch.archived
  if (patch.summary !== undefined) row.summary = patch.summary
  if (patch.summarizedThrough !== undefined) row.summarized_through = patch.summarizedThrough
  const { error } = await db().from("ai_threads").update(row).eq("id", id)
  fail("Saving chat", error)
}

export async function deleteThread(id: string) {
  const { error } = await db().from("ai_threads").delete().eq("id", id)
  fail("Deleting chat", error)
}

export async function listMessages(threadId: string, opts: { after?: string | null; limit?: number } = {}): Promise<Message[]> {
  let query = db().from("ai_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(opts.limit ?? 500)
  if (opts.after) query = query.gt("created_at", opts.after)
  const { data, error } = await query
  fail("Loading messages", error)
  return ((data ?? []) as MessageRow[]).map(toMessage)
}

/** The last `limit` messages, oldest first. */
export async function recentMessages(threadId: string, limit: number): Promise<Message[]> {
  const { data, error } = await db().from("ai_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: false }).limit(limit)
  fail("Loading messages", error)
  return ((data ?? []) as MessageRow[]).map(toMessage).reverse()
}

export async function addMessage(input: { threadId: string; role: "user" | "assistant"; content: string; toolCalls?: ToolCallLog[]; model?: string | null; tokens?: number | null }): Promise<Message> {
  const { data, error } = await db()
    .from("ai_messages")
    .insert({
      thread_id: input.threadId,
      role: input.role,
      content: input.content.slice(0, 100_000),
      tool_calls: input.toolCalls ?? [],
      model: input.model ?? null,
      tokens: input.tokens ?? null,
    })
    .select("*")
    .single()
  fail("Saving message", error)
  const { count } = await db().from("ai_messages").select("*", { count: "exact", head: true }).eq("thread_id", input.threadId)
  await db().from("ai_threads").update({ message_count: count ?? 0, updated_at: new Date().toISOString() }).eq("id", input.threadId)
  return toMessage(data as MessageRow)
}

export async function createAction(input: { threadId: string; kind: ActionKind; targetId: string; targetLabel: string; before: Record<string, unknown>; after: Record<string, unknown>; reason: string }) {
  const { data, error } = await db()
    .from("ai_actions")
    .insert({ thread_id: input.threadId, kind: input.kind, target_id: input.targetId, target_label: input.targetLabel.slice(0, 300), before: input.before, after: input.after, reason: input.reason.slice(0, 600) })
    .select("id")
    .single()
  fail("Saving proposal", error)
  return (data as { id: string }).id
}

export async function linkActions(ids: string[], messageId: string) {
  if (!ids.length) return
  await db().from("ai_actions").update({ message_id: messageId }).in("id", ids)
}

export async function listActions(threadId: string): Promise<Action[]> {
  const { data, error } = await db().from("ai_actions").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(200)
  fail("Loading proposals", error)
  return ((data ?? []) as ActionRow[]).map(toAction)
}

export async function getAction(id: string): Promise<Action | null> {
  const { data, error } = await db().from("ai_actions").select("*").eq("id", id).maybeSingle()
  fail("Loading proposal", error)
  return data ? toAction(data as ActionRow) : null
}

/** Moves a pending proposal to its final state; false if it was already decided (double click, two tabs). */
export async function decideAction(id: string, status: Exclude<ActionStatus, "pending">, error?: string): Promise<boolean> {
  const { data, error: dbError } = await db()
    .from("ai_actions")
    .update({ status, error: error ?? null, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
  fail("Saving proposal", dbError)
  return (data ?? []).length > 0
}
