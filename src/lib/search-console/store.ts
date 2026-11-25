import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"
import { decryptToken, encryptToken, tokenKey } from "./crypto.ts"
import type { GscRow } from "./google.ts"

/** Supabase persistence for the Search Console connection and synced rows. Server only (service role). */

export type GscConnection = {
  googleEmail: string | null
  siteUrl: string | null
  scope: string
  connectedAt: string
  syncStartedAt: string | null
  lastSyncAt: string | null
  lastSyncStatus: "ok" | "error" | null
  lastSyncError: string | null
  lastSyncSummary: Record<string, unknown>
  dataFrom: string | null
  dataTo: string | null
}

type ConnectionRow = {
  google_email: string | null
  refresh_token_enc: string
  scope: string
  site_url: string | null
  connected_at: string
  sync_started_at: string | null
  last_sync_at: string | null
  last_sync_status: "ok" | "error" | null
  last_sync_error: string | null
  last_sync_summary: Record<string, unknown> | null
  data_from: string | null
  data_to: string | null
}

export function storageReady() {
  return getSupabaseConfig().isConfigured
}

function db() {
  return createSupabaseAdminClient()
}

function toConnection(row: ConnectionRow): GscConnection {
  return {
    googleEmail: row.google_email,
    siteUrl: row.site_url,
    scope: row.scope,
    connectedAt: row.connected_at,
    syncStartedAt: row.sync_started_at,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    lastSyncError: row.last_sync_error,
    lastSyncSummary: row.last_sync_summary ?? {},
    dataFrom: row.data_from,
    dataTo: row.data_to,
  }
}

async function readRow(): Promise<ConnectionRow | null> {
  const { data, error } = await db().from("gsc_connection").select("*").eq("id", 1).maybeSingle()
  if (error) throw new Error(`Search Console storage: ${error.message}`)
  return (data as ConnectionRow | null) ?? null
}

export async function getConnection(): Promise<GscConnection | null> {
  const row = await readRow()
  return row ? toConnection(row) : null
}

/** The decrypted refresh token, or a reason it cannot be used. */
export async function getRefreshToken(): Promise<{ ok: true; token: string; connection: GscConnection } | { ok: false; error: string }> {
  const row = await readRow()
  if (!row) return { ok: false, error: "Search Console is not connected." }
  const key = tokenKey()
  if (!key) return { ok: false, error: "SEARCH_CONSOLE_TOKEN_KEY (or NEXTAUTH_SECRET) is not set." }
  const token = decryptToken(row.refresh_token_enc, key)
  if (!token) return { ok: false, error: "The saved Google token cannot be read (the encryption key changed). Reconnect Search Console." }
  return { ok: true, token, connection: toConnection(row) }
}

export async function saveConnection(input: { refreshToken: string; email: string | null; scope: string }) {
  const key = tokenKey()
  if (!key) throw new Error("SEARCH_CONSOLE_TOKEN_KEY (or NEXTAUTH_SECRET) is not set.")
  const existing = await readRow()
  const { error } = await db()
    .from("gsc_connection")
    .upsert({
      id: 1,
      google_email: input.email,
      refresh_token_enc: encryptToken(input.refreshToken, key),
      scope: input.scope,
      // Keep the chosen property when the same account reconnects.
      site_url: existing && existing.google_email === input.email ? existing.site_url : null,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_sync_error: null,
      sync_started_at: null,
    })
  if (error) throw new Error(`Could not save the Search Console connection: ${error.message}`)
}

export async function setSite(siteUrl: string) {
  const { error } = await db().from("gsc_connection").update({ site_url: siteUrl, updated_at: new Date().toISOString(), data_from: null, data_to: null }).eq("id", 1)
  if (error) throw new Error(error.message)
}

/** Removes the connection. Synced rows stay (they are the site's own data) unless purge is set. */
export async function deleteConnection(purge: boolean) {
  const client = db()
  const { error } = await client.from("gsc_connection").delete().eq("id", 1)
  if (error) throw new Error(error.message)
  if (purge) {
    await client.from("gsc_query_page").delete().neq("site_url", "")
    await client.from("gsc_daily").delete().neq("site_url", "")
  }
}

