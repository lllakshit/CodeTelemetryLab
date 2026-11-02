import { createHash } from "node:crypto"
import { z } from "zod"
import { getClientIp } from "@/lib/rate-limit"
import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"
import { parseUserAgent } from "@/lib/user-agent"

const eventTypes = ["pageview", "click", "outbound", "form_start", "form_submit", "scroll", "exit"] as const
export type JourneyEventType = (typeof eventTypes)[number]

const shortText = (max: number) => z.string().max(max)

const eventSchema = z.object({
  type: z.enum(eventTypes),
  at: z.number().int().optional(),
  path: shortText(500),
  title: shortText(200).optional(),
  target: shortText(200).optional(),
  href: shortText(500).optional(),
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
  scrollDepth: z.number().int().min(0).max(100).optional(),
  meta: z.record(z.string(), z.union([shortText(300), z.number(), z.boolean()])).optional(),
})

export const trackPayloadSchema = z.object({
  sessionKey: z.string().uuid(),
  visitorId: z.string().uuid(),
  landingUrl: shortText(800).optional(),
  referrer: shortText(800).optional(),
  isReturning: z.boolean().optional(),
  utm: z
    .object({
      source: shortText(120).optional(),
      medium: shortText(120).optional(),
      campaign: shortText(160).optional(),
      term: shortText(160).optional(),
      content: shortText(160).optional(),
    })
    .optional(),
  events: z.array(eventSchema).min(1).max(40),
})

export type TrackPayload = z.infer<typeof trackPayloadSchema>

export type JourneySession = {
  id: string
  sessionKey: string
  visitorId: string
  startedAt: string
  lastSeenAt: string
  endedAt: string | null
  entryPath: string | null
  exitPath: string | null
  landingUrl: string | null
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  country: string | null
  region: string | null
  city: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  pageCount: number
  eventCount: number
  durationSeconds: number
  converted: boolean
  conversionType: string | null
  isReturning: boolean
}

export type JourneyEvent = {
  id: number
  occurredAt: string
  type: string
  path: string | null
  title: string | null
  target: string | null
  href: string | null
  durationMs: number | null
  scrollDepth: number | null
  meta: Record<string, unknown>
}

type SessionRow = {
  id: string
  session_key: string
  visitor_id: string
  started_at: string
  last_seen_at: string
  ended_at: string | null
  entry_path: string | null
  exit_path: string | null
  landing_url: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  country: string | null
  region: string | null
  city: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  page_count: number
  event_count: number
  duration_seconds: number
  converted: boolean
  conversion_type: string | null
  is_returning: boolean
}

type EventRow = {
  id: number
  occurred_at: string
  type: string
  path: string | null
  title: string | null
  target: string | null
  href: string | null
  duration_ms: number | null
  scroll_depth: number | null
  meta: Record<string, unknown> | null
}

function fromSessionRow(row: SessionRow): JourneySession {
  return {
    id: row.id,
    sessionKey: row.session_key,
    visitorId: row.visitor_id,
    startedAt: row.started_at,
    lastSeenAt: row.last_seen_at,
    endedAt: row.ended_at,
    entryPath: row.entry_path,
    exitPath: row.exit_path,
    landingUrl: row.landing_url,
    referrer: row.referrer,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    country: row.country,
    region: row.region,
    city: row.city,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    pageCount: row.page_count,
    eventCount: row.event_count,
    durationSeconds: row.duration_seconds,
    converted: row.converted,
    conversionType: row.conversion_type,
    isReturning: row.is_returning,
  }
}

function fromEventRow(row: EventRow): JourneyEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    type: row.type,
    path: row.path,
    title: row.title,
    target: row.target,
    href: row.href,
    durationMs: row.duration_ms,
    scrollDepth: row.scroll_depth,
    meta: row.meta ?? {},
  }
}

/** Raw IPs are never stored. The hash rotates daily, so it cannot be used to follow someone across days. */
export function hashIp(request: Request) {
  const ip = getClientIp(request)
  if (ip === "unknown") return null
  const day = new Date().toISOString().slice(0, 10)
  return createHash("sha256")
    .update(`${ip}|${day}|${process.env.NEXTAUTH_SECRET ?? "ct-journey"}`)
    .digest("hex")
    .slice(0, 24)
}

