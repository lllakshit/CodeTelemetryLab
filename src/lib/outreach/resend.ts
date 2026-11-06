/** Thin Resend client for the Outreach module. It only ever uses the API key it is given. */

const API = "https://api.resend.com"

export type ResendSendPayload = {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  text: string
  reply_to?: string
  attachments?: Array<{ filename: string; path: string }>
}

export type ResendSendResult = { ok: true; id: string } | { ok: false; error: string; status: number }

async function readJson(response: Response) {
  const text = await response.text()
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    return { message: text }
  }
}

function errorMessage(body: Record<string, unknown>, status: number) {
  const message = typeof body.message === "string" ? body.message : ""
  const name = typeof body.name === "string" ? body.name : ""
  return message || name || `Resend request failed (${status})`
}

export async function sendResendEmail(
  apiKey: string,
  payload: ResendSendPayload,
  idempotencyKey?: string,
): Promise<ResendSendResult> {
  const response = await fetch(`${API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  })
  const body = await readJson(response)
  if (!response.ok) return { ok: false, status: response.status, error: errorMessage(body, response.status) }
  if (typeof body.id !== "string") return { ok: false, status: response.status, error: "Resend did not return a message id." }
  return { ok: true, id: body.id }
}

export type ResendLookupResult =
  | { ok: true; lastEvent: string | null }
  | { ok: false; status: number; error: string; keyCannotRead: boolean }

/** Reads the latest event of a sent email. Keys that can only send are refused by Resend (401 or 403). */
export async function getResendEmail(apiKey: string, id: string): Promise<ResendLookupResult> {
  const response = await fetch(`${API}/emails/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  })
  const body = await readJson(response)
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: errorMessage(body, response.status),
      keyCannotRead: response.status === 401 || response.status === 403,
    }
  }
  return { ok: true, lastEvent: typeof body.last_event === "string" ? body.last_event : null }
}

/** "Lakshit Mathur" <lakshit@codetelemetrylab.me>, safe for names with quotes or commas. */
export function formatFromAddress(displayName: string, email: string) {
  const name = displayName.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/["\\]/g, "").trim()
  return name ? `"${name}" <${email}>` : email
}
