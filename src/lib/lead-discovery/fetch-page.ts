/**
 * Server-side page fetching for discovery: public https only, every redirect hop re-checked, every host resolved
 * and refused if it points at a private address, short timeouts and a byte cap. Same rules as the Outreach link
 * check (src/lib/outreach/link-safety.ts).
 */
import { lookup } from "node:dns/promises"
import { isPrivateAddress, isPublicHttpsUrl } from "../outreach/link-safety.ts"

export const USER_AGENT = "Mozilla/5.0 (compatible; CodeTelemetryLabResearch/1.0; +https://www.codetelemetrylab.me)"

export type FetchedPage = { url: string; status: number; contentType: string; body: string }

async function hostIsPublic(hostname: string) {
  try {
    const addresses = await lookup(hostname, { all: true })
    return addresses.length > 0 && !addresses.some((entry) => isPrivateAddress(entry.address))
  } catch {
    return false
  }
}

async function readCapped(response: Response, maxBytes: number) {
  const reader = response.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < maxBytes) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.byteLength
  }
  await reader.cancel().catch(() => {})
  const all = new Uint8Array(Math.min(size, maxBytes))
  let offset = 0
  for (const chunk of chunks) {
    const room = all.length - offset
    if (room <= 0) break
    all.set(chunk.subarray(0, room), offset)
    offset += Math.min(chunk.byteLength, room)
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(all)
}

/**
 * Fetches a public page and returns its text body, or null on any failure (blocked host, timeout, non-2xx, wrong
 * content type). Never throws.
 */
export async function fetchPublicPage(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number; accept?: RegExp; signal?: AbortSignal } = {},
): Promise<FetchedPage | null> {
  const timeoutMs = options.timeoutMs ?? 8000
  const maxBytes = options.maxBytes ?? 600_000
  const accept = options.accept ?? /text\/html|application\/xhtml|xml|rss|atom|json|text\/plain/i
  const signals = [AbortSignal.timeout(timeoutMs), ...(options.signal ? [options.signal] : [])]
  const signal = AbortSignal.any(signals)
  let url = rawUrl
  try {
    for (let hop = 0; hop <= 4; hop += 1) {
      if (!isPublicHttpsUrl(url)) return null
      if (!(await hostIsPublic(new URL(url).hostname))) return null
      const response = await fetch(url, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "en",
        },
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        await response.body?.cancel().catch(() => {})
        if (!location) return null
        url = new URL(location, url).toString()
        continue
      }
      const contentType = response.headers.get("content-type") ?? ""
      if (!response.ok || !accept.test(contentType)) {
        await response.body?.cancel().catch(() => {})
        return null
      }
      return { url, status: response.status, contentType, body: await readCapped(response, maxBytes) }
    }
    return null
  } catch {
    return null
  }
}

export async function fetchPublicJson<T>(url: string, options: { timeoutMs?: number; maxBytes?: number; signal?: AbortSignal } = {}): Promise<T | null> {
  const page = await fetchPublicPage(url, { ...options, accept: /json/i, maxBytes: options.maxBytes ?? 4_000_000 })
  if (!page) return null
  try {
    return JSON.parse(page.body) as T
  } catch {
    return null
  }
}

/** Runs tasks with at most `limit` in flight; results keep input order. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await task(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}
