import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"
import { decryptSecret, encryptSecret, lastFour } from "./crypto"
import { getResendEmail } from "./resend"
import { normalizeResendEvent } from "./status"
import type { OutreachAttachment } from "./attachments"

export type OutreachAccount = {
  id: string
  fromEmail: string
  displayName: string
  signature: string
  keyLast4: string
  isDefault: boolean
  source: "manual" | "github"
  createdAt: string
  updatedAt: string
}

export type OutreachMessage = {
  id: string
  accountId: string
  fromEmail: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  signature: string
  attachments: OutreachAttachment[]
  resendId: string | null
  status: string
  lastEvent: string | null
  lastEventAt: string | null
  statusNote: string | null
  errorMessage: string | null
  createdAt: string
}

type AccountRow = {
  id: string
  from_email: string
  display_name: string
  signature: string
  api_key_last4: string
  is_default: boolean
  source: string
  created_at: string
  updated_at: string
}

type MessageRow = {
  id: string
  account_id: string
  from_email: string
  to_emails: unknown
  cc: unknown
  bcc: unknown
  subject: string
  body: string
  signature: string
  attachments: unknown
  resend_id: string | null
  status: string
  last_event: string | null
  last_event_at: string | null
  status_checked_at: string | null
  status_note: string | null
  error_message: string | null
  created_at: string
}

const ACCOUNT_COLUMNS = "id, from_email, display_name, signature, api_key_last4, is_default, source, created_at, updated_at"

function strings(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
}

function toAccount(row: AccountRow): OutreachAccount {
  return {
    id: row.id,
    fromEmail: row.from_email,
    displayName: row.display_name,
    signature: row.signature,
    keyLast4: row.api_key_last4,
    isDefault: row.is_default,
    source: row.source === "github" ? "github" : "manual",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMessage(row: MessageRow): OutreachMessage {
  return {
    id: row.id,
    accountId: row.account_id,
    fromEmail: row.from_email,
    to: strings(row.to_emails),
    cc: strings(row.cc),
    bcc: strings(row.bcc),
    subject: row.subject,
    body: row.body,
    signature: row.signature,
    attachments: Array.isArray(row.attachments) ? (row.attachments as OutreachAttachment[]) : [],
    resendId: row.resend_id,
    status: row.status,
    lastEvent: row.last_event,
    lastEventAt: row.last_event_at,
    statusNote: row.status_note,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }
}

export function isOutreachReady() {
  if (process.env.NEXT_PHASE === "phase-production-build") return false
  return getSupabaseConfig().isConfigured
}

function serverSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured on the server.")
  return secret
}

export async function listAccounts(): Promise<OutreachAccount[]> {
  if (!isOutreachReady()) return []
  const { data, error } = await createSupabaseAdminClient()
    .from("outreach_accounts")
    .select(ACCOUNT_COLUMNS)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data as AccountRow[]).map(toAccount)
}

/** The only place a stored API key is decrypted. The result never leaves the server. */
export async function getAccountForSending(id: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("outreach_accounts")
    .select(`${ACCOUNT_COLUMNS}, api_key_ciphertext`)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as AccountRow & { api_key_ciphertext: string }
  return { account: toAccount(row), apiKey: decryptSecret(row.api_key_ciphertext, serverSecret()) }
}

export type SaveAccountInput = {
  fromEmail: string
  displayName: string
  signature?: string
  /** Required for a new account. When given for an existing one, it replaces the stored key. */
  apiKey?: string
  source: "manual" | "github"
  makeDefault?: boolean
}

export async function saveAccount(input: SaveAccountInput): Promise<OutreachAccount> {
  const supabase = createSupabaseAdminClient()
  const fromEmail = input.fromEmail.trim().toLowerCase()
  const { data: existing, error: lookupError } = await supabase
    .from("outreach_accounts")
    .select("id, is_default")
    .eq("from_email", fromEmail)
    .maybeSingle()
  if (lookupError) throw lookupError

  const now = new Date().toISOString()
  const apiKey = input.apiKey?.trim()
  const values: Record<string, unknown> = {
    display_name: input.displayName.trim(),
    updated_at: now,
  }
  if (input.signature !== undefined) values.signature = input.signature
  if (apiKey) {
    values.api_key_ciphertext = encryptSecret(apiKey, serverSecret())
    values.api_key_last4 = lastFour(apiKey)
    // The key now comes from whoever just set it: a key edited in the admin screen is never replaced by a later GitHub sync.
    values.source = input.source
  }

  let id: string
  if (existing) {
    id = (existing as { id: string }).id
    const { error } = await supabase.from("outreach_accounts").update(values).eq("id", id)
    if (error) throw error
  } else {
    if (!apiKey) throw new Error("An API key is required for a new account.")
    const { count } = await supabase.from("outreach_accounts").select("id", { count: "exact", head: true })
    const insert = (isDefault: boolean) =>
      supabase
        .from("outreach_accounts")
        .insert({
          from_email: fromEmail,
          source: input.source,
          is_default: isDefault,
          signature: input.signature ?? "",
          ...values,
        })
        .select("id")
        .single()
    let { data, error } = await insert((count ?? 0) === 0)
    // Two first inserts at once both ask to be the default; the second loses and is simply not the default.
    if (error && (error as { code?: string }).code === "23505") ({ data, error } = await insert(false))
    if (error) throw error
    id = (data as { id: string }).id
  }

  if (input.makeDefault) await setDefaultAccount(id)

  const { data, error } = await supabase.from("outreach_accounts").select(ACCOUNT_COLUMNS).eq("id", id).single()
  if (error) throw error
  return toAccount(data as AccountRow)
}

