/**
 * Optional web-search sources. Each turns on only when its key is set (TAVILY_API_KEY or SERPER_API_KEY), so the
 * pipeline runs on the free feeds alone and gets broader coverage when a key is added.
 */
import { ageInDays, classifySignal, companyFromHeadline, isSignalHeadline, regionFromText } from "../signals.ts"
import type { Candidate, DiscoverySource, SourceContext } from "../types.ts"

/** Targeted queries for our buying signals. A different subset runs each day so coverage rotates. */
export const SEARCH_QUERIES = [
  "B2B SaaS startup raises seed round",
  "startup raises Series A to expand platform API",
  "AI startup raises pre-seed funding",
  "startup launches API integration platform",
  "SaaS company launches new integrations partnership",
  "startup hiring founding engineer AI",
  "fintech startup raises seed round India",
  "Dubai startup raises funding platform",
  "Australian SaaS startup raises funding",
  "Canadian startup raises seed round software",
  "UK startup raises seed funding software platform",
  "startup automates manual workflow raises funding",
]

export function queriesForDay(now: Date, count = 4): string[] {
  const day = Math.floor(now.getTime() / 86_400_000)
  return Array.from({ length: count }, (_, index) => SEARCH_QUERIES[(day * count + index) % SEARCH_QUERIES.length])
}

/** Serper gives dates like "3 days ago" or "Nov 12, 2026". */
export function parseLooseDate(value: string | null | undefined, now: Date): string | null {
  if (!value) return null
  const relative = /(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i.exec(value)
  if (relative) {
    const unit = { minute: 60_000, hour: 3_600_000, day: 86_400_000, week: 604_800_000, month: 2_592_000_000 }[relative[2].toLowerCase() as "day"]
    return new Date(now.getTime() - Number(relative[1]) * unit).toISOString()
  }
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toISOString() : null
}

function toCandidate(source: string, item: { title: string; url: string; snippet: string; date: string | null }, context: SourceContext): Candidate | null {
  if (!item.date || ageInDays(item.date, context.now) > context.maxAgeDays) return null
  if (!/^https:\/\//i.test(item.url) || !isSignalHeadline(item.title)) return null
  const company = companyFromHeadline(item.title)
  if (!company) return null
  const text = `${item.title}. ${item.snippet}`
  return {
    source,
    signalKind: classifySignal(text),
    title: item.title,
    summary: item.snippet.slice(0, 600),
    evidenceUrl: item.url,
    signalDate: item.date,
    companyHint: company,
    websiteUrl: null,
    region: regionFromText(text),
    linkedUrls: [],
  }
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as unknown
}

export const tavilySource: DiscoverySource = {
  id: "tavily",
  label: "Tavily web search",
  enabled: () => Boolean(process.env.TAVILY_API_KEY?.trim()),
  async discover(context) {
    const key = process.env.TAVILY_API_KEY!.trim()
    const out: Candidate[] = []
    for (const query of queriesForDay(context.now)) {
      const data = (await postJson(
        "https://api.tavily.com/search",
        { Authorization: `Bearer ${key}` },
        { query, topic: "news", days: context.maxAgeDays, max_results: 8, include_answer: false },
        context.signal,
      )) as { results?: { title?: string; url?: string; content?: string; published_date?: string }[] }
      for (const result of data.results ?? []) {
        const candidate = toCandidate("tavily", {
          title: result.title ?? "",
          url: result.url ?? "",
          snippet: result.content ?? "",
          date: parseLooseDate(result.published_date, context.now),
        }, context)
        if (candidate) out.push(candidate)
      }
    }
    return out.slice(0, context.limit)
  },
}

export const serperSource: DiscoverySource = {
  id: "serper",
  label: "Serper news search",
  enabled: () => Boolean(process.env.SERPER_API_KEY?.trim()),
  async discover(context) {
    const key = process.env.SERPER_API_KEY!.trim()
    const out: Candidate[] = []
    for (const query of queriesForDay(context.now)) {
      const data = (await postJson("https://google.serper.dev/news", { "X-API-KEY": key }, { q: query, tbs: "qdr:m", num: 10 }, context.signal)) as {
        news?: { title?: string; link?: string; snippet?: string; date?: string }[]
      }
      for (const result of data.news ?? []) {
        const candidate = toCandidate("serper", {
          title: result.title ?? "",
          url: result.link ?? "",
          snippet: result.snippet ?? "",
          date: parseLooseDate(result.date, context.now),
        }, context)
        if (candidate) out.push(candidate)
      }
    }
    return out.slice(0, context.limit)
  },
}
