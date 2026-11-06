import { z } from "zod"
import { EMAIL_FOOTER_LOGO_URL } from "@/lib/email-branding"
import { BRAND_NAME, SITE_URL } from "@/lib/seo"
import { getSupabaseConfig } from "@/lib/supabase"
import { planDelivery, toEmailAttachments, validateAttachments, type OutreachAttachment } from "./attachments"
import { formatFromAddress, sendResendEmail } from "./resend"
import { renderOutreachEmail } from "./template"
import {
  DuplicateMessageError,
  createMessage,
  getAccountForSending,
  markMessageFailed,
  markMessageSent,
  type OutreachMessage,
} from "./store"

const email = z.string().trim().toLowerCase().email("Enter a valid email address")
const list = (max: number, label: string) => z.array(email).max(max, `Too many ${label} recipients`).default([])

const noControlChars = (value: string) => value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim()

export const sendSchema = z.object({
  draftId: z.string().uuid().optional(),
  accountId: z.string().uuid("Choose a sender account"),
  to: z.array(email).min(1, "Add at least one recipient").max(20, "Too many To recipients"),
  cc: list(20, "CC"),
  bcc: list(20, "BCC"),
  subject: z.string().transform(noControlChars).pipe(z.string().min(1, "Subject is required").max(300, "Subject is too long")),
  body: z.string().trim().min(1, "Message body is required").max(20000, "Message body is too long"),
  signature: z.string().max(2000, "Signature is too long").default(""),
  attachments: z.unknown().optional(),
})

export function splitAddresses(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== "string") return []
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

const ATTACHMENT_BUCKET = "outreach-attachments"

/** Checks each uploaded file really exists in our storage and reads its real size, ignoring what the browser claimed. */
async function verifyUploadedFiles(attachments: OutreachAttachment[]): Promise<OutreachAttachment[] | string> {
  const verified: OutreachAttachment[] = []
  for (const item of attachments) {
    if (item.kind !== "file") {
      verified.push(item)
      continue
    }
    try {
      const response = await fetch(item.url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(8000) })
      const length = Number(response.headers.get("content-length"))
      if (!response.ok || !Number.isFinite(length)) return `“${item.name}” could not be found. Upload it again.`
      verified.push({ ...item, size: length })
    } catch {
      return `“${item.name}” could not be checked. Try again.`
    }
  }
  return verified
}

export type SendOutreachResult =
  | { ok: true; message: OutreachMessage; sentAsLinks: number }
  | { ok: false; status: number; error: string; fieldErrors?: unknown }

export async function sendOutreach(input: unknown): Promise<SendOutreachResult> {
  const source = (input ?? {}) as Record<string, unknown>
  const parsed = sendSchema.safeParse({
    ...source,
    to: splitAddresses(source.to),
    cc: splitAddresses(source.cc),
    bcc: splitAddresses(source.bcc),
  })
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
    const first = Object.values(flat).find((messages) => messages?.length)?.[0] ?? "Invalid email request"
    return { ok: false, status: 400, error: first, fieldErrors: flat }
  }
  const data = parsed.data

  const storageUrl = getSupabaseConfig().url
  const attachments = validateAttachments(data.attachments, {
    fileUrlPrefix: storageUrl ? `${storageUrl.replace(/\/$/, "")}/storage/v1/object/public/${ATTACHMENT_BUCKET}/` : undefined,
  })
  if (!attachments.ok) return { ok: false, status: 400, error: attachments.error }
  const checked = await verifyUploadedFiles(attachments.value)
  if (typeof checked === "string") return { ok: false, status: 400, error: checked }

  let loaded
  try {
    loaded = await getAccountForSending(data.accountId)
  } catch (error) {
    console.error("Outreach: could not load the sender account", error)
    return { ok: false, status: 500, error: "Could not load the sender account." }
  }
  if (!loaded) return { ok: false, status: 404, error: "That sender account no longer exists." }
  const { account, apiKey } = loaded

  const plan = planDelivery(checked)
  const rendered = renderOutreachEmail({
    subject: data.subject,
    body: data.body,
    signature: data.signature,
    attachments: toEmailAttachments(plan),
    senderName: account.displayName,
    senderEmail: account.fromEmail,
    brandName: BRAND_NAME,
    siteUrl: SITE_URL,
    logoUrl: EMAIL_FOOTER_LOGO_URL,
  })

  let message: OutreachMessage
  try {
    message = await createMessage({
      id: data.draftId,
      accountId: account.id,
      fromEmail: account.fromEmail,
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      body: data.body,
      signature: data.signature,
      attachments: checked,
    })
  } catch (error) {
    if (error instanceof DuplicateMessageError) {
      return { ok: true, message: error.existing, sentAsLinks: 0 }
    }
    console.error("Outreach: could not record the message", error)
    return { ok: false, status: 500, error: "Could not record the message, so it was not sent." }
  }

  const result = await sendResendEmail(
    apiKey,
    {
      from: formatFromAddress(account.displayName, account.fromEmail),
      to: data.to,
      ...(data.cc.length ? { cc: data.cc } : {}),
      ...(data.bcc.length ? { bcc: data.bcc } : {}),
      subject: data.subject,
      html: rendered.html,
      text: rendered.text,
      reply_to: account.fromEmail,
      ...(plan.inline.length
        ? { attachments: plan.inline.map((item) => ({ filename: item.name, path: item.url })) }
        : {}),
    },
    message.id,
  )

  if (!result.ok) {
    await markMessageFailed(message.id, result.error).catch((error) => console.error("Outreach: could not record failure", error))
    return { ok: false, status: result.status >= 400 && result.status < 600 ? 502 : 500, error: result.error }
  }

  // The email is already out. If recording it fails, try once more rather than leave it "queued" forever.
  await markMessageSent(message.id, result.id).catch(() =>
    markMessageSent(message.id, result.id).catch((error) => console.error("Outreach: could not record the send", error)),
  )
  return {
    ok: true,
    message: { ...message, resendId: result.id, status: "sent", lastEvent: "sent" },
    sentAsLinks: plan.links.filter((item) => item.reason === "too-large").length,
  }
}

