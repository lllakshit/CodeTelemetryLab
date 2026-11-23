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

/**
 * Models tried in order. A Groq key can be limited to some models, so a model the key may not use ("does not exist
 * or you do not have access") is skipped and the next one is tried; the first that answers is kept for the process.
 */
export function groqModels(): string[] {
  const preferred = process.env.GROQ_MODEL?.trim()
  return [...new Set([preferred, DEFAULT_GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"].filter(Boolean) as string[])]
}

let workingModel: string | null = null
const unavailable = new Set<string>()

/** The model in use (the first one that worked in this process, else the first to try). */
export function groqModel() {
  return workingModel ?? groqModels().find((model) => !unavailable.has(model)) ?? DEFAULT_GROQ_MODEL
}

function isModelAccessError(status: number, message: string) {
  return (status === 404 || status === 400 || status === 403) && /model/i.test(message) && /(does not exist|not found|access|decommissioned|not available|restricted)/i.test(message)
}

/**
 * rateLimited: try this candidate another day. fatal: the key or model is wrong, so every call will fail; stop the
 * run instead of marking candidates as rejected.
 */
export type GroqResult = { ok: true; json: unknown; tokens: number } | { ok: false; error: string; rateLimited?: boolean; fatal?: boolean }

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

type GroqInput = { system: string; user: string; maxTokens: number; deadline: number; temperature?: number }

export async function groqJson(input: GroqInput): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) return { ok: false, error: "GROQ_API_KEY is not set", fatal: true }
  const errors: string[] = []
  for (const model of workingModel ? [workingModel] : groqModels().filter((item) => !unavailable.has(item))) {
    const result = await callModel(model, key, input)
    if (result.ok) {
      workingModel = model
      return result
    }
    if (!("modelAccess" in result) || !result.modelAccess) return result
    unavailable.add(model)
    if (workingModel === model) workingModel = null
    errors.push(`${model}: ${result.error}`)
  }
  return { ok: false, error: `No Groq model this key can use. ${errors.join(" | ")}`.slice(0, 900), fatal: true }
}

async function callModel(model: string, key: string, input: GroqInput): Promise<GroqResult | { ok: false; error: string; modelAccess: true }> {
  // gpt-oss models reason before answering; reasoning counts against max_tokens, so keep it short and allow more room.
  const reasoning = model.startsWith("openai/gpt-oss")
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const remaining = input.deadline - Date.now()
    if (remaining < 8000) return { ok: false, error: "Out of time for this run", rateLimited: true }
    let response: Response
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: input.temperature ?? 0.2,
          max_tokens: reasoning ? input.maxTokens * 3 : input.maxTokens,
          ...(reasoning ? { reasoning_effort: "low" } : {}),
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
      return { ok: false, rateLimited: true, error: `Groq request failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    if (response.status === 429 || response.status >= 500) {
      const wait = waitMs(response, attempt)
      await response.body?.cancel().catch(() => {})
      if (Date.now() + wait > input.deadline - 8000) return { ok: false, error: `Groq busy (HTTP ${response.status})`, rateLimited: true }
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
      if (isModelAccessError(response.status, message)) return { ok: false, error: `HTTP ${response.status}: ${message}`, modelAccess: true }
      const fatal = response.status === 401 || response.status === 403 || response.status === 404 || (response.status === 400 && /model/i.test(message) && !/json/i.test(message))
      return { ok: false, error: `Groq HTTP ${response.status}: ${message}`, fatal }
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
