/** Builds the HTML and plain-text versions of an Outreach email. Pure functions, no framework imports. */

export type TemplateAttachment = {
  name: string
  url: string
  /** "Google Drive", "Link", "File"… */
  label: string
  note?: string
}

export type OutreachTemplateInput = {
  subject: string
  body: string
  signature?: string
  attachments: TemplateAttachment[]
  senderName: string
  senderEmail: string
  brandName: string
  siteUrl: string
  logoUrl: string
  /** false drops the brand footer (logo, site, sender line) for mail that goes out under another name. Default true. */
  showFooter?: boolean
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const LINK_PATTERN = /\[([^\]\n]{1,200})\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)|(https?:\/\/[^\s<>"']+)/g
const TRAILING_PUNCTUATION = /[.,;:!?)]+$/

type Piece = { text: string } | { label: string; url: string }

/** Splits text into plain pieces and links: [label](url) and bare https:// addresses become links. */
function splitInline(text: string): Piece[] {
  const pieces: Piece[] = []
  let last = 0
  for (const match of text.matchAll(LINK_PATTERN)) {
    const index = match.index ?? 0
    if (index > last) pieces.push({ text: text.slice(last, index) })
    if (match[2]) {
      pieces.push({ label: match[1], url: match[2] })
      last = index + match[0].length
    } else {
      let url = match[3]
      const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? ""
      if (trailing) url = url.slice(0, -trailing.length)
      pieces.push({ label: url, url })
      last = index + url.length
    }
  }
  if (last < text.length) pieces.push({ text: text.slice(last) })
  return pieces
}

function inlineHtml(text: string) {
  return splitInline(text)
    .map((piece) =>
      "url" in piece
        ? `<a href="${escapeHtml(piece.url)}" style="color:#0064e0;text-decoration:underline;">${escapeHtml(piece.label)}</a>`
        : escapeHtml(piece.text),
    )
    .join("")
}

function inlineText(text: string) {
  return splitInline(text)
    .map((piece) => {
      if (!("url" in piece)) return piece.text
      return piece.label === piece.url ? piece.url : `${piece.label} (${piece.url})`
    })
    .join("")
}

type Block = { type: "paragraph"; lines: string[] } | { type: "list"; items: string[] }

const BULLET = /^\s*(?:[*\-•])\s+(.*)$/

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] | null = null
  let list: string[] | null = null
  const flush = () => {
    if (paragraph?.length) blocks.push({ type: "paragraph", lines: paragraph })
    if (list?.length) blocks.push({ type: "list", items: list })
    paragraph = null
    list = null
  }
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    const bullet = line.match(BULLET)
    if (bullet) {
      if (paragraph) {
        blocks.push({ type: "paragraph", lines: paragraph })
        paragraph = null
      }
      list = list ?? []
      list.push(bullet[1])
    } else {
      if (list) {
        blocks.push({ type: "list", items: list })
        list = null
      }
      paragraph = paragraph ?? []
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

const FONT = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function blocksHtml(text: string) {
  return parseBlocks(text)
    .map((block) =>
      block.type === "paragraph"
        ? `<p style="margin:0 0 14px;">${block.lines.map(inlineHtml).join("<br />")}</p>`
        : `<ul style="margin:0 0 14px;padding-left:22px;">${block.items
            .map((item) => `<li style="margin:0 0 6px;">${inlineHtml(item)}</li>`)
            .join("")}</ul>`,
    )
    .join("")
}

function blocksText(text: string) {
  return parseBlocks(text)
    .map((block) =>
      block.type === "paragraph"
        ? block.lines.map(inlineText).join("\n")
        : block.items.map((item) => `- ${inlineText(item)}`).join("\n"),
    )
    .join("\n\n")
}

function attachmentsHtml(attachments: TemplateAttachment[]) {
  if (!attachments.length) return ""
  const rows = attachments
    .map(
      (item) => `<tr><td style="padding:0 0 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #dbe3ec;border-radius:10px;">
          <tr>
            <td style="padding:10px 12px;font-family:${FONT};font-size:14px;line-height:1.4;">
              <span style="display:inline-block;margin-right:8px;padding:2px 8px;border-radius:999px;background:#eef4ff;color:#0b4fbf;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(item.label)}</span>
              <a href="${escapeHtml(item.url)}" style="color:#0f172a;font-weight:600;text-decoration:none;">${escapeHtml(item.name)}</a>
              ${item.note ? `<div style="margin-top:4px;font-size:12px;color:#64748b;">${escapeHtml(item.note)}</div>` : ""}
            </td>
          </tr>
        </table>
      </td></tr>`,
    )
    .join("")
  return `<p style="margin:18px 0 8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Attachments</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>`
}

export function renderOutreachEmail(input: OutreachTemplateInput) {
  const siteHost = input.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const signature = input.signature?.trim() ?? ""
  const showFooter = input.showFooter !== false
  const preheader = input.body.replace(/\s+/g, " ").trim().slice(0, 140)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="left" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">
          <tr>
            <td style="font-family:${FONT};font-size:15px;line-height:1.65;color:#1f2933;">
              ${blocksHtml(input.body)}
              ${attachmentsHtml(input.attachments)}
              ${signature ? `<div style="margin-top:18px;">${blocksHtml(signature)}</div>` : ""}
            </td>
          </tr>
          ${showFooter ? `          <tr>
            <td style="padding-top:18px;border-top:1px solid #e2e8f0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <a href="${escapeHtml(input.siteUrl)}" style="text-decoration:none;">
                      <img src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(input.brandName)}" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:8px;border:1px solid #e2e8f0;background:#ffffff;" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;font-family:\${FONT};font-size:12px;line-height:1.5;color:#64748b;">
                    <strong style="color:#0f172a;">${escapeHtml(input.senderName)}</strong> · ${escapeHtml(input.brandName)}<br />
                    <a href="${escapeHtml(input.siteUrl)}" style="color:#0064e0;text-decoration:none;">${escapeHtml(siteHost)}</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:${escapeHtml(input.senderEmail)}" style="color:#0064e0;text-decoration:none;">${escapeHtml(input.senderEmail)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
` : ""}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const attachmentLines = input.attachments.length
    ? `\n\nAttachments:\n${input.attachments
        .map((item) => `- ${item.name} (${item.label}): ${item.url}${item.note ? ` [${item.note}]` : ""}`)
        .join("\n")}`
    : ""
  const text = `${blocksText(input.body)}${attachmentLines}${signature ? `\n\n${blocksText(signature)}` : ""}${showFooter ? `\n\n--\n${input.senderName} · ${input.brandName}\n${input.siteUrl}` : ""}`

  return { html, text }
}
