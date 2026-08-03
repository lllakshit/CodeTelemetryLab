import { z } from "zod"
import { CONTACT_DISPLAY_EMAIL, getContactNotificationFrom } from "@/lib/contact"

const emailAddress = z.string().trim().email("Enter a valid email address")

function parseAddressList(value: unknown) {
  if (value == null) return []
  const raw = String(value).trim()
  if (!raw) return []
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export const outboundEmailSchema = z.object({
  to: emailAddress,
  cc: z
    .array(emailAddress)
    .max(20, "Too many CC recipients")
    .default([]),
  bcc: z
    .array(emailAddress)
    .max(20, "Too many BCC recipients")
    .default([]),
  subject: z.string().trim().min(1, "Subject is required").max(300, "Subject is too long"),
  body: z.string().trim().min(1, "Message body is required").max(20000, "Message body is too long"),
})

export type OutboundEmailInput = z.infer<typeof outboundEmailSchema>

export function parseOutboundEmailPayload(input: unknown) {
  const source = (input ?? {}) as Record<string, unknown>
  return outboundEmailSchema.safeParse({
    to: source.to,
    cc: parseAddressList(source.cc),
    bcc: parseAddressList(source.bcc),
    subject: source.subject,
    body: source.body,
  })
}

export function getOutboundEmailFrom() {
  const fromEnv = process.env.EMAIL_FROM?.trim()
  if (fromEnv) {
    if (fromEnv.includes("<")) return fromEnv
    return `CodeTelemetryLab <${fromEnv}>`
  }
  return getContactNotificationFrom() || `CodeTelemetryLab <${CONTACT_DISPLAY_EMAIL}>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function toHtmlBody(body: string) {
  return `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; font-size: 15px; line-height: 1.65; color: #0a1317; white-space: pre-wrap;">${escapeHtml(body)}</div>`
}

export type OutboundEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; status?: number }

export async function sendOutboundEmail(input: OutboundEmailInput): Promise<OutboundEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured on the server." }
  }

  const from = getOutboundEmailFrom()
  const payload: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    text: input.body,
    html: toHtmlBody(input.body),
  }

  if (input.cc.length) payload.cc = input.cc
  if (input.bcc.length) payload.bcc = input.bcc

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let parsed: { id?: string; message?: string; name?: string } = {}
  try {
    parsed = responseText ? (JSON.parse(responseText) as typeof parsed) : {}
  } catch {
    parsed = {}
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: parsed.message || parsed.name || responseText || `Resend request failed (${response.status})`,
    }
  }

  return { ok: true, id: parsed.id ?? null }
}
