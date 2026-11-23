/**
 * Groq chat client (OpenAI-compatible endpoint) that returns parsed JSON. Honours rate limits (429 + retry-after)
 * within the caller's deadline and never throws: callers get { ok: false, error } instead.
 */
import { extractJsonObject } from "./qualify.ts"

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

export function groqConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}

export function groqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
}

export type GroqResult = { ok: true; json: unknown; tokens: number } | { ok: false; error: string; rateLimited?: boolean }

function waitMs(response: Response, attempt: number) {
  const header = response.headers.get("retry-after")
  const seconds = header ? Number(header) : NaN
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000 + 250, 65_000)
  const reset = response.headers.get("x-ratelimit-reset-tokens") ?? ""
  const match = /([\d.]+)s/.exec(reset)
  if (match) return Math.min(Number(match[1]) * 1000 + 250, 65_000)
  return Math.min(2000 * 2 ** attempt, 20_000)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function groqJson(input: { system: string; user: string; maxTokens: number; deadline: number; temperature?: number }): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) return { ok: false, error: "GROQ_API_KEY is not set" }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const remaining = input.deadline - Date.now()
    if (remaining < 8000) return { ok: false, error: "Out of time for this run", rateLimited: true }
    let response: Response
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: groqModel(),
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
        }),
        signal: AbortSignal.timeout(Math.min(45_000, remaining - 2000)),
      })
    } catch (error) {
      if (attempt < 3) continue
      return { ok: false, error: `Groq request failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    if (response.status === 429 || response.status >= 500) {
      const wait = waitMs(response, attempt)
      await response.body?.cancel().catch(() => {})
      if (Date.now() + wait > input.deadline - 8000) return { ok: false, error: `Groq rate limit (HTTP ${response.status})`, rateLimited: response.status === 429 }
      await sleep(wait)
      continue
    }
    const text = await response.text()
    if (!response.ok) {
      let message = text.slice(0, 300)
      try {
        message = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? message
      } catch {
        // keep raw text
      }
      return { ok: false, error: `Groq HTTP ${response.status}: ${message}` }
    }
    try {
      const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } }
      const content = data.choices?.[0]?.message?.content ?? ""
      const json = extractJsonObject(content)
      if (!json) return { ok: false, error: "Groq returned no JSON" }
      return { ok: true, json, tokens: data.usage?.total_tokens ?? 0 }
    } catch {
      return { ok: false, error: "Groq returned an unreadable reply" }
    }
  }
  return { ok: false, error: "Groq did not answer after retries", rateLimited: true }
}
