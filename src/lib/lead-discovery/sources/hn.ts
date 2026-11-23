/**
 * Hacker News sources (public Algolia API, no key):
 * - "Launch HN" posts: startups (mostly YC) announcing a product, dated by the post.
 * - Monthly "Who is hiring?" thread: companies hiring engineers, one dated comment each.
 */
import { isExcludedDomain } from "../domain.ts"
import { decodeEntities, extractLinks, htmlToText } from "../html.ts"
import { fetchPublicJson } from "../fetch-page.ts"
import { classifySignal, regionFromText } from "../signals.ts"
import type { Candidate, DiscoverySource, SourceContext } from "../types.ts"
import { pickCompanyWebsite } from "../website.ts"

const API = "https://hn.algolia.com/api/v1"
const itemUrl = (id: string | number) => `https://news.ycombinator.com/item?id=${id}`

type AlgoliaHit = { objectID: string; title?: string | null; url?: string | null; story_text?: string | null; created_at?: string; created_at_i?: number }
type AlgoliaItem = { id: number; created_at?: string; text?: string | null; title?: string | null; children?: AlgoliaItem[] }

export function parseLaunchHits(hits: AlgoliaHit[], context: Pick<SourceContext, "now" | "maxAgeDays" | "limit">): Candidate[] {
  const since = context.now.getTime() - context.maxAgeDays * 86_400_000
  const out: Candidate[] = []
  for (const hit of hits) {
    const title = decodeEntities(hit.title ?? "").trim()
    const match = /^Launch HN:\s*(.+?)\s*(?:\((?:YC\s*)?[A-Z]\d{2}\))?\s*[–—-]\s*(.+)$/i.exec(title)
    if (!match || !hit.created_at || Date.parse(hit.created_at) < since) continue
    const company = match[1].replace(/\s*\((?:YC\s*)?[A-Z]\d{2}\)\s*$/i, "").trim()
    const storyHtml = hit.story_text ?? ""
    const postUrl = hit.url && /^https?:\/\//i.test(hit.url) ? hit.url : null
    const links = [...(postUrl ? [postUrl] : []), ...extractLinks(storyHtml, "https://news.ycombinator.com/")]
    const text = htmlToText(storyHtml)
    out.push({
      source: "hn-launch",
      signalKind: "launch",
      title,
      summary: `${match[2].trim()}. ${text}`.slice(0, 600),
      evidenceUrl: itemUrl(hit.objectID),
      signalDate: hit.created_at,
      companyHint: company || null,
      websiteUrl: postUrl && !isExcludedDomain(postUrl) ? postUrl : pickCompanyWebsite(links, company || null, itemUrl(hit.objectID)),
      region: regionFromText(text, "US"),
      linkedUrls: links,
      text: `${title}\n${text}`.slice(0, 6000),
    })
    if (out.length >= context.limit) break
  }
  return out
}

const ENGINEERING = /\b(engineer|developer|full[- ]?stack|backend|back-end|frontend|front-end|ml|machine learning|ai|llm|data engineer|platform|devops|sre|mobile|ios|android|software)\b/i

/** "Acme | Senior Engineer | Remote | ..." -> "Acme". Only the first pipe-separated part, and only if short. */
export function companyFromHiringComment(text: string): string | null {
  const first = text.split(/\n/)[0] ?? ""
  if (!first.includes("|")) return null
  const name = first.split("|")[0].replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim()
  if (name.length < 2 || name.length > 60 || name.split(" ").length > 6) return null
  if (/^(hiring|remote|onsite|full[- ]time|we|i|our)\b/i.test(name)) return null
  return name
}

export function parseHiringComments(thread: AlgoliaItem, context: Pick<SourceContext, "now" | "maxAgeDays" | "limit">): Candidate[] {
  const since = context.now.getTime() - context.maxAgeDays * 86_400_000
  const out: Candidate[] = []
  for (const comment of thread.children ?? []) {
    if (!comment.text || !comment.created_at || Date.parse(comment.created_at) < since) continue
    const text = htmlToText(comment.text)
    const company = companyFromHiringComment(text)
    if (!company || !ENGINEERING.test(text)) continue
    const links = extractLinks(comment.text, "https://news.ycombinator.com/")
    // Only a link whose domain matches the company name counts (a job-board or blog link is not the company site).
    const website = pickCompanyWebsite(links, company, itemUrl(comment.id))
    out.push({
      source: "hn-hiring",
      signalKind: classifySignal(text, "hiring") === "funding" ? "funding" : "hiring",
      title: text.split("\n")[0].slice(0, 200),
      summary: text.slice(0, 600),
      evidenceUrl: itemUrl(comment.id),
      signalDate: comment.created_at,
      companyHint: company,
      websiteUrl: website,
      region: regionFromText(text),
      linkedUrls: links,
      text: text.slice(0, 6000),
    })
  }
  return out.slice(0, context.limit * 4)
}

export const hnLaunchSource: DiscoverySource = {
  id: "hn-launch",
  label: "Hacker News · Launch HN",
  enabled: () => true,
  async discover(context) {
    const since = Math.floor((context.now.getTime() - context.maxAgeDays * 86_400_000) / 1000)
    const url = `${API}/search_by_date?query=${encodeURIComponent('"Launch HN"')}&tags=story&numericFilters=${encodeURIComponent(`created_at_i>${since}`)}&hitsPerPage=60`
    const data = await fetchPublicJson<{ hits?: AlgoliaHit[] }>(url, { signal: context.signal })
    if (!data?.hits) throw new Error("Hacker News search did not answer")
    return parseLaunchHits(data.hits, context)
  },
}

export const hnHiringSource: DiscoverySource = {
  id: "hn-hiring",
  label: "Hacker News · Who is hiring",
  enabled: () => true,
  async discover(context) {
    const list = await fetchPublicJson<{ hits?: AlgoliaHit[] }>(`${API}/search_by_date?tags=story,author_whoishiring&hitsPerPage=6`, { signal: context.signal })
    const thread = list?.hits?.find((hit) => /who is hiring/i.test(hit.title ?? ""))
    if (!thread) throw new Error("No Who is hiring thread found")
    const item = await fetchPublicJson<AlgoliaItem>(`${API}/items/${thread.objectID}`, { signal: context.signal, timeoutMs: 15000, maxBytes: 8_000_000 })
    if (!item) throw new Error("Could not read the Who is hiring thread")
    return parseHiringComments(item, context)
  },
}
