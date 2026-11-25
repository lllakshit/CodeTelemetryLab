import { syncRange, windows } from "./dates.ts"
import { accessToken, GoogleError, googleClient, searchAnalytics } from "./google.ts"
import { claimSync, finishSync, getRefreshToken, latestDay, upsertDaily, upsertQueryPage } from "./store.ts"

/**
 * Pulls Search Console data into Supabase: daily totals, country and device per day, and query x page per day.
 * Newest window first, so a sync that runs out of time still has the freshest days. Re-syncing a day overwrites it
 * (Google revises the last few days), so running it twice is harmless.
 */
export type SyncResult =
  | { ok: true; summary: SyncSummary }
  | { ok: false; status: number; error: string; reconnect?: boolean; summary?: SyncSummary }

export type SyncSummary = {
  siteUrl: string
  from: string
  to: string
  days: number
  windowsDone: number
  windowsTotal: number
  dailyRows: number
  queryRows: number
  stoppedEarly: boolean
  ms: number
}

const WINDOW_DAYS = 30

export async function syncSearchConsole(input: { days: number; trigger: "manual" | "cron"; deadlineMs?: number }): Promise<SyncResult> {
  const started = Date.now()
  const deadline = started + (input.deadlineMs ?? 240_000)
  const client = googleClient()
  if (!client) return { ok: false, status: 503, error: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set." }
  const saved = await getRefreshToken()
  if (!saved.ok) return { ok: false, status: 409, error: saved.error }
  const siteUrl = saved.connection.siteUrl
  if (!siteUrl) return { ok: false, status: 409, error: "Choose a Search Console property first." }
  if (!(await claimSync())) return { ok: false, status: 409, error: "A sync is already running. Try again in a few minutes." }

  const range = syncRange(input.days)
  const parts = windows(range.from, range.to, WINDOW_DAYS)
  const summary: SyncSummary = {
    siteUrl,
    from: range.from,
    to: range.to,
    days: input.days,
    windowsDone: 0,
    windowsTotal: parts.length,
    dailyRows: 0,
    queryRows: 0,
    stoppedEarly: false,
    ms: 0,
  }
  try {
    for (const part of parts) {
      if (Date.now() > deadline - 30_000) {
        summary.stoppedEarly = true
        break
      }
      const token = await accessToken(client, saved.token)
      const [totals, countries, devices, queryPages] = await Promise.all([
        searchAnalytics(token, siteUrl, { startDate: part.from, endDate: part.to, dimensions: ["date"] }),
        searchAnalytics(token, siteUrl, { startDate: part.from, endDate: part.to, dimensions: ["date", "country"] }),
        searchAnalytics(token, siteUrl, { startDate: part.from, endDate: part.to, dimensions: ["date", "device"] }),
        searchAnalytics(token, siteUrl, { startDate: part.from, endDate: part.to, dimensions: ["date", "query", "page"] }),
      ])
      summary.dailyRows += await upsertDaily(siteUrl, "total", totals)
      summary.dailyRows += await upsertDaily(siteUrl, "country", countries)
      summary.dailyRows += await upsertDaily(siteUrl, "device", devices)
      summary.queryRows += await upsertQueryPage(siteUrl, queryPages)
      summary.windowsDone += 1
    }
    summary.ms = Date.now() - started
    const earliestDone = parts[summary.windowsDone - 1]?.from ?? null
    const prevFrom = saved.connection.dataFrom
    await finishSync({
      ok: true,
      summary: { ...summary, trigger: input.trigger },
      dataFrom: earliestDone && (!prevFrom || earliestDone < prevFrom) ? earliestDone : prevFrom,
      dataTo: (await latestDay(siteUrl)) ?? saved.connection.dataTo,
    })
    return { ok: true, summary }
  } catch (error) {
    summary.ms = Date.now() - started
    const message = error instanceof Error ? error.message : String(error)
    await finishSync({ ok: false, error: message, summary: { ...summary, trigger: input.trigger } }).catch(() => {})
    const reconnect = error instanceof GoogleError && error.reconnect
    return { ok: false, status: error instanceof GoogleError ? (error.status === 403 ? 403 : 502) : 500, error: message, reconnect, summary }
  }
}
