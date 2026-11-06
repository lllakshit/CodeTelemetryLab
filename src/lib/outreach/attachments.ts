/** Attachment rules for the Outreach module. Pure functions, no framework imports. */

export const MAX_ATTACHMENTS = 5
/** Files up to this combined size travel as real attachments; anything beyond goes as a download link. */
export const MAX_INLINE_TOTAL_BYTES = 20 * 1024 * 1024

export type OutreachAttachment = {
  kind: "link" | "file"
  name: string
  url: string
  /** Files only. */
  size?: number
  mimeType?: string
  storagePath?: string
}

export type LinkInfo = { provider: string; host: string }

export function describeLink(rawUrl: string): LinkInfo {
  let host = ""
  try {
    host = new URL(rawUrl).hostname.replace(/^www\./, "")
  } catch {
    return { provider: "Link", host: "" }
  }
  if (host === "drive.google.com") return { provider: "Google Drive", host }
  if (host === "docs.google.com") {
    const path = new URL(rawUrl).pathname
    if (path.startsWith("/presentation")) return { provider: "Google Slides", host }
    if (path.startsWith("/spreadsheets")) return { provider: "Google Sheets", host }
    if (path.startsWith("/forms")) return { provider: "Google Forms", host }
    return { provider: "Google Docs", host }
  }
  if (host.endsWith("dropbox.com")) return { provider: "Dropbox", host }
  if (host === "1drv.ms" || host.endsWith("onedrive.live.com") || host.endsWith("sharepoint.com")) {
    return { provider: "OneDrive", host }
  }
  if (host === "notion.so" || host.endsWith(".notion.site")) return { provider: "Notion", host }
  if (host === "github.com") return { provider: "GitHub", host }
  return { provider: "Link", host }
}

function nameFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "")
    if (last && !/^(view|edit|preview|d|file|open)$/i.test(last)) return last
    const provider = describeLink(rawUrl).provider
    return provider === "Link" ? url.hostname.replace(/^www\./, "") : `${provider} link`
  } catch {
    return "Link"
  }
}

export type AttachmentValidation = { ok: true; value: OutreachAttachment[] } | { ok: false; error: string }

export type ValidateOptions = {
  /** Uploaded files must live under this address (our own storage), so nothing else is ever fetched or attached. */
  fileUrlPrefix?: string
}

export function validateAttachments(input: unknown, options: ValidateOptions = {}): AttachmentValidation {
  if (input == null) return { ok: true, value: [] }
  if (!Array.isArray(input)) return { ok: false, error: "Attachments must be a list." }
  if (input.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `You can add at most ${MAX_ATTACHMENTS} attachments.` }
  }

  const value: OutreachAttachment[] = []
  for (const [index, raw] of input.entries()) {
    const item = (raw ?? {}) as Record<string, unknown>
    const label = `Attachment ${index + 1}`
    const url = typeof item.url === "string" ? item.url.trim() : ""
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return { ok: false, error: `${label}: enter a full link that starts with https://` }
    }
    if (parsed.protocol !== "https:") return { ok: false, error: `${label}: links must start with https://` }

    const kind = item.kind === "file" ? "file" : "link"
    const name = (typeof item.name === "string" ? item.name.trim() : "").slice(0, 160) || nameFromUrl(url)

    if (kind === "file") {
      const size = Number(item.size)
      const storagePath = typeof item.storagePath === "string" ? item.storagePath.trim() : ""
      if (!Number.isFinite(size) || size < 0) return { ok: false, error: `${label}: the file size is missing.` }
      if (!storagePath) return { ok: false, error: `${label}: the uploaded file could not be found.` }
      if (options.fileUrlPrefix) {
        let decoded = ""
        try {
          decoded = decodeURIComponent(parsed.toString())
        } catch {
          decoded = ""
        }
        const expected = `${options.fileUrlPrefix}${storagePath}`
        if (!decoded.startsWith(options.fileUrlPrefix) || decoded !== expected || storagePath.includes("..")) {
          return { ok: false, error: `${label}: this file was not uploaded here. Upload it again.` }
        }
      }
      value.push({
        kind,
        name,
        url: parsed.toString(),
        size,
        storagePath,
        mimeType: typeof item.mimeType === "string" ? item.mimeType.slice(0, 120) : undefined,
      })
    } else {
      value.push({ kind, name, url: parsed.toString() })
    }
  }
  return { ok: true, value }
}

export type DeliveryPlan = {
  /** Sent as real email attachments. */
  inline: OutreachAttachment[]
  /** Shown in the email as links (Drive links and links, plus files that were too large to attach). */
  links: Array<OutreachAttachment & { reason: "link" | "too-large" }>
}

/**
 * Files are attached in the order given until the combined size would pass the limit;
 * the rest are sent as download links, so there is no hard size limit for the sender.
 */
export function planDelivery(attachments: OutreachAttachment[], maxInlineBytes = MAX_INLINE_TOTAL_BYTES): DeliveryPlan {
  const inline: OutreachAttachment[] = []
  const links: DeliveryPlan["links"] = []
  let used = 0
  for (const item of attachments) {
    if (item.kind === "link") {
      links.push({ ...item, reason: "link" })
    } else if (used + (item.size ?? 0) <= maxInlineBytes) {
      used += item.size ?? 0
      inline.push(item)
    } else {
      links.push({ ...item, reason: "too-large" })
    }
  }
  return { inline, links }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

export type EmailAttachmentView = { name: string; url: string; label: string; note?: string }

/** What the email shows for attachments that are links: Drive/links as they are, big files with a note. */
export function toEmailAttachments(plan: DeliveryPlan): EmailAttachmentView[] {
  return plan.links.map((item) => ({
    name: item.name,
    url: item.url,
    label: item.reason === "link" ? describeLink(item.url).provider : "File",
    note:
      item.reason === "too-large"
        ? `Sent as a download link because it is large${item.size ? ` (${formatBytes(item.size)})` : ""}`
        : undefined,
  }))
}