/** Claims the sync slot (one at a time; a slot older than 10 minutes is treated as abandoned). */
export async function claimSync(): Promise<boolean> {
  const stale = new Date(Date.now() - 10 * 60_000).toISOString()
  const { data, error } = await db()
    .from("gsc_connection")
    .update({ sync_started_at: new Date().toISOString() })
    .eq("id", 1)
    .or(`sync_started_at.is.null,sync_started_at.lt.${stale}`)
    .select("id")
  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

export async function finishSync(input: { ok: boolean; error?: string; summary: Record<string, unknown>; dataFrom?: string | null; dataTo?: string | null }) {
  const patch: Record<string, unknown> = {
    sync_started_at: null,
    last_sync_at: new Date().toISOString(),
    last_sync_status: input.ok ? "ok" : "error",
    last_sync_error: input.ok ? null : (input.error ?? "Sync failed").slice(0, 1000),
    last_sync_summary: input.summary,
  }
  if (input.dataFrom !== undefined) patch.data_from = input.dataFrom
  if (input.dataTo !== undefined) patch.data_to = input.dataTo
  await db().from("gsc_connection").update(patch).eq("id", 1)
}

const BATCH = 1000

function metrics(row: GscRow) {
  return { clicks: Math.round(row.clicks), impressions: Math.round(row.impressions), ctr: row.ctr, position: row.position }
}

export async function upsertDaily(siteUrl: string, kind: "total" | "country" | "device", rows: GscRow[]) {
  const records = rows.map((row) => ({
    site_url: siteUrl,
    date: row.keys?.[0] ?? "",
    kind,
    key: kind === "total" ? "" : (row.keys?.[1] ?? "").toLowerCase(),
    ...metrics(row),
  }))
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await db().from("gsc_daily").upsert(records.slice(i, i + BATCH), { onConflict: "site_url,date,kind,key" })
    if (error) throw new Error(`Saving daily rows: ${error.message}`)
  }
  return records.length
}

export async function upsertQueryPage(siteUrl: string, rows: GscRow[]) {
  const records = rows
    .filter((row) => row.keys?.length === 3 && row.keys[1])
    .map((row) => ({ site_url: siteUrl, date: row.keys![0], query: row.keys![1].slice(0, 500), page: row.keys![2].slice(0, 1000), ...metrics(row) }))
  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await db().from("gsc_query_page").upsert(records.slice(i, i + BATCH), { onConflict: "site_url,date,query,page" })
    if (error) throw new Error(`Saving query rows: ${error.message}`)
  }
  return records.length
}

// ---- Reports (read from the synced tables) ----

export type Metric = { clicks: number; impressions: number; ctr: number; position: number }
export type DailyPoint = Metric & { date: string }
export type ReportRow = Metric & { query: string | null; page: string | null }
export type BreakdownRow = Metric & { key: string }

export async function latestDay(siteUrl: string): Promise<string | null> {
  const { data } = await db().from("gsc_daily").select("date").eq("site_url", siteUrl).eq("kind", "total").order("date", { ascending: false }).limit(1)
  return (data?.[0] as { date: string } | undefined)?.date ?? null
}

export async function dailyTotals(siteUrl: string, from: string, to: string): Promise<DailyPoint[]> {
  const { data, error } = await db()
    .from("gsc_daily")
    .select("date, clicks, impressions, ctr, position")
    .eq("site_url", siteUrl)
    .eq("kind", "total")
    .gte("date", from)
    .lte("date", to)
    .order("date")
    .limit(600)
  if (error) throw new Error(error.message)
  return (data ?? []) as DailyPoint[]
}

export function sumMetrics(points: Metric[]): Metric {
  const clicks = points.reduce((sum, p) => sum + p.clicks, 0)
  const impressions = points.reduce((sum, p) => sum + p.impressions, 0)
  const weighted = points.reduce((sum, p) => sum + p.position * p.impressions, 0)
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weighted / impressions : 0 }
}

type RpcRow = { query: string | null; page: string | null; key?: string; clicks: number; impressions: number; ctr: number; avg_position: number }

export async function report(input: {
  siteUrl: string
  from: string
  to: string
  group: "query" | "page" | "query_page"
  limit?: number
  order?: "clicks" | "impressions"
  page?: string | null
  query?: string | null
  minImpressions?: number
}): Promise<ReportRow[]> {
  const { data, error } = await db().rpc("gsc_report", {
    p_site: input.siteUrl,
    p_from: input.from,
    p_to: input.to,
    p_group: input.group,
    p_limit: input.limit ?? 50,
    p_order: input.order ?? "clicks",
    p_page: input.page ?? null,
    p_query: input.query ?? null,
    p_min_impressions: input.minImpressions ?? 0,
  })
  if (error) throw new Error(error.message)
  return ((data ?? []) as RpcRow[]).map((row) => ({
    query: row.query,
    page: row.page,
    clicks: Number(row.clicks),
    impressions: Number(row.impressions),
    ctr: Number(row.ctr),
    position: Number(row.avg_position),
  }))
}

export async function breakdown(siteUrl: string, from: string, to: string, kind: "country" | "device", limit = 15): Promise<BreakdownRow[]> {
  const { data, error } = await db().rpc("gsc_breakdown", { p_site: siteUrl, p_from: from, p_to: to, p_kind: kind, p_limit: limit })
  if (error) throw new Error(error.message)
  return ((data ?? []) as RpcRow[]).map((row) => ({
    key: row.key ?? "",
    clicks: Number(row.clicks),
    impressions: Number(row.impressions),
    ctr: Number(row.ctr),
    position: Number(row.avg_position),
  }))
}
