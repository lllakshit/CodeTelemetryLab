import assert from "node:assert/strict"
import { test } from "node:test"
import { classifySignal, companyFromHeadline, isSignalHeadline, preScore, regionFromText } from "../../src/lib/lead-discovery/signals.ts"
import { companyFromHiringComment, parseHiringComments, parseLaunchHits } from "../../src/lib/lead-discovery/sources/hn.ts"
import { feedItemsToCandidates } from "../../src/lib/lead-discovery/sources/feeds.ts"
import { parseLooseDate, queriesForDay } from "../../src/lib/lead-discovery/sources/web-search.ts"
import type { Candidate } from "../../src/lib/lead-discovery/types.ts"

const now = new Date("2026-11-23T03:00:00Z")

test("headlines are classified by signal", () => {
  assert.equal(classifySignal("Acme raises $4M seed round"), "funding")
  assert.equal(classifySignal("Acme launches public API for logistics teams"), "launch")
  assert.equal(classifySignal("Acme partners with Stripe on payments integration"), "launch")
  assert.equal(classifySignal("Acme is hiring a founding engineer"), "hiring")
  assert.equal(isSignalHeadline("Acme sued by former employees"), false)
  assert.equal(isSignalHeadline("The week in review: 10 startups"), false)
})

test("the company name is read from the start of a headline, or not at all", () => {
  assert.equal(companyFromHeadline("Acme AI raises $4M seed to automate invoices"), "Acme AI")
  assert.equal(companyFromHeadline("Toronto's Ledgerly secures $2.5M pre-seed"), "Ledgerly")
  assert.equal(companyFromHeadline("Exclusive: Fleetbase lands $10M Series A"), "Fleetbase")
  assert.equal(companyFromHeadline("Why investors are cooling on AI"), null)
  assert.equal(companyFromHeadline("Startups raise record sums in Q3"), null)
})

test("regions are recognised from place names", () => {
  assert.equal(regionFromText("Dubai-based fintech"), "AE")
  assert.equal(regionFromText("Bengaluru startup"), "IN")
  assert.equal(regionFromText("based in Toronto"), "CA")
  assert.equal(regionFromText("London's newest"), "UK")
  assert.equal(regionFromText("Sydney SaaS"), "AU")
  assert.equal(regionFromText("somewhere"), "GLOBAL")
})

const base: Candidate = {
  source: "feed:x",
  signalKind: "funding",
  title: "Acme raises $3M seed for its B2B SaaS platform",
  summary: "",
  evidenceUrl: "https://techcrunch.com/a",
  signalDate: "2026-11-21T00:00:00Z",
  companyHint: "Acme",
  websiteUrl: null,
  region: "US",
  linkedUrls: [],
}

test("pre-score favours fresh small rounds over agencies and mega rounds", () => {
  const good = preScore(base, now)
  const agency = preScore({ ...base, title: "Acme, a software agency, raises $3M seed" }, now)
  const mega = preScore({ ...base, title: "Acme raises $400 million Series E" }, now)
  const old = preScore({ ...base, signalDate: "2026-10-01T00:00:00Z" }, now)
  assert.ok(good > agency && good > mega && good > old, `${good} ${agency} ${mega} ${old}`)
})

test("Launch HN posts become dated launch candidates with the HN post as evidence", () => {
  const hits = [
    { objectID: "111", title: "Launch HN: Pomerado (YC F26) – Turn any website into an MCP for agents", url: null, story_text: 'Hi HN, we built <a href="https://pomerado.com">Pomerado</a>. Founders: Jane Doe (CEO).', created_at: "2026-11-11T17:11:56Z" },
    { objectID: "112", title: "Launch HN: Onlook (YC W25) – Open-source tool", url: "https://github.com/onlook-dev/onlook/", story_text: "", created_at: "2026-11-19T16:34:04Z" },
    { objectID: "113", title: "Human-written Launch HN posts get more upvotes", url: "https://x.com/blog", created_at: "2026-11-18T08:04:19Z" },
    { objectID: "114", title: "Launch HN: Old Co (YC S24) – Something", url: "https://oldco.com", created_at: "2026-08-01T00:00:00Z" },
  ]
  const items = parseLaunchHits(hits, { now, maxAgeDays: 45, limit: 10 })
  assert.equal(items.length, 2)
  assert.equal(items[0].companyHint, "Pomerado")
  assert.equal(items[0].websiteUrl, "https://pomerado.com/")
  assert.equal(items[0].evidenceUrl, "https://news.ycombinator.com/item?id=111")
  assert.equal(items[0].signalDate, "2026-11-11T17:11:56Z")
  // A GitHub URL is not a company site, and there is no other matching link.
  assert.equal(items[1].websiteUrl, null)
})

