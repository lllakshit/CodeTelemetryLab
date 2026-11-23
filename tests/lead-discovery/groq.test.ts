import assert from "node:assert/strict"
import { test } from "node:test"
import { groqJson, groqModel } from "../../src/lib/lead-discovery/groq.ts"

test("a model the key may not use is skipped and the next one is kept", async () => {
  process.env.GROQ_API_KEY = "test-key"
  delete process.env.GROQ_MODEL
  const seen: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as { model: string; reasoning_effort?: string }
    seen.push(body.model)
    if (body.model === "llama-3.3-70b-versatile") {
      return new Response(JSON.stringify({ error: { message: "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it." } }), { status: 404 })
    }
    assert.equal(body.reasoning_effort, "low")
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }], usage: { total_tokens: 10 } }), { status: 200 })
  }) as typeof fetch
  try {
    const first = await groqJson({ system: "s", user: "u", maxTokens: 100, deadline: Date.now() + 60_000 })
    assert.ok(first.ok)
    assert.deepEqual(seen, ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"])
    assert.equal(groqModel(), "openai/gpt-oss-120b")
    await groqJson({ system: "s", user: "u", maxTokens: 100, deadline: Date.now() + 60_000 })
    assert.deepEqual(seen.slice(2), ["openai/gpt-oss-120b"])
  } finally {
    globalThis.fetch = original
  }
})
