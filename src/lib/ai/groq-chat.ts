/**
 * Groq chat completions with tool calling (OpenAI-compatible API) for the admin AI assistant.
 * Key: GROQ_AI_LAYER_KEY (also read as GROq_AI_LAYER_KEY, the spelling first given), else GROQ_API_KEY.
 * Model: GROQ_AI_MODEL, else the first of a fallback list the key may use. Never throws.
 */

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

export function aiKey(env: Record<string, string | undefined> = process.env): { key: string; name: string } | null {
  for (const name of ["GROQ_AI_LAYER_KEY", "GROq_AI_LAYER_KEY", "GROQ_API_KEY"]) {
    const key = env[name]?.trim()
    if (key) return { key, name }
  }
  return null
}

export function aiModels(env: Record<string, string | undefined> = process.env): string[] {
  return [...new Set([env.GROQ_AI_MODEL?.trim(), "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b"].filter(Boolean) as string[])]
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string }

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } }
export type ToolSpec = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }

export type ChatResult =
  | { ok: true; message: { content: string | null; tool_calls?: ToolCall[] }; model: string; tokens: number }
  | { ok: false; error: string; status: number }

let workingModel: string | null = null
const unavailable = new Set<string>()

export function currentAiModel() {
  return workingModel ?? aiModels().find((model) => !unavailable.has(model)) ?? aiModels()[0]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function retryWait(response: Response, attempt: number) {
  const seconds = Number(response.headers.get("retry-after"))
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000 + 300, 30_000)
  const match = /([\d.]+)s/.exec(response.headers.get("x-ratelimit-reset-tokens") ?? "")
  if (match) return Math.min(Number(match[1]) * 1000 + 300, 30_000)
  return Math.min(1500 * 2 ** attempt, 12_000)
}

function isModelAccess(status: number, message: string) {
  return (status === 404 || status === 400 || status === 403) && /model/i.test(message) && /(does not exist|not found|access|decommissioned|not available|restricted)/i.test(message)
}

export async function chat(input: {
  messages: ChatMessage[]
  tools?: ToolSpec[]
  maxTokens?: number
  temperature?: number
  deadline: number
}): Promise<ChatResult> {
  const key = aiKey()
  if (!key) return { ok: false, status: 503, error: "No Groq key: set GROQ_AI_LAYER_KEY in Vercel." }
  const models = workingModel ? [workingModel] : aiModels().filter((model) => !unavailable.has(model))
  const errors: string[] = []
  for (const model of models) {
    const result = await callModel(model, key.key, input)
    if (result.ok) {
      workingModel = model
      return result
    }
    if (!("modelAccess" in result)) return result
    unavailable.add(model)
    if (workingModel === model) workingModel = null
    errors.push(`${model}: ${result.error}`)
  }
  return { ok: false, status: 502, error: `No Groq model this key can use. ${errors.join(" | ")}`.slice(0, 800) }
}

async function callModel(
  model: string,
  key: string,
  input: { messages: ChatMessage[]; tools?: ToolSpec[]; maxTokens?: number; temperature?: number; deadline: number },
): Promise<ChatResult | { ok: false; error: string; status: number; modelAccess: true }> {
  const reasoning = model.startsWith("openai/gpt-oss")
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const remaining = input.deadline - Date.now()
    if (remaining < 5000) return { ok: false, status: 504, error: "The AI ran out of time (Groq rate limit). Try again in a minute." }
    let response: Response
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: input.temperature ?? 0.2,
          max_tokens: (input.maxTokens ?? 1400) * (reasoning ? 2 : 1),
          ...(reasoning ? { reasoning_effort: "low" } : {}),
          messages: input.messages,
          ...(input.tools?.length ? { tools: input.tools, tool_choice: "auto", parallel_tool_calls: true } : {}),
        }),
        signal: AbortSignal.timeout(Math.min(60_000, remaining - 1000)),
      })
    } catch (error) {
      if (attempt < 2) continue
      return { ok: false, status: 502, error: `Groq request failed: ${error instanceof Error ? error.message : String(error)}` }
    }
    if (response.status === 429 || response.status >= 500) {
      const wait = retryWait(response, attempt)
      const text = await response.text().catch(() => "")
      if (response.status === 429 && /per day|TPD|RPD/i.test(text)) return { ok: false, status: 429, error: "The Groq key has used its daily limit. It resets within 24 hours (or upgrade the Groq plan)." }
      if (Date.now() + wait > input.deadline - 5000) return { ok: false, status: 429, error: "Groq is rate limiting this key. Wait a minute and ask again." }
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
      if (isModelAccess(response.status, message)) return { ok: false, status: response.status, error: message, modelAccess: true }
      // A malformed tool call from the model: retry once without changing anything (it is not deterministic).
      if (response.status === 400 && /tool|function/i.test(message) && attempt < 1) continue
      return { ok: false, status: response.status === 401 ? 503 : 502, error: `Groq HTTP ${response.status}: ${message}` }
    }
    try {
      const data = JSON.parse(text) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[]; usage?: { total_tokens?: number } }
      const message = data.choices?.[0]?.message
      if (!message) return { ok: false, status: 502, error: "Groq returned no answer" }
      return { ok: true, message: { content: message.content ?? null, tool_calls: message.tool_calls?.length ? message.tool_calls : undefined }, model, tokens: data.usage?.total_tokens ?? 0 }
    } catch {
      return { ok: false, status: 502, error: "Groq returned an unreadable reply" }
    }
  }
  return { ok: false, status: 429, error: "Groq did not answer after retries. Try again in a minute." }
}