function readGeo(request: Request) {
  const decode = (value: string | null) => {
    if (!value) return null
    try {
      return decodeURIComponent(value).slice(0, 80)
    } catch {
      return value.slice(0, 80)
    }
  }

  return {
    country: decode(request.headers.get("x-vercel-ip-country")),
    region: decode(request.headers.get("x-vercel-ip-country-region")),
    city: decode(request.headers.get("x-vercel-ip-city")),
  }
}

function eventTime(at: number | undefined) {
  const now = Date.now()
  if (typeof at === "number" && Math.abs(now - at) < 10 * 60 * 1000) return new Date(at).toISOString()
  return new Date(now).toISOString()
}

export function isJourneyStorageReady() {
  return getSupabaseConfig().isConfigured
}

export async function recordJourneyEvents(payload: TrackPayload, request: Request) {
  if (!isJourneyStorageReady()) return { stored: false as const }

  const agent = parseUserAgent(request.headers.get("user-agent"))
  if (agent.isBot) return { stored: false as const }

  const supabase = createSupabaseAdminClient()
  const nowIso = new Date().toISOString()
  const pageviews = payload.events.filter((event) => event.type === "pageview")
  const lastPath = [...payload.events].reverse().find((event) => event.type === "pageview" || event.type === "exit")?.path
  const hasExit = payload.events.some((event) => event.type === "exit")
  const conversion = payload.events.find(
    (event) => event.type === "form_submit" && (event.meta?.form === "contact" || event.meta?.form === "job-application"),
  )

  const { data: existing, error: lookupError } = await supabase
    .from("visitor_sessions")
    .select("id, started_at, page_count, event_count, entry_path, converted")
    .eq("session_key", payload.sessionKey)
    .maybeSingle()
  if (lookupError) throw lookupError

  let sessionId: string

  if (!existing) {
    const geo = readGeo(request)
    const { data: created, error } = await supabase
      .from("visitor_sessions")
      .insert({
        session_key: payload.sessionKey,
        visitor_id: payload.visitorId,
        started_at: eventTime(payload.events[0]?.at),
        last_seen_at: nowIso,
        ended_at: hasExit ? nowIso : null,
        entry_path: pageviews[0]?.path ?? payload.events[0]?.path ?? null,
        exit_path: lastPath ?? null,
        landing_url: payload.landingUrl ?? null,
        referrer: payload.referrer || null,
        utm_source: payload.utm?.source ?? null,
        utm_medium: payload.utm?.medium ?? null,
        utm_campaign: payload.utm?.campaign ?? null,
        utm_term: payload.utm?.term ?? null,
        utm_content: payload.utm?.content ?? null,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        device_type: agent.deviceType,
        browser: agent.browser,
        os: agent.os,
        ip_hash: hashIp(request),
        page_count: pageviews.length,
        event_count: payload.events.length,
        converted: Boolean(conversion),
        conversion_type: conversion ? String(conversion.meta?.form) : null,
        is_returning: Boolean(payload.isReturning),
      })
      .select("id")
      .single()
    if (error) throw error
    sessionId = created.id
  } else {
    sessionId = existing.id
    const startedAt = new Date(existing.started_at).getTime()
    const update: Record<string, unknown> = {
      last_seen_at: nowIso,
      page_count: existing.page_count + pageviews.length,
      event_count: existing.event_count + payload.events.length,
      duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
    }
    if (lastPath) update.exit_path = lastPath
    if (hasExit) update.ended_at = nowIso
    else update.ended_at = null
    if (!existing.entry_path && pageviews[0]) update.entry_path = pageviews[0].path
    if (conversion && !existing.converted) {
      update.converted = true
      update.conversion_type = String(conversion.meta?.form)
    }
    const { error } = await supabase.from("visitor_sessions").update(update).eq("id", sessionId)
    if (error) throw error
  }

  const { error: insertError } = await supabase.from("visitor_events").insert(
    payload.events.map((event) => ({
      session_id: sessionId,
      occurred_at: eventTime(event.at),
      type: event.type,
      path: event.path,
      title: event.title ?? null,
      target: event.target ?? null,
      href: event.href ?? null,
      duration_ms: event.durationMs ?? null,
      scroll_depth: event.scrollDepth ?? null,
      meta: event.meta ?? {},
    })),
  )
  if (insertError) throw insertError

  return { stored: true as const, sessionId }
}

