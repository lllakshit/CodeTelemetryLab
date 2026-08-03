import { randomUUID } from "node:crypto"
import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"
import { readStore, updateStore, type EmailLog } from "@/lib/store"

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
