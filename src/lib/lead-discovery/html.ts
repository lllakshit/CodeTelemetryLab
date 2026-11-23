/** Small HTML helpers: text extraction, links and public email addresses. Pure, no dependencies. */

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", trade: "™", middot: "·", bull: "•",
}

function codePoint(code: number) {
  return Number.isInteger(code) && code > 0 && code < 0x110000 && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : ""
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => codePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED[name.toLowerCase()] ?? match)
}

/** Removes CDATA wrappers used by RSS feeds. */
export function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
}

/** Visible text of an HTML document or fragment, whitespace collapsed. */
export function htmlToText(html: string): string {
  return decodeEntities(
    stripCdata(html)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|p|div|li|h[1-6]|tr|section|article|header|footer)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

/** Text of the <title> tag, if any. */
export function pageTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  const title = match ? htmlToText(match[1]).replace(/\s+/g, " ").trim() : ""
  return title ? title.slice(0, 300) : null
}

/** Content of <meta name|property="..."> tags (description, og:site_name, og:description). */
export function metaContent(html: string, key: string): string | null {
  const head = html.slice(0, 200_000)
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /\b(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase()
    if (name !== key.toLowerCase()) continue
    const content = /\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i.exec(tag)
    const value = content ? decodeEntities(content[1] ?? content[2] ?? "").trim() : ""
    if (value) return value.slice(0, 1000)
  }
  return null
}

/** Absolute http(s) links in the document, in order, without duplicates or fragments. */
export function extractLinks(html: string, baseUrl?: string): string[] {
  const seen = new Set<string>()
  const links: string[] = []
  for (const match of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const raw = decodeEntities((match[1] ?? match[2] ?? match[3] ?? "").trim())
    if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(raw)) continue
    try {
      const url = new URL(raw, baseUrl)
      if (url.protocol !== "http:" && url.protocol !== "https:") continue
      url.hash = ""
      const value = url.toString()
      if (!seen.has(value)) {
        seen.add(value)
        links.push(value)
      }
    } catch {
      // Ignore malformed links.
    }
  }
  return links
}

const EMAIL = /[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}/gi
const ASSET_SUFFIX = /\.(png|jpe?g|gif|webp|svg|avif|ico|css|js|mjs|woff2?|ttf|mp4|webm)$/i
const ROLE_PRIORITY = ["hello", "contact", "founders", "founder", "partnerships", "partners", "bd", "business", "sales", "info", "team", "hi"]
const NEVER = /^(no-?reply|do-?not-?reply|privacy|legal|abuse|security|dmca|gdpr|dpo|unsubscribe|bounce|mailer-daemon|postmaster|webmaster|example|test|sentry|wordpress|press|media|pr|careers|jobs|job|hiring|recruit\w*|talent|hr|people|billing|invoices?|accounts?|payments?|ap|finance|investors?|ir)$|^(no-?reply|do-?not-?reply|bounce)/i

/** Email addresses that appear in the page (mailto links and visible text), lower-cased, without assets. */
export function extractEmails(html: string): string[] {
  const found = new Set<string>()
  const haystack = `${html.replace(/%40/gi, "@")} ${decodeEntities(html)}`
  for (const match of haystack.matchAll(EMAIL)) {
    const email = match[0].toLowerCase().replace(/^mailto:/, "")
    if (ASSET_SUFFIX.test(email) || /@\d+x\./.test(email)) continue
    found.add(email)
  }
  return [...found]
}

/**
 * The best public business address on the company's own domain, or null. Only addresses on that domain count (no
 * personal Gmail, no agency addresses) and system mailboxes are skipped. Nothing is ever guessed.
 */
export function pickPublicEmail(emails: string[], domain: string): string | null {
  const own = emails.filter((email) => {
    const host = email.slice(email.lastIndexOf("@") + 1)
    const local = email.slice(0, email.lastIndexOf("@"))
    return (host === domain || host.endsWith(`.${domain}`)) && !NEVER.test(local)
  })
  if (!own.length) return null
  const rank = (email: string) => {
    const local = email.slice(0, email.lastIndexOf("@"))
    const index = ROLE_PRIORITY.indexOf(local)
    return index === -1 ? ROLE_PRIORITY.length : index
  }
  return [...own].sort((a, b) => rank(a) - rank(b) || a.length - b.length)[0]
}

/** Shortens text to at most `max` characters on a word boundary. */
export function clip(text: string, max: number): string {
  const value = text.replace(/\s+/g, " ").trim()
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trim()}…`
}