/** Flags a session as converted when a server-side form (contact, application) succeeds. */
export async function markJourneyConverted(sessionKey: string | undefined, type: string) {
  if (!sessionKey || !isJourneyStorageReady()) return
  try {
    const supabase = createSupabaseAdminClient()
    await supabase
      .from("visitor_sessions")
      .update({ converted: true, conversion_type: type })
      .eq("session_key", sessionKey)
  } catch (error) {
    console.error("Failed to mark journey as converted", error)
  }
}

export type JourneyFilters = {
  search?: string
  from?: string
  to?: string
  converted?: string
  source?: string
}

export async function listJourneySessions(filters: JourneyFilters = {}, limit = 200): Promise<JourneySession[]> {
  if (!isJourneyStorageReady()) return []
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("visitor_sessions").select("*").order("started_at", { ascending: false }).limit(limit)

  if (filters.from) query = query.gte("started_at", `${filters.from}T00:00:00.000Z`)
  if (filters.to) query = query.lte("started_at", `${filters.to}T23:59:59.999Z`)
  if (filters.converted === "yes") query = query.eq("converted", true)
  if (filters.converted === "no") query = query.eq("converted", false)
  if (filters.source) query = query.ilike("utm_source", `%${filters.source.replace(/[%,]/g, "")}%`)
  if (filters.search) {
    const term = filters.search.replace(/[%,()]/g, "").trim()
    if (term) {
      query = query.or(
        `entry_path.ilike.%${term}%,exit_path.ilike.%${term}%,referrer.ilike.%${term}%,country.ilike.%${term}%,city.ilike.%${term}%`,
      )
    }
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => fromSessionRow(row as SessionRow))
}

export async function getJourneySession(id: string) {
  if (!isJourneyStorageReady() || !/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = createSupabaseAdminClient()
  const { data: session, error } = await supabase.from("visitor_sessions").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  if (!session) return null

  const { data: events, error: eventsError } = await supabase
    .from("visitor_events")
    .select("*")
    .eq("session_id", id)
    .order("occurred_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1000)
  if (eventsError) throw eventsError

  const visitorSessions = await supabase
    .from("visitor_sessions")
    .select("id", { count: "exact", head: true })
    .eq("visitor_id", (session as SessionRow).visitor_id)

  return {
    session: fromSessionRow(session as SessionRow),
    events: (events ?? []).map((row) => fromEventRow(row as EventRow)),
    visitorSessionCount: visitorSessions.count ?? 1,
  }
}

export function summarizeJourneys(sessions: JourneySession[]) {
  const countBy = (pick: (session: JourneySession) => string | null) => {
    const counts = new Map<string, number>()
    for (const session of sessions) {
      const key = pick(session)
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }

  const total = sessions.length
  const converted = sessions.filter((session) => session.converted).length
  const pages = sessions.reduce((sum, session) => sum + session.pageCount, 0)
  const seconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0)

  return {
    total,
    converted,
    conversionRate: total ? Math.round((converted / total) * 1000) / 10 : 0,
    averagePages: total ? Math.round((pages / total) * 10) / 10 : 0,
    averageSeconds: total ? Math.round(seconds / total) : 0,
    topEntryPages: countBy((session) => session.entryPath),
    topExitPages: countBy((session) => session.exitPath),
    topSources: countBy((session) => sessionSource(session)),
  }
}

/** Where a visit came from, for display: UTM source, then the referring site, otherwise "direct". */
export function sessionSource(session: Pick<JourneySession, "utmSource" | "referrer">) {
  return session.utmSource ?? (session.referrer ? hostOf(session.referrer) : null) ?? "direct"
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`
}

export async function findJourneySessionId(sessionKey: string | null | undefined) {
  if (!sessionKey || !isJourneyStorageReady()) return null
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase.from("visitor_sessions").select("id").eq("session_key", sessionKey).maybeSingle()
  return (data?.id as string | undefined) ?? null
}