export async function setDefaultAccount(id: string) {
  const supabase = createSupabaseAdminClient()
  const { data: found, error: findError } = await supabase.from("outreach_accounts").select("id").eq("id", id).maybeSingle()
  if (findError) throw findError
  if (!found) throw new Error("That sender account does not exist.")
  const { error: clearError } = await supabase.from("outreach_accounts").update({ is_default: false }).eq("is_default", true)
  if (clearError) throw clearError
  const { error } = await supabase.from("outreach_accounts").update({ is_default: true }).eq("id", id)
  if (error) throw error
}

export class DuplicateMessageError extends Error {
  constructor(public readonly existing: OutreachMessage) {
    super("This message was already sent.")
  }
}

export async function createMessage(input: {
  /** Chosen by the browser per draft, so a double click or a retry cannot send the same email twice. */
  id?: string
  accountId: string
  fromEmail: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  signature: string
  attachments: OutreachAttachment[]
}): Promise<OutreachMessage> {
  const { data, error } = await createSupabaseAdminClient()
    .from("outreach_messages")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      account_id: input.accountId,
      from_email: input.fromEmail,
      to_emails: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      body: input.body,
      signature: input.signature,
      attachments: input.attachments,
      status: "queued",
    })
    .select("*")
    .single()
  if (error) {
    if ((error as { code?: string }).code === "23505" && input.id) {
      const { data: existing } = await createSupabaseAdminClient().from("outreach_messages").select("*").eq("id", input.id).maybeSingle()
      if (existing) throw new DuplicateMessageError(toMessage(existing as MessageRow))
    }
    throw error
  }
  return toMessage(data as MessageRow)
}

export async function markMessageSent(id: string, resendId: string) {
  const now = new Date().toISOString()
  const { error } = await createSupabaseAdminClient()
    .from("outreach_messages")
    .update({ resend_id: resendId, status: "sent", last_event: "sent", last_event_at: now })
    .eq("id", id)
  if (error) throw error
}

export async function markMessageFailed(id: string, message: string) {
  const { error } = await createSupabaseAdminClient()
    .from("outreach_messages")
    .update({ status: "failed", error_message: message.slice(0, 500), last_event_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function listMessages(limit = 40): Promise<OutreachMessage[]> {
  if (!isOutreachReady()) return []
  const { data, error } = await createSupabaseAdminClient()
    .from("outreach_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100))
  if (error) throw error
  return (data as MessageRow[]).map(toMessage)
}

const REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const MIN_RECHECK_MS = 10 * 1000
const MAX_PER_REFRESH = 10

/**
 * Asks Resend for the latest delivery event of messages that are not settled yet, so nobody has to open the
 * Resend dashboard. Keys that can only send cannot read status; that is recorded as a note instead of an error.
 */
export async function refreshOutreachStatuses() {
  if (!isOutreachReady()) return { checked: 0 }
  const supabase = createSupabaseAdminClient()
  const since = new Date(Date.now() - REFRESH_WINDOW_MS).toISOString()
  const { data, error } = await supabase
    .from("outreach_messages")
    .select("*")
    .not("resend_id", "is", null)
    .gte("created_at", since)
    .not("status", "in", "(delivered,opened,clicked,bounced,complained,canceled,failed)")
    .or("status_note.is.null,status_note.not.like.%only send%")
    .order("status_checked_at", { ascending: true, nullsFirst: true })
    .limit(MAX_PER_REFRESH)
  if (error) throw error

  const keys = new Map<string, string | null>()
  let checked = 0
  for (const row of data as MessageRow[]) {
    if (row.status_checked_at && Date.now() - Date.parse(row.status_checked_at) < MIN_RECHECK_MS) continue
    if (!keys.has(row.account_id)) {
      try {
        keys.set(row.account_id, (await getAccountForSending(row.account_id))?.apiKey ?? null)
      } catch {
        keys.set(row.account_id, null)
      }
    }
    const apiKey = keys.get(row.account_id)
    if (!apiKey || !row.resend_id) continue

    const result = await getResendEmail(apiKey, row.resend_id)
    const now = new Date().toISOString()
    checked += 1
    if (!result.ok) {
      await supabase
        .from("outreach_messages")
        .update({
          status_checked_at: now,
          status_note: result.keyCannotRead
            ? "This API key can only send, so Resend will not share delivery status. Use a full-access key to see it here."
            : `Could not read status from Resend (${result.status}).`,
        })
        .eq("id", row.id)
      continue
    }
    const status = normalizeResendEvent(result.lastEvent) ?? row.status
    await supabase
      .from("outreach_messages")
      .update({
        status,
        last_event: result.lastEvent,
        last_event_at: status !== row.status ? now : row.last_event_at,
        status_checked_at: now,
        status_note: null,
      })
      .eq("id", row.id)
  }
  return { checked }
}
