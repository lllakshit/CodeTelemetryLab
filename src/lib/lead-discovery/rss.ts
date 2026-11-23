/** Minimal RSS 2.0 / Atom reader for startup-news feeds. Pure. */
import { decodeEntities, extractLinks, htmlToText, stripCdata } from "./html.ts"

export type FeedItem = {
  title: string
  link: string
  publishedAt: string | null
  /** Plain-text summary. */
  summary: string
  /** Links found inside the item's description or full content. */
  links: string[]
}

function tag(block: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(":", "\\:")
    const match = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i").exec(block)
    if (match) return stripCdata(match[1]).trim()
  }
  return null
}

function atomLink(block: string): string | null {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((match) => match[1])
  const pick = links.find((attrs) => /rel\s*=\s*["']alternate["']/i.test(attrs)) ?? links.find((attrs) => !/rel\s*=/i.test(attrs)) ?? links[0]
  const href = pick ? /href\s*=\s*["']([^"']+)["']/i.exec(pick)?.[1] : null
  return href ? decodeEntities(href) : null
}

/** Time-zone abbreviations some feeds use instead of numeric offsets ("Thu, 19 Nov 2026 17:11:15 EET"). */
const ZONES: Record<string, string> = {
  UT: "+0000", UTC: "+0000", GMT: "+0000", Z: "+0000", BST: "+0100", WET: "+0000", WEST: "+0100", CET: "+0100", CEST: "+0200",
  EET: "+0200", EEST: "+0300", MSK: "+0300", GST: "+0400", IST: "+0530", SGT: "+0800", AWST: "+0800", ACST: "+0930",
  AEST: "+1000", AEDT: "+1100", NZST: "+1200", NZDT: "+1300", EST: "-0500", EDT: "-0400", CST: "-0600", CDT: "-0500",
  MST: "-0700", MDT: "-0600", PST: "-0800", PDT: "-0700",
}

export function toIso(value: string | null): string | null {
  if (!value) return null
  const raw = value.trim()
  let time = Date.parse(raw)
  if (!Number.isFinite(time)) {
    const zone = /\s([A-Z]{1,5})$/.exec(raw)
    if (zone && ZONES[zone[1]]) time = Date.parse(raw.replace(/\s[A-Z]{1,5}$/, ` ${ZONES[zone[1]]}`))
  }
  return Number.isFinite(time) ? new Date(time).toISOString() : null
}

export function parseFeed(xml: string, maxItems = 60): FeedItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? []
  const items: FeedItem[] = []
  for (const block of blocks.slice(0, maxItems)) {
    const title = htmlToText(tag(block, ["title"]) ?? "").replace(/\s+/g, " ").trim()
    const rawLink = tag(block, ["link"])
    const link = (rawLink && /^https?:\/\//i.test(decodeEntities(rawLink)) ? decodeEntities(rawLink) : atomLink(block))?.trim() ?? ""
    if (!title || !/^https?:\/\//i.test(link)) continue
    const description = tag(block, ["description", "summary"]) ?? ""
    const content = tag(block, ["content:encoded", "content"]) ?? ""
    items.push({
      title,
      link,
      publishedAt: toIso(tag(block, ["pubDate", "published", "updated", "dc:date"])),
      summary: htmlToText(description || content).replace(/\s+/g, " ").slice(0, 600),
      links: extractLinks(`${description} ${content}`, link),
    })
  }
  return items
}
