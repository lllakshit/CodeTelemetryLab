import assert from "node:assert/strict"
import { test } from "node:test"
import { aiKey, aiModels } from "../../src/lib/ai/groq-chat.ts"
import { auditHtml } from "../../src/lib/ai/seo-page.ts"

test("AI key: the dedicated key wins, both spellings work, Groq key is the fallback", () => {
  assert.deepEqual(aiKey({ GROQ_AI_LAYER_KEY: "k1", GROQ_API_KEY: "k2" }), { key: "k1", name: "GROQ_AI_LAYER_KEY" })
  assert.deepEqual(aiKey({ GROq_AI_LAYER_KEY: "k3" }), { key: "k3", name: "GROq_AI_LAYER_KEY" })
  assert.deepEqual(aiKey({ GROQ_API_KEY: " k2 " }), { key: "k2", name: "GROQ_API_KEY" })
  assert.equal(aiKey({}), null)
  assert.equal(aiModels({ GROQ_AI_MODEL: "x" })[0], "x")
  assert.equal(aiModels({})[0], "openai/gpt-oss-120b")
})

test("page audit finds on-page SEO issues", () => {
  const html = `<html><head><title>Hi</title><meta name="robots" content="noindex"><script type="application/ld+json">{"@type":"Organization"}</script></head>
  <body><h1>One</h1><h1>Two</h1><h2>Sub</h2><img src="a.png"><img src="b.png" alt="B">
  <a href="/about">About</a><a href="https://other.com">x</a><a href="mailto:a@b.c">m</a><p>short text</p></body></html>`
  const audit = auditHtml(html, "https://www.codetelemetrylab.me/x")
  assert.equal(audit.title, "Hi")
  assert.deepEqual(audit.h1, ["One", "Two"])
  assert.equal(audit.imagesWithoutAlt, 1)
  assert.equal(audit.internalLinks, 1)
  assert.equal(audit.externalLinks, 1)
  assert.deepEqual(audit.jsonLdTypes, ["Organization"])
  for (const issue of ["missing meta description", "2 <h1> tags", "no canonical link", "page is noindex", "1 images without alt text"]) {
    assert.ok(audit.issues.some((i) => i.includes(issue)), `expected issue: ${issue}`)
  }
  assert.ok(audit.issues.some((i) => i.startsWith("title is short")))
})
