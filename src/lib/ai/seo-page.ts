import { decodeEntities, htmlToText, metaContent, pageTitle } from "../lead-discovery/html.ts"

/** On-page SEO facts from a page's HTML, for the assistant's audit_page tool. Pure: safe to unit test. */
export type PageAudit = {
  title: string | null
  titleLength: number
  description: string | null
  descriptionLength: number
  canonical: string | null
  robots: string | null
  h1: string[]
  h2: string[]
  words: number
  images: number
  imagesWithoutAlt: number
  internalLinks: number
  externalLinks: number
  jsonLdTypes: string[]
  ogTitle: string | null
  ogImage: string | null
  issues: string[]
}

function headings(html: string, tag: "h1" | "h2") {
  const out: string[] = []
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi")
  for (const match of html.matchAll(re)) {
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
    if (text) out.push(text.slice(0, 160))
  }
  return out
}

function linkHref(html: string, rel: string) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0]
    if (new RegExp(`rel=["'][^"']*\\b${rel}\\b`, "i").test(tag)) return /href=["']([^"']+)["']/i.exec(tag)?.[1] ?? null
  }
  return null
}

export function auditHtml(html: string, pageUrl: string): PageAudit {
  const base = new URL(pageUrl)
  const title = pageTitle(html)
  const description = metaContent(html, "description")
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html
  const text = htmlToText(body.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " "))
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  let internal = 0
  let external = 0
  for (const match of body.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    try {
      const url = new URL(match[1], base)
      if (!/^https?:$/.test(url.protocol)) continue
      if (url.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "")) internal += 1
      else external += 1
    } catch {
      // ignore bad links
    }
  }
  const jsonLdTypes = new Set<string>()
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const type of match[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g)) jsonLdTypes.add(type[1])
  }
  const h1 = headings(html, "h1")
  const audit: PageAudit = {
    title,
    titleLength: title?.length ?? 0,
    description,
    descriptionLength: description?.length ?? 0,
    canonical: linkHref(html, "canonical"),
    robots: metaContent(html, "robots"),
    h1,
    h2: headings(html, "h2").slice(0, 12),
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    images: imgs.length,
    imagesWithoutAlt: imgs.filter((tag) => !/\balt=["'][^"']+["']/i.test(tag)).length,
    internalLinks: internal,
    externalLinks: external,
    jsonLdTypes: [...jsonLdTypes].slice(0, 12),
    ogTitle: metaContent(html, "og:title"),
    ogImage: metaContent(html, "og:image"),
    issues: [],
  }
  if (!audit.title) audit.issues.push("missing <title>")
  else if (audit.titleLength > 60) audit.issues.push(`title is ${audit.titleLength} chars (Google shows about 50-60)`)
  else if (audit.titleLength < 25) audit.issues.push(`title is short (${audit.titleLength} chars)`)
  if (!audit.description) audit.issues.push("missing meta description")
  else if (audit.descriptionLength > 160) audit.issues.push(`meta description is ${audit.descriptionLength} chars (over ~155)`)
  else if (audit.descriptionLength < 70) audit.issues.push(`meta description is short (${audit.descriptionLength} chars)`)
  if (h1.length === 0) audit.issues.push("no <h1>")
  if (h1.length > 1) audit.issues.push(`${h1.length} <h1> tags`)
  if (!audit.canonical) audit.issues.push("no canonical link")
  if (audit.robots && /noindex/i.test(audit.robots)) audit.issues.push("page is noindex")
  if (audit.imagesWithoutAlt) audit.issues.push(`${audit.imagesWithoutAlt} images without alt text`)
  if (audit.words < 300) audit.issues.push(`thin content (${audit.words} words)`)
  return audit
}
