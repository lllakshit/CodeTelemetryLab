import { randomUUID } from "node:crypto"
import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"
import { readStore, updateStore, type EmailLog } from "@/lib/store"
import { getResendEmail } from "@/lib/outreach/resend"
import { normalizeResendEvent } from "@/lib/outreach/status"

const TABLE = "email_logs"

type EmailLogRow = {
  id: string
  recipient: string
  cc: unknown
  bcc: unknown
  subject: string
  body: string
  status: string
  error_message: string | null
  resend_id: string | null
  delivery_status?: string | null
  status_checked_at?: string | null
  status_note?: string | null
  created_at: string
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function fromRow(row: EmailLogRow): EmailLog {
  return {
    id: row.id,
    recipient: row.recipient,
    cc: asStringArray(row.cc),
    bcc: asStringArray(row.bcc),
    subject: row.subject,
    body: row.body,
    status: row.status === "sent" ? "sent" : "failed",
    errorMessage: row.error_message,
    resendId: row.resend_id,
    deliveryStatus: row.delivery_status ?? null,
    statusNote: row.status_note ?? null,
    createdAt: row.created_at,
  }
}

function toRow(log: EmailLog): EmailLogRow {
  return {
    id: log.id,
    recipient: log.recipient,
    cc: log.cc,
    bcc: log.bcc,
    subject: log.subject,
    body: log.body,
    status: log.status,
    error_message: log.errorMessage ?? null,
    resend_id: log.resendId ?? null,
    created_at: log.createdAt,
  }
}

function isSupabaseReady() {
  if (process.env.NEXT_PHASE === "phase-production-build") return false
  return getSupabaseConfig().isConfigured
}

function isMissingTableError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : ""
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : ""
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.toLowerCase().includes("does not exist") ||
    message.toLowerCase().includes("could not find the table")
  )
}

export async function listEmailLogs(limit = 40): Promise<EmailLog[]> {
  const capped = Math.min(Math.max(limit, 1), 100)

  if (isSupabaseReady()) {
    try {
      const supabase = createSupabaseAdminClient()
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(capped)

      if (error) {
        if (!isMissingTableError(error)) throw error
      } else if (data) {
        return (data as EmailLogRow[]).map(fromRow)
      }
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("Failed to list email logs from Supabase", error)
      }
    }
  }

  const store = await readStore()
  return [...(store.emailLogs ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, capped)
}

export async function createEmailLog(input: {
  recipient: string
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  status: "sent" | "failed"
  errorMessage?: string | null
  resendId?: string | null
}): Promise<EmailLog> {
  const log: EmailLog = {
    id: randomUUID(),
    recipient: input.recipient,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    body: input.body,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
    resendId: input.resendId ?? null,
    createdAt: new Date().toISOString(),
  }

  if (isSupabaseReady()) {
    try {
      const supabase = createSupabaseAdminClient()
      const { error } = await supabase.from(TABLE).insert(toRow(log))
      if (error) {
        if (!isMissingTableError(error)) throw error
      } else {
        return log
      }
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("Failed to persist email log to Supabase", error)
      }
    }
  }

  try {
    await updateStore((store) => ({
      ...store,
      emailLogs: [log, ...(store.emailLogs ?? [])].slice(0, 500),
    }))
  } catch (error) {
    console.error("Failed to persist email log to local store", error)
  }

  return log
}

const FINAL = ["delivered", "opened", "clicked", "bounced", "complained", "canceled", "failed"]

/**
 * Reads back delivery status for logged emails that are not settled yet, using the same Resend key that sent
 * them (RESEND_API_KEY). Read-only: it never sends and never changes any Resend setting.
 */
export async function refreshEmailLogStatuses() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey || !isSupabaseReady()) return { checked: 0, readable: false }

  const supabase = createSupabaseAdminClient()
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "sent")
    .not("resend_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(40)
  if (error) {
    if (isMissingTableError(error)) return { checked: 0, readable: false }
    throw error
  }

  let checked = 0
  let readable = true
  // At most 5 lookups per refresh: Resend's rate limit is shared with real sends, so stay far below it.
  for (const row of (data as EmailLogRow[]).filter(
    (item) => !FINAL.includes(item.delivery_status ?? "") && !(item.status_note ?? "").includes("only send") && (!item.status_checked_at || Date.now() - Date.parse(item.status_checked_at) > 10_000),
  ).slice(0, 5)) {
    if (!row.resend_id) continue
    const result = await getResendEmail(apiKey, row.resend_id)
    const now = new Date().toISOString()
    checked += 1
    if (!result.ok) {
      if (result.keyCannotRead) readable = false
      await supabase
        .from(TABLE)
        .update({
          status_checked_at: now,
          status_note: result.keyCannotRead
            ? "This API key can only send, so Resend will not share delivery status."
            : `Could not read status from Resend (${result.status}).`,
        })
        .eq("id", row.id)
      continue
    }
    await supabase
      .from(TABLE)
      .update({
        delivery_status: normalizeResendEvent(result.lastEvent) ?? row.delivery_status ?? "sent",
        last_event_at: now,
        status_checked_at: now,
        status_note: null,
      })
      .eq("id", row.id)
  }
  return { checked, readable }
}
