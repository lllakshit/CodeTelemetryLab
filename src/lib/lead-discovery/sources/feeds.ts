/**
 * Startup-news RSS feeds covering our markets (no key needed). Each item is a dated article; the company's own
 * site is found later among the article's links, never guessed.
 */
import { fetchPublicPage } from "../fetch-page.ts"
import { parseFeed } from "../rss.ts"
import { ageInDays, classifySignal, companyFromHeadline, isSignalHeadline, regionFromText } from "../signals.ts"
import type { Candidate, DiscoverySource, Region } from "../types.ts"

export type FeedDefinition = { id: string; label: string; url: string; region: Region }

export const FEEDS: FeedDefinition[] = [
  { id: "techcrunch-fundraising", label: "TechCrunch · Fundraising", url: "https://techcrunch.com/category/fundraising/feed/", region: "US" },
  { id: "crunchbase-news", label: "Crunchbase News", url: "https://news.crunchbase.com/feed/", region: "GLOBAL" },
  { id: "techfundingnews", label: "Tech Funding News", url: "https://techfundingnews.com/feed/", region: "UK" },
  { id: "uktn", label: "UKTN", url: "https://www.uktech.news/feed", region: "UK" },
  { id: "betakit", label: "BetaKit (Canada)", url: "https://betakit.com/feed/", region: "CA" },
  { id: "inc42", label: "Inc42 (India)", url: "https://inc42.com/feed/", region: "IN" },
  { id: "wamda", label: "Wamda (UAE / MENA)", url: "https://www.wamda.com/feed", region: "AE" },
  { id: "startupsmart", label: "StartupSmart (Australia)", url: "https://www.smartcompany.com.au/startupsmart/feed/", region: "AU" },
]

export function feedItemsToCandidates(feed: FeedDefinition, xml: string, now: Date, maxAgeDays: number, limit: number): Candidate[] {
  const out: Candidate[] = []
  for (const item of parseFeed(xml)) {
    if (!item.publishedAt || ageInDays(item.publishedAt, now) > maxAgeDays) continue
    const headline = `${item.title}. ${item.summary}`
    if (!isSignalHeadline(item.title)) continue
    const company = companyFromHeadline(item.title)
    if (!company) continue
    out.push({
      source: `feed:${feed.id}`,
      signalKind: classifySignal(headline),
      title: item.title,
      summary: item.summary,
      evidenceUrl: item.link,
      signalDate: item.publishedAt,
      companyHint: company,
      websiteUrl: null,
      region: regionFromText(headline, feed.region),
      linkedUrls: item.links,
    })
    if (out.length >= limit) break
  }
  return out
}

export function feedSource(feed: FeedDefinition): DiscoverySource {
  return {
    id: `feed:${feed.id}`,
    label: feed.label,
    enabled: () => true,
    async discover(context) {
      const page = await fetchPublicPage(feed.url, { signal: context.signal, timeoutMs: 10000, maxBytes: 900_000, accept: /xml|rss|atom|text\/html/i })
      if (!page) throw new Error(`${feed.label} feed did not answer`)
      return feedItemsToCandidates(feed, page.body, context.now, context.maxAgeDays, context.limit)
    },
  }
}
