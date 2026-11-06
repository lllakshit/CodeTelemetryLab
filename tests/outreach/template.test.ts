import assert from "node:assert/strict"
import { test } from "node:test"
import { escapeHtml, parseBlocks, renderOutreachEmail } from "../../src/lib/outreach/template.ts"

const base = {
  subject: "Hello",
  body: "Hi Amy,\n\nOur materials:\n\n* Research Briefing: [Investor Deck](https://docs.google.com/presentation/d/abc/edit)\n* Portfolio: https://lakshit-mathur-portfolio.vercel.app.\n\nCould you point me to the right people?",
  signature: "Warm regards,\nLakshit Mathur\nFounder, CodeTelemetryLab",
  attachments: [],
  senderName: "Lakshit Mathur",
  senderEmail: "lakshit@codetelemetrylab.me",
  brandName: "CodeTelemetryLab",
  siteUrl: "https://www.codetelemetrylab.me",
  logoUrl: "https://www.codetelemetrylab.me/brand/ct-labs-mark-light.png",
}

test("paragraphs and bullet lists are recognised", () => {
  const blocks = parseBlocks("Intro line\nsecond line\n\n* one\n- two\n\nOutro")
  assert.deepEqual(blocks.map((b) => b.type), ["paragraph", "list", "paragraph"])
  const list = blocks[1]
  assert.ok(list.type === "list" && list.items.length === 2)
})

test("the email carries the logo, the sender name and the site links", () => {
  const { html } = renderOutreachEmail(base)
  assert.ok(html.includes(base.logoUrl))
  assert.ok(html.includes("Lakshit Mathur"))
  assert.ok(html.includes("mailto:lakshit@codetelemetrylab.me"))
  assert.ok(html.includes("www.codetelemetrylab.me"))
  assert.ok(html.includes("<ul"))
})

test("markdown links and bare addresses become links, trailing punctuation stays outside", () => {
  const { html } = renderOutreachEmail(base)
  assert.ok(html.includes('href="https://docs.google.com/presentation/d/abc/edit"'))
  assert.ok(html.includes(">Investor Deck</a>"))
  assert.ok(html.includes('href="https://lakshit-mathur-portfolio.vercel.app"'))
  assert.ok(html.includes("</a>.</li>"))
})

test("anything the writer types is escaped", () => {
  const { html } = renderOutreachEmail({
    ...base,
    body: '<script>alert(1)</script> & "quotes"',
    subject: "<b>x</b>",
    signature: "<img src=x onerror=1>",
  })
  assert.ok(!html.includes("<script>alert"))
  assert.ok(!html.includes("<img src=x"))
  assert.ok(html.includes("&lt;script&gt;"))
  assert.ok(html.includes("&amp;"))
})

test("unsafe link schemes are not turned into links", () => {
  const { html } = renderOutreachEmail({ ...base, body: "[click](javascript:alert(1)) and data:text/html,hi" })
  assert.ok(!html.includes('href="javascript:'))
})

test("attachments appear as cards with their label and note", () => {
  const { html, text } = renderOutreachEmail({
    ...base,
    attachments: [
      { name: "General Resume", url: "https://drive.google.com/file/d/1/view", label: "Google Drive" },
      { name: "Demo.mp4", url: "https://files.example.com/demo.mp4", label: "File", note: "Sent as a link because it is large (400 MB)" },
    ],
  })
  assert.ok(html.includes("Attachments"))
  assert.ok(html.includes("Google Drive"))
  assert.ok(html.includes("Sent as a link because it is large"))
  assert.ok(text.includes("General Resume (Google Drive): https://drive.google.com/file/d/1/view"))
})

test("the plain text version keeps the message readable", () => {
  const { text } = renderOutreachEmail(base)
  assert.ok(text.includes("Hi Amy,"))
  assert.ok(text.includes("- Research Briefing: Investor Deck (https://docs.google.com/presentation/d/abc/edit)"))
  assert.ok(text.includes("Warm regards,\nLakshit Mathur"))
  assert.ok(!text.includes("<"))
})

test("escapeHtml covers the five special characters", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;")
})

test("the brand footer can be left out", () => {
  const withFooter = renderOutreachEmail(base)
  const without = renderOutreachEmail({ ...base, showFooter: false })
  assert.match(withFooter.html, new RegExp(base.logoUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(without.html, new RegExp(base.logoUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(without.text, /--\nLakshit Mathur · CodeTelemetryLab/)
  assert.match(withFooter.text, /--\nLakshit Mathur · CodeTelemetryLab/)
  assert.match(without.html, /Hello/)
})
