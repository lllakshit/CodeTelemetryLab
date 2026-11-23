import assert from "node:assert/strict"
import { test } from "node:test"
import { clip, extractEmails, extractLinks, htmlToText, metaContent, pickPublicEmail } from "../../src/lib/lead-discovery/html.ts"
import { parseFeed } from "../../src/lib/lead-discovery/rss.ts"

test("htmlToText drops scripts, styles and tags and decodes entities", () => {
  const html = `<html><head><title>x</title><style>.a{}</style></head><body><script>alert(1)</script><p>Hello&nbsp;&amp; welcome</p><div>Line&#x27;s two</div></body></html>`
  assert.equal(htmlToText(html), "Hello & welcome\nLine's two")
})

test("extractLinks returns absolute http(s) links once, without fragments or mailto", () => {
  const html = `<a href="/about">a</a><a href='https://x.com/#top'>b</a><a href="mailto:a@b.com">c</a><a href="/about#team">d</a><a href="javascript:void(0)">e</a>`
  assert.deepEqual(extractLinks(html, "https://acme.ai/"), ["https://acme.ai/about", "https://x.com/"])
})

test("metaContent reads description tags", () => {
  const html = `<meta name="description" content="We build &amp; ship"><meta property="og:site_name" content='Acme'>`
  assert.equal(metaContent(html, "description"), "We build & ship")
  assert.equal(metaContent(html, "og:site_name"), "Acme")
})

test("only business addresses on the company's own domain are kept, best role first", () => {
  const html = `<a href="mailto:privacy@acme.ai">p</a> hello@acme.ai jane@gmail.com logo@2x.png noreply@acme.ai sales@agency.com team@eu.acme.ai`
  const emails = extractEmails(html)
  assert.ok(emails.includes("hello@acme.ai"))
  assert.ok(!emails.some((email) => email.endsWith(".png")))
  assert.equal(pickPublicEmail(emails, "acme.ai"), "hello@acme.ai")
  assert.equal(pickPublicEmail(["jane@gmail.com", "noreply@acme.ai", "privacy@acme.ai"], "acme.ai"), null)
  assert.equal(pickPublicEmail(["team@eu.acme.ai"], "acme.ai"), "team@eu.acme.ai")
})

test("clip shortens on a word boundary", () => {
  assert.equal(clip("one two three four", 9), "one two…")
  assert.equal(clip("short", 10), "short")
})

test("parseFeed reads RSS 2.0 items with CDATA and content links", () => {
  const xml = `<?xml version="1.0"?><rss><channel>
    <item><title><![CDATA[Acme AI raises $4M seed to automate invoices]]></title><link>https://techcrunch.com/2026/11/20/acme/</link>
      <pubDate>Thu, 20 Nov 2026 14:00:00 +0000</pubDate><description><![CDATA[<p>Acme AI, a <a href="https://acme.ai">startup</a>, raised…</p>]]></description></item>
    <item><title>No link item</title></item>
  </channel></rss>`
  const items = parseFeed(xml)
  assert.equal(items.length, 1)
  assert.equal(items[0].title, "Acme AI raises $4M seed to automate invoices")
  assert.equal(items[0].link, "https://techcrunch.com/2026/11/20/acme/")
  assert.equal(items[0].publishedAt, "2026-11-20T14:00:00.000Z")
  assert.deepEqual(items[0].links, ["https://acme.ai/"])
})

test("parseFeed reads Atom entries", () => {
  const xml = `<feed><entry><title>Acme launches API</title><link rel="alternate" href="https://news.example.com/a"/><published>2026-11-19T10:00:00Z</published><summary>Hi</summary></entry></feed>`
  const items = parseFeed(xml)
  assert.equal(items[0].link, "https://news.example.com/a")
  assert.equal(items[0].publishedAt, "2026-11-19T10:00:00.000Z")
})

test("feed dates with zone abbreviations are read", async () => {
  const { toIso } = await import("../../src/lib/lead-discovery/rss.ts")
  assert.equal(toIso("Thu, 19 Nov 2026 17:11:15 EET"), "2026-11-19T15:11:15.000Z")
  assert.equal(toIso("Thu, 19 Nov 2026 17:11:15 +0000"), "2026-11-19T17:11:15.000Z")
  assert.equal(toIso("not a date"), null)
})

test("press, careers and billing mailboxes are not used as a sales contact", () => {
  assert.equal(pickPublicEmail(["press@acme.ai", "careers@acme.ai"], "acme.ai"), null)
  assert.equal(pickPublicEmail(["press@acme.ai", "support@acme.ai"], "acme.ai"), "support@acme.ai")
  assert.equal(pickPublicEmail(["prakash@acme.ai"], "acme.ai"), "prakash@acme.ai")
})