test("Who-is-hiring comments become hiring candidates; non-engineering and old ones are skipped", () => {
  assert.equal(companyFromHiringComment("Simple Analytics | DevOps Engineer | REMOTE"), "Simple Analytics")
  assert.equal(companyFromHiringComment("We are hiring engineers"), null)
  const thread = {
    id: 1,
    children: [
      { id: 10, created_at: "2026-11-02T17:00:00Z", text: 'Simple Analytics | DevOps Engineer | REMOTE<p>Apply at <a href="https:&#x2F;&#x2F;www.simpleanalytics.com&#x2F;jobs">jobs</a>' },
      { id: 11, created_at: "2026-11-02T17:00:00Z", text: "Bakery Co | Pastry Chef | Paris" },
      { id: 12, created_at: "2026-08-02T17:00:00Z", text: "Oldco | Backend Engineer | Remote" },
    ],
  }
  const items = parseHiringComments(thread, { now, maxAgeDays: 45, limit: 10 })
  assert.equal(items.length, 1)
  assert.equal(items[0].signalKind, "hiring")
  assert.equal(items[0].websiteUrl, "https://simpleanalytics.com/")
  assert.equal(items[0].evidenceUrl, "https://news.ycombinator.com/item?id=10")
})

test("feed items need a date, a signal headline and a named company", () => {
  const xml = `<rss><channel>
    <item><title>Ledgerly raises $2M seed to automate bookkeeping</title><link>https://betakit.com/ledgerly</link><pubDate>Fri, 21 Nov 2026 10:00:00 GMT</pubDate></item>
    <item><title>Opinion: why Canada needs more VCs</title><link>https://betakit.com/op</link><pubDate>Fri, 21 Nov 2026 10:00:00 GMT</pubDate></item>
    <item><title>Oldco raises $1M</title><link>https://betakit.com/old</link><pubDate>Fri, 01 Aug 2026 10:00:00 GMT</pubDate></item>
    <item><title>Undated raises $1M</title><link>https://betakit.com/undated</link></item>
  </channel></rss>`
  const items = feedItemsToCandidates({ id: "betakit", label: "BetaKit", url: "https://betakit.com/feed/", region: "CA" }, xml, now, 45, 10)
  assert.equal(items.length, 1)
  assert.equal(items[0].companyHint, "Ledgerly")
  assert.equal(items[0].region, "CA")
  assert.equal(items[0].signalKind, "funding")
})

test("search helpers rotate queries and read relative dates", () => {
  assert.equal(queriesForDay(now).length, 4)
  assert.notDeepEqual(queriesForDay(now), queriesForDay(new Date(now.getTime() + 86_400_000)))
  assert.equal(parseLooseDate("3 days ago", now), "2026-11-20T03:00:00.000Z")
  assert.equal(parseLooseDate("garbage", now), null)
})

test("descriptors, possessives and -led prefixes are stripped; phrases and questions are refused", () => {
  assert.equal(companyFromHeadline("Saudi tech group iMENA secures $214 million to support regional growth"), "iMENA")
  assert.equal(companyFromHeadline("Verafin alum-led Verlo nabs $4.5 million to build AI operating system"), "Verlo")
  assert.equal(companyFromHeadline("Physical AI company Promise Robotics announces $40-million Series B round"), "Promise Robotics")
  assert.equal(companyFromHeadline("Sudan's Cashi secures $660,000 investment from France's Proparco"), "Cashi")
  assert.equal(companyFromHeadline("Can AI be secure? It depends on where it runs"), null)
  assert.equal(companyFromHeadline("Anthropic jumps 17% in Nasdaq debut and closes at a $1.75T valuation"), null)
  assert.equal(companyFromHeadline("Swish FY26: Revenue Surges Close To ₹50 Cr While Loss Widens"), null)
})
