import { z } from "zod"
import { applicationStatuses } from "@/lib/applications"
import { listBlogPosts } from "@/lib/cms"
import { fetchPublicPage } from "@/lib/lead-discovery/fetch-page"
import { comparePeriods } from "@/lib/search-console/dates"
import { accessToken, googleClient, inspectUrl, listSitemaps } from "@/lib/search-console/google"
import { breakdown, dailyTotals, getConnection, getRefreshToken, latestDay, report, sumMetrics } from "@/lib/search-console/store"
import { SITE_URL } from "@/lib/seo"
import { leadStatuses } from "@/lib/store"
import { createSupabaseAdminClient } from "@/lib/supabase"
import type { ToolSpec } from "./groq-chat.ts"
import { auditHtml } from "./seo-page.ts"
import { createAction } from "./store.ts"

/**
 * Tools the assistant can call. All read tools query live data (Supabase, Google Search Console, the live site).
 * The only write tool is propose_change: it saves a proposal that the admin must Apply on screen.
 * Results are kept small (Groq free-tier limits are per minute), and numbers are computed here, not by the model.
 */

const MAX_RESULT_CHARS = 5000

const daysArg = { type: "integer", minimum: 1, maximum: 486, description: "Look-back period in days (default 30)" }

export const TOOL_SPECS: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "overview",
      description: "Headline numbers for a period: leads, job applications, website visits and conversions, prospects, Search Console clicks/impressions, with the previous period for comparison.",
      parameters: { type: "object", properties: { days: daysArg } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_leads",
      description: "Contact-form leads (newest first) with name, company, email, service, budget, timeline, status, source and message.",
      parameters: {
        type: "object",
        properties: {
          days: daysArg,
          status: { type: "string", enum: [...leadStatuses] },
          search: { type: "string", description: "Text to find in name, company, email, service or message" },
          limit: { type: "integer", minimum: 1, maximum: 40 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_applications",
      description: "Job applications (newest first) with candidate, role, experience, location, notice period, status, source and cover note.",
      parameters: {
        type: "object",
        properties: {
          days: daysArg,
          status: { type: "string", enum: [...applicationStatuses] },
          job: { type: "string", description: "Text to find in the job title or slug" },
          limit: { type: "integer", minimum: 1, maximum: 40 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "traffic",
      description: "Where website visits come from (source = UTM, referring site or direct) with conversions, the most viewed pages, and which sources produced leads and applications.",
      parameters: { type: "object", properties: { days: daysArg } },
    },
  },
  {
    type: "function",
    function: {
      name: "search_console",
      description:
        "Google Search Console data synced daily (web search). report: summary (totals + trend vs previous period), queries, pages, query_page, opportunities (position 4-20 with low CTR), countries, devices.",
      parameters: {
        type: "object",
        properties: {
          report: { type: "string", enum: ["summary", "queries", "pages", "query_page", "opportunities", "countries", "devices"] },
          days: daysArg,
          page_contains: { type: "string", description: "Only pages whose URL contains this" },
          query_contains: { type: "string", description: "Only queries containing this" },
          order: { type: "string", enum: ["clicks", "impressions"] },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        required: ["report"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_console_live",
      description: "Live Google calls: inspect_url (is a URL indexed, last crawl, canonical, mobile) or sitemaps (submitted sitemaps, errors, indexed counts).",
      parameters: {
        type: "object",
        properties: { action: { type: "string", enum: ["inspect_url", "sitemaps"] }, url: { type: "string", description: "Full URL on the site, for inspect_url" } },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_blog_posts",
      description: "Blog posts from the CMS with id, slug, title, SEO title, SEO description (with lengths), category, published state and updated date.",
      parameters: { type: "object", properties: { search: { type: "string" }, unpublished: { type: "boolean" }, limit: { type: "integer", minimum: 1, maximum: 40 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "audit_page",
      description: "Fetches a live page of the site and checks on-page SEO: title, meta description, canonical, robots, h1/h2, word count, images without alt, links, structured data, with a list of issues.",
      parameters: { type: "object", properties: { path: { type: "string", description: "Path like /blog/some-post or a full URL on the site" } }, required: ["path"] },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_change",
      description:
        "Proposes a change for the admin to approve on screen (nothing changes until they press Apply). kind blog_seo: changes {seo_title?, seo_description?, excerpt?}, id = blog post id. lead_update: {status?, notes?}, id = lead id. application_update: {status?, notes?}, id = application id.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["blog_seo", "lead_update", "application_update"] },
          id: { type: "string" },
          changes: { type: "object" },
          reason: { type: "string", description: "One sentence: why, citing the data" },
        },
        required: ["kind", "id", "changes", "reason"],
      },
    },
  },
]

export type ToolContext = { threadId: string; today: string }
export type ToolOutcome = { ok: boolean; result: unknown; preview: string; actionId?: string }

const db = () => createSupabaseAdminClient()

function sinceIso(days: number | undefined) {
  const span = Math.max(1, Math.min(486, Math.floor(days ?? 30)))
  return new Date(Date.now() - span * 86_400_000).toISOString()
}

function clip(text: string | null | undefined, max: number) {
  if (!text) return null
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function sourceOf(row: { utm_source?: string | null; referrer?: string | null; source?: string | null }) {
  if (row.utm_source) return row.utm_source
  if (row.referrer) {
    try {
      const host = new URL(row.referrer).hostname.replace(/^www\./, "")
      // The site's own pages (the contact form) and previews are not a traffic source.
      if (!/(^|\.)codetelemetrylabs?\.me$|^localhost$|^127\.0\.0\.1$|\.vercel\.app$/.test(host)) return host
    } catch {
      // fall through
    }
  }
  return row.source ?? "direct"
}

function round(value: number, digits = 3) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

async function countRows(table: string, opts: { since?: string; until?: string; eq?: [string, string | boolean] } = {}) {
  let query = db().from(table).select("*", { count: "exact", head: true })
  const column = table === "visitor_sessions" ? "started_at" : "created_at"
  if (opts.since) query = query.gte(column, opts.since)
  if (opts.until) query = query.lt(column, opts.until)
  if (opts.eq) query = query.eq(opts.eq[0], opts.eq[1])
  const { count, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return count ?? 0
}

async function gscSite() {
  const connection = await getConnection().catch(() => null)
  return connection?.siteUrl ?? null
}

async function overview(args: { days?: number }) {
  const days = Math.max(1, Math.min(486, Math.floor(args.days ?? 30)))
  const now = Date.now()
  const since = new Date(now - days * 86_400_000).toISOString()
  const prevSince = new Date(now - 2 * days * 86_400_000).toISOString()
  const [leads, leadsPrev, newLeads, apps, appsPrev, newApps, sessions, sessionsPrev, converted, prospects] = await Promise.all([
    countRows("leads", { since }),
    countRows("leads", { since: prevSince, until: since }),
    countRows("leads", { eq: ["status", "New"] }),
    countRows("job_applications", { since }),
    countRows("job_applications", { since: prevSince, until: since }),
    countRows("job_applications", { eq: ["status", "new"] }),
    countRows("visitor_sessions", { since }),
    countRows("visitor_sessions", { since: prevSince, until: since }),
    countRows("visitor_sessions", { since, eq: ["converted", true] }),
    countRows("prospects", { eq: ["status", "new"] }).catch(() => null),
  ])
  let search: unknown = "Search Console not connected"
  const site = await gscSite()
  if (site) {
    const latest = await latestDay(site)
    if (latest) {
      const { current, previous } = comparePeriods(latest, days)
      const [cur, prev] = await Promise.all([dailyTotals(site, current.from, current.to), dailyTotals(site, previous.from, previous.to)])
      const a = sumMetrics(cur)
      const b = sumMetrics(prev)
      search = {
        site,
        period: current,
        clicks: a.clicks,
        clicks_previous: b.clicks,
        impressions: a.impressions,
        impressions_previous: b.impressions,
        ctr: round(a.ctr),
        avg_position: round(a.position, 1),
        avg_position_previous: round(b.position, 1),
      }
    } else search = "Connected but no data synced yet"
  }
  return {
    period_days: days,
    leads: { in_period: leads, previous_period: leadsPrev, open_status_new_all_time: newLeads },
    job_applications: { in_period: apps, previous_period: appsPrev, open_status_new_all_time: newApps },
    website: { tracked_visits: sessions, previous_period: sessionsPrev, converted_visits: converted, note: "Only visitors who accepted analytics cookies are tracked." },
    prospects_waiting_review: prospects,
    search_console: search,
  }
}

async function listLeads(args: { days?: number; status?: string; search?: string; limit?: number }) {
  let query = db()
    .from("leads")
    .select("id, created_at, full_name, company_name, email, country, budget, timeline, service_interested_in, subject, message, status, source, utm_source, utm_medium, utm_campaign, referrer, notes")
    .order("created_at", { ascending: false })
    .limit(Math.min(40, args.limit ?? 15))
  if (args.days) query = query.gte("created_at", sinceIso(args.days))
  if (args.status) query = query.eq("status", args.status)
  if (args.search) {
    const term = args.search.replace(/[%,()]/g, " ").trim()
    if (term) query = query.or(["full_name", "company_name", "email", "service_interested_in", "message"].map((c) => `${c}.ilike.%${term}%`).join(","))
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    created: row.created_at,
    name: row.full_name,
    company: row.company_name,
    email: row.email,
    country: row.country,
    service: row.service_interested_in,
    budget: row.budget,
    timeline: row.timeline,
    status: row.status,
    source: sourceOf(row),
    campaign: row.utm_campaign,
    subject: clip(row.subject, 120),
    message: clip(row.message, 350),
    notes: clip(row.notes, 200),
  }))
}

async function listApplications(args: { days?: number; status?: string; job?: string; limit?: number }) {
  let query = db()
    .from("job_applications")
    .select("id, created_at, job_slug, job_title, full_name, email, location, years_experience, notice_period, expected_compensation, current_company, linkedin_url, portfolio_url, cover_note, status, notes, utm_source, referrer")
    .order("created_at", { ascending: false })
    .limit(Math.min(40, args.limit ?? 15))
  if (args.days) query = query.gte("created_at", sinceIso(args.days))
  if (args.status) query = query.eq("status", args.status)
  if (args.job) {
    const term = args.job.replace(/[%,()]/g, " ").trim()
    if (term) query = query.or(`job_title.ilike.%${term}%,job_slug.ilike.%${term}%`)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    created: row.created_at,
    role: row.job_title,
    name: row.full_name,
    email: row.email,
    location: row.location,
    experience: row.years_experience,
    notice: row.notice_period,
    expected_pay: row.expected_compensation,
    company: row.current_company,
    linkedin: row.linkedin_url,
    portfolio: row.portfolio_url,
    status: row.status,
    source: sourceOf(row),
    cover_note: clip(row.cover_note, 350),
    notes: clip(row.notes, 200),
  }))
}

async function traffic(args: { days?: number }) {
  const since = sinceIso(args.days)
  const client = db()
  const [sources, paths, inbound] = await Promise.all([
    client.rpc("ai_traffic_sources", { p_since: since, p_limit: 15 }),
    client.rpc("ai_top_paths", { p_since: since, p_limit: 15 }),
    client.rpc("ai_inbound_breakdown", { p_since: since }),
  ])
  for (const r of [sources, paths, inbound]) if (r.error) throw new Error(r.error.message)
  return {
    period_days: args.days ?? 30,
    note: "Visits count only visitors who accepted analytics cookies; leads and applications are complete.",
    visit_sources: (sources.data as { source: string; sessions: number; converted: number; avg_pages: number; avg_seconds: number; top_entry: string }[]).map((r) => ({
      source: r.source,
      visits: Number(r.sessions),
      converted: Number(r.converted),
      avg_pages: round(Number(r.avg_pages ?? 0), 1),
      avg_seconds: Math.round(Number(r.avg_seconds ?? 0)),
      top_landing: r.top_entry,
    })),
    top_pages: (paths.data as { path: string; views: number; visitors: number; avg_ms: number | null }[]).map((r) => ({
      path: r.path,
      views: Number(r.views),
      visitors: Number(r.visitors),
      avg_seconds_on_page: r.avg_ms ? Math.round(Number(r.avg_ms) / 1000) : null,
    })),
    leads_and_applications_by_source: (inbound.data as { kind: string; source: string; status: string; total: number }[]).map((r) => ({ ...r, total: Number(r.total) })),
  }
}

type GscArgs = { report: string; days?: number; page_contains?: string; query_contains?: string; order?: "clicks" | "impressions"; limit?: number }

function gscRow(row: { query: string | null; page: string | null; clicks: number; impressions: number; ctr: number; position: number }) {
  return {
    ...(row.query !== null ? { query: row.query } : {}),
    ...(row.page !== null ? { page: row.page.replace(/^https?:\/\/[^/]+/, "") || "/" } : {}),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: round(row.ctr),
    position: round(row.position, 1),
  }
}

async function searchConsole(args: GscArgs) {
  const site = await gscSite()
  if (!site) return { error: "Search Console is not connected. Connect it under Admin > Search Console." }
  const latest = await latestDay(site)
  if (!latest) return { error: "Search Console is connected but no data is synced yet. Press Load 16 months on the Search Console screen." }
  const days = args.days ?? 28
  const { current, previous } = comparePeriods(latest, days)
  const limit = Math.min(50, args.limit ?? 20)
  const base = { site, period: current, note: "Google data lags 2-3 days; the period ends at the latest synced day." }
  switch (args.report) {
    case "summary": {
      const [cur, prev] = await Promise.all([dailyTotals(site, current.from, current.to), dailyTotals(site, previous.from, previous.to)])
      const a = sumMetrics(cur)
      const b = sumMetrics(prev)
      const weekly: { week_start: string; clicks: number; impressions: number }[] = []
      for (let i = 0; i < cur.length; i += 7) {
        const chunk = cur.slice(i, i + 7)
        weekly.push({ week_start: chunk[0].date, clicks: chunk.reduce((s, p) => s + p.clicks, 0), impressions: chunk.reduce((s, p) => s + p.impressions, 0) })
      }
      return {
        ...base,
        previous_period: previous,
        current: { clicks: a.clicks, impressions: a.impressions, ctr: round(a.ctr), position: round(a.position, 1) },
        previous: { clicks: b.clicks, impressions: b.impressions, ctr: round(b.ctr), position: round(b.position, 1) },
        weekly: weekly.slice(-26),
      }
    }
    case "queries":
    case "pages":
    case "query_page": {
      const rows = await report({
        siteUrl: site,
        from: current.from,
        to: current.to,
        group: args.report === "queries" ? "query" : args.report === "pages" ? "page" : "query_page",
        limit,
        order: args.order,
        page: args.page_contains ?? null,
        query: args.query_contains ?? null,
      })
      return { ...base, rows: rows.map(gscRow) }
    }
    case "opportunities": {
      const rows = await report({ siteUrl: site, from: current.from, to: current.to, group: "query_page", limit: 300, order: "impressions", minImpressions: 10, page: args.page_contains ?? null, query: args.query_contains ?? null })
      const picked = rows.filter((r) => r.position >= 4 && r.position <= 20 && r.ctr < 0.05).slice(0, limit)
      return { ...base, rule: "position 4-20, CTR under 5%, at least 10 impressions", rows: picked.map(gscRow) }
    }
    case "countries":
    case "devices": {
      const rows = await breakdown(site, current.from, current.to, args.report === "countries" ? "country" : "device", limit)
      return { ...base, rows: rows.map((r) => ({ key: r.key, clicks: r.clicks, impressions: r.impressions, ctr: round(r.ctr), position: round(r.position, 1) })) }
    }
    default:
      return { error: `Unknown report ${args.report}` }
  }
}

function siteUrlFor(input: string) {
  const base = new URL(SITE_URL)
  const url = new URL(input, base)
  if (url.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) throw new Error(`Only pages on ${base.hostname} can be checked`)
  url.protocol = "https:"
  return url
}

async function searchConsoleLive(args: { action: string; url?: string }) {
  const client = googleClient()
  const saved = await getRefreshToken()
  if (!client || !saved.ok || !saved.connection.siteUrl) return { error: "Search Console is not connected." }
  const token = await accessToken(client, saved.token)
  if (args.action === "sitemaps") {
    const maps = await listSitemaps(token, saved.connection.siteUrl)
    return maps.map((m) => ({ path: m.path, last_submitted: m.lastSubmitted, last_downloaded: m.lastDownloaded, pending: m.isPending, errors: m.errors, warnings: m.warnings, contents: m.contents }))
  }
  if (!args.url) return { error: "url is required for inspect_url" }
  const url = siteUrlFor(args.url).toString()
  return { url, ...(await inspectUrl(token, saved.connection.siteUrl, url)) }
}

async function blogPosts(args: { search?: string; unpublished?: boolean; limit?: number }) {
  const posts = await listBlogPosts()
  const term = args.search?.toLowerCase().trim()
  return posts
    .filter((p) => (args.unpublished ? !p.isPublished : true))
    .filter((p) => !term || `${p.title} ${p.slug} ${p.category} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(term))
    .slice(0, Math.min(40, args.limit ?? 20))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      url: `/blog/${p.slug}`,
      title: p.title,
      seo_title: p.seoTitle ?? null,
      seo_title_length: p.seoTitle?.length ?? 0,
      seo_description: clip(p.seoDescription, 200),
      seo_description_length: p.seoDescription?.length ?? 0,
      category: p.category,
      published: p.isPublished,
      updated: p.updatedAt,
      editable: p.source !== "content" && !p.id.startsWith("content:"),
    }))
}

async function auditPage(args: { path: string }) {
  const url = siteUrlFor(args.path)
  const page = await fetchPublicPage(url.toString(), { timeoutMs: 12_000, maxBytes: 1_500_000, accept: /text\/html|application\/xhtml/i })
  if (!page) return { error: `Could not load ${url}` }
  return { url: page.url, status: page.status, ...auditHtml(page.body, page.url) }
}

const proposeSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("blog_seo"),
    id: z.string().min(1),
    reason: z.string().max(600),
    changes: z
      .object({ seo_title: z.string().min(10).max(70).optional(), seo_description: z.string().min(50).max(170).optional(), excerpt: z.string().min(20).max(320).optional() })
      .strict()
      .refine((c) => Object.keys(c).length > 0, "no changes"),
  }),
  z.object({
    kind: z.literal("lead_update"),
    id: z.string().uuid(),
    reason: z.string().max(600),
    changes: z.object({ status: z.enum(leadStatuses).optional(), notes: z.string().max(2000).optional() }).strict().refine((c) => Object.keys(c).length > 0, "no changes"),
  }),
  z.object({
    kind: z.literal("application_update"),
    id: z.string().uuid(),
    reason: z.string().max(600),
    changes: z.object({ status: z.enum(applicationStatuses).optional(), notes: z.string().max(2000).optional() }).strict().refine((c) => Object.keys(c).length > 0, "no changes"),
  }),
])

async function proposeChange(args: unknown, ctx: ToolContext) {
  const parsed = proposeSchema.safeParse(args)
  if (!parsed.success) return { error: `Invalid proposal: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` }
  const p = parsed.data
  let before: Record<string, unknown> = {}
  let label = p.id
  if (p.kind === "blog_seo") {
    const { data } = await db().from("blog_posts").select("id, slug, title, seo_title, seo_description, excerpt").eq("id", p.id).maybeSingle()
    if (!data) return { error: "No CMS blog post with that id (file-based posts cannot be edited here). Use list_blog_posts for ids." }
    before = { seo_title: data.seo_title, seo_description: data.seo_description, excerpt: data.excerpt }
    label = `${data.title} (/blog/${data.slug})`
  } else {
    const table = p.kind === "lead_update" ? "leads" : "job_applications"
    const { data } = await db().from(table).select("id, full_name, status, notes").eq("id", p.id).maybeSingle()
    if (!data) return { error: `No ${p.kind === "lead_update" ? "lead" : "application"} with that id.` }
    before = { status: data.status, notes: data.notes }
    label = String(data.full_name ?? p.id)
  }
  const id = await createAction({ threadId: ctx.threadId, kind: p.kind, targetId: p.id, targetLabel: label, before, after: p.changes, reason: p.reason })
  return { proposal_id: id, status: "pending — shown to the admin with an Apply button; it is NOT applied yet", target: label }
}

export async function runTool(name: string, rawArgs: string, ctx: ToolContext): Promise<ToolOutcome> {
  let args: Record<string, unknown> = {}
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {}
  } catch {
    return { ok: false, result: { error: "Arguments were not valid JSON" }, preview: "bad arguments" }
  }
  try {
    let result: unknown
    switch (name) {
      case "overview":
        result = await overview(args as { days?: number })
        break
      case "list_leads":
        result = await listLeads(args as never)
        break
      case "list_applications":
        result = await listApplications(args as never)
        break
      case "traffic":
        result = await traffic(args as { days?: number })
        break
      case "search_console":
        result = await searchConsole(args as unknown as GscArgs)
        break
      case "search_console_live":
        result = await searchConsoleLive(args as { action: string; url?: string })
        break
      case "list_blog_posts":
        result = await blogPosts(args as never)
        break
      case "audit_page":
        result = await auditPage(args as { path: string })
        break
      case "propose_change":
        result = await proposeChange(args, ctx)
        break
      default:
        return { ok: false, result: { error: `Unknown tool ${name}` }, preview: "unknown tool" }
    }
    const failed = Boolean(result && typeof result === "object" && "error" in (result as object))
    const actionId = name === "propose_change" && !failed ? (result as { proposal_id: string }).proposal_id : undefined
    return { ok: !failed, result, preview: previewOf(name, args, result), actionId }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, result: { error: message }, preview: `failed: ${message.slice(0, 120)}` }
  }
}

function previewOf(name: string, args: Record<string, unknown>, result: unknown) {
  if (result && typeof result === "object" && "error" in (result as object)) return String((result as { error: unknown }).error).slice(0, 160)
  if (Array.isArray(result)) return `${result.length} rows`
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown[] }).rows)) return `${(result as { rows: unknown[] }).rows.length} rows`
  return Object.keys(args).length ? Object.entries(args).map(([k, v]) => `${k}=${typeof v === "object" ? "…" : String(v)}`).join(", ").slice(0, 160) : "done"
}

/** JSON for the model, cut to a safe size. */
export function toolContent(result: unknown) {
  const text = JSON.stringify(result)
  return text.length > MAX_RESULT_CHARS ? `${text.slice(0, MAX_RESULT_CHARS)}… [cut: ask for fewer rows or a narrower filter]` : text
}
