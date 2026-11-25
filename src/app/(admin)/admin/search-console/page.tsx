import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { CheckCircle2, ExternalLink, Search, Sparkles, TriangleAlert } from "lucide-react"
import { AdminGscSyncButton } from "@/components/admin-gsc-sync-button"
import { SectionHeading } from "@/components/section-heading"
import { chooseSiteAction, disconnectAction } from "@/app/(admin)/admin/search-console/actions"
import { adminDangerButton, adminGhostButton, adminHint, adminInfoChip, adminPrimaryButton, adminSurface, adminSurfaceSoft } from "@/lib/admin-ui"
import { comparePeriods } from "@/lib/search-console/dates"
import { accessToken, googleClient, listSites, type GscSite } from "@/lib/search-console/google"
import {
  breakdown,
  dailyTotals,
  getConnection,
  getRefreshToken,
  latestDay,
  report,
  storageReady,
  sumMetrics,
  type BreakdownRow,
  type DailyPoint,
  type GscConnection,
  type Metric,
  type ReportRow,
} from "@/lib/search-console/store"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const ERRORS: Record<string, string> = {
  not_configured: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in Vercel yet.",
  denied: "Google sign-in was cancelled.",
  state: "The sign-in expired or was opened in another browser. Press Connect again.",
  scope: "Search Console access was not granted. Press Connect and tick the Search Console permission.",
  no_refresh: "Google did not return a long-lived token. Remove the app at myaccount.google.com/permissions, then Connect again.",
  exchange: "Google refused the sign-in code. Check that the redirect URI in Google Cloud matches exactly, then try again.",
  google: "Google returned an error during sign-in.",
}

const PERIODS = [7, 28, 90, 180, 365] as const

const pct = (value: number) => `${(value * 100).toFixed(1)}%`
const num = (value: number) => Math.round(value).toLocaleString("en-IN")

function change(current: number, previous: number) {
  if (!previous) return current ? "new" : "–"
  const delta = ((current - previous) / previous) * 100
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`
}

function shortPage(url: string | null) {
  if (!url) return ""
  try {
    const u = new URL(url)
    return u.pathname + u.search || "/"
  } catch {
    return url
  }
}

type PageProps = { searchParams?: Promise<{ days?: string; error?: string; connected?: string }> }

export default async function AdminSearchConsolePage({ searchParams }: PageProps) {
  const params = await searchParams
  const days = PERIODS.includes(Number(params?.days) as (typeof PERIODS)[number]) ? Number(params?.days) : 28
  const configured = Boolean(googleClient())
  const ready = storageReady()

  let connection: GscConnection | null = null
  let loadError: string | null = null
  if (ready) {
    try {
      connection = await getConnection()
    } catch (error) {
      loadError = error instanceof Error && /gsc_connection/.test(error.message) ? "The Search Console tables are missing: apply migration 20261125000000_search_console_ai.sql." : "Search Console data could not be loaded."
    }
  }

  let sites: GscSite[] = []
  let sitesError: string | null = null
  if (connection && configured) {
    try {
      const saved = await getRefreshToken()
      if (!saved.ok) throw new Error(saved.error)
      sites = await listSites(await accessToken(googleClient()!, saved.token))
    } catch (error) {
      sitesError = error instanceof Error ? error.message : "Could not reach Google."
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Search Console"
          title="What people search on Google before they reach the site."
          description="Read-only link to Google Search Console. Data syncs every morning (last 10 days, since Google revises recent days) and is stored in Supabase, so the AI assistant can analyse it."
        />
        {connection?.siteUrl ? <AdminGscSyncButton /> : null}
      </div>

      {params?.error ? <Notice tone="bad">{ERRORS[params.error] ?? "Sign-in failed."}</Notice> : null}
      {params?.connected ? <Notice tone="good">Google account connected. Choose the property below, then press Load 16 months once.</Notice> : null}
      {!ready ? <Notice tone="bad">Supabase is not configured on this deployment.</Notice> : null}
      {loadError ? <Notice tone="bad">{loadError}</Notice> : null}
      {!configured ? (
        <Notice tone="warn">
          Add <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong> (from the Google Cloud OAuth client) in Vercel, Production and Preview, then redeploy.
        </Notice>
      ) : null}

      <ConnectionCard connection={connection} configured={configured} sites={sites} sitesError={sitesError} />

      {connection?.siteUrl ? <Report siteUrl={connection.siteUrl} days={days} /> : null}
    </div>
  )
}

function Notice({ tone, children }: { tone: "good" | "warn" | "bad"; children: React.ReactNode }) {
  const styles = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone]
  return <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", styles)}>{children}</div>
}

function ConnectionCard({ connection, configured, sites, sitesError }: { connection: GscConnection | null; configured: boolean; sites: GscSite[]; sitesError: string | null }) {
  if (!connection) {
    return (
      <div className={cn(adminSurface, "flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex items-start gap-3">
          <Search className="mt-1 h-5 w-5 text-slate-500" />
          <div>
            <p className="text-base font-semibold text-slate-950">Not connected</p>
            <p className={adminHint}>Sign in with the Google account that owns the site in Search Console. Access is read-only and can be removed here at any time.</p>
          </div>
        </div>
        {configured ? (
          <a href="/api/admin/search-console/connect" className={adminPrimaryButton}>
            Connect Google Search Console
          </a>
        ) : null}
      </div>
    )
  }

  const last = connection.lastSyncAt ? formatDistanceToNowStrict(new Date(connection.lastSyncAt), { addSuffix: true }) : "never"
  return (
    <div className={cn(adminSurface, "space-y-5 p-6")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-950">Connected{connection.googleEmail ? ` as ${connection.googleEmail}` : ""}</p>
            <p className={adminHint}>
              Last sync {last}
              {connection.lastSyncStatus === "error" ? " (failed)" : ""}
              {connection.dataFrom && connection.dataTo ? ` · data ${connection.dataFrom} to ${connection.dataTo}` : ""}
            </p>
            {connection.lastSyncStatus === "error" && connection.lastSyncError ? (
              <p className="flex items-start gap-1.5 text-xs leading-5 text-rose-700">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {connection.lastSyncError}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/search-console/connect" className={adminGhostButton}>
            Reconnect
          </a>
          <Link href="/admin/ai?prompt=Analyse%20my%20Search%20Console%20data%20and%20give%20me%20the%20top%205%20SEO%20actions" className={cn(adminGhostButton, "gap-2")}>
            <Sparkles className="h-4 w-4" /> Ask AI
          </Link>
        </div>
      </div>

      <form action={chooseSiteAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Property</span>
          <select
            name="siteUrl"
            defaultValue={connection.siteUrl ?? ""}
            required
            className="w-full rounded-2xl border border-[rgba(10,19,23,0.12)] bg-white px-4 py-3 text-sm text-slate-900"
          >
            <option value="" disabled>
              {sites.length ? "Choose a property" : "No properties found"}
            </option>
            {connection.siteUrl && !sites.some((site) => site.siteUrl === connection.siteUrl) ? <option value={connection.siteUrl}>{connection.siteUrl}</option> : null}
            {sites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl} ({site.permissionLevel.replace("site", "").toLowerCase()})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminPrimaryButton} disabled={!sites.length}>
          Use this property
        </button>
      </form>
      {sitesError ? <p className="text-xs text-rose-700">Could not list properties: {sitesError}</p> : null}
      {!sitesError && !sites.length ? (
        <p className={adminHint}>This Google account has no verified Search Console property. Add and verify the site in Search Console first, or reconnect with the owner account.</p>
      ) : null}

      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Disconnect</summary>
        <form action={disconnectAction} className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="purge" /> Also delete the synced Search Console numbers
          </label>
          <button type="submit" className={adminDangerButton}>
            Disconnect Google
          </button>
        </form>
      </details>
    </div>
  )
}

async function Report({ siteUrl, days }: { siteUrl: string; days: number }) {
  const latest = await latestDay(siteUrl).catch(() => null)
  if (!latest) {
    return (
      <div className={cn(adminSurface, "p-8 text-center")}>
        <p className="text-lg font-semibold text-slate-950">No data synced yet.</p>
        <p className="mt-2 text-sm text-slate-600">Press Load 16 months above. New sites can take a few days to show data in Search Console.</p>
      </div>
    )
  }
  const { current, previous } = comparePeriods(latest, days)
  const [points, prevPoints, queries, pages, chances, countries, devices] = await Promise.all([
    dailyTotals(siteUrl, current.from, current.to),
    dailyTotals(siteUrl, previous.from, previous.to),
    report({ siteUrl, from: current.from, to: current.to, group: "query", limit: 25 }),
    report({ siteUrl, from: current.from, to: current.to, group: "page", limit: 25 }),
    report({ siteUrl, from: current.from, to: current.to, group: "query_page", limit: 200, order: "impressions", minImpressions: 20 }),
    breakdown(siteUrl, current.from, current.to, "country", 8),
    breakdown(siteUrl, current.from, current.to, "device", 3),
  ])
  const now = sumMetrics(points)
  const before = sumMetrics(prevPoints)
  // Page-2-ish rankings with impressions but few clicks: the quickest SEO wins.
  const opportunities = chances.filter((row) => row.position >= 4 && row.position <= 20 && row.ctr < 0.05).slice(0, 12)

  return (
    <div className="space-y-6">
      <nav aria-label="Period" className="flex flex-wrap items-center gap-2">
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={`/admin/search-console?days=${value}`}
            aria-current={value === days ? "page" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              value === days ? "bg-slate-950 text-white" : "border border-[rgba(10,19,23,0.1)] bg-white text-slate-600 hover:text-slate-950",
            )}
          >
            {value} days
          </Link>
        ))}
        <span className={adminInfoChip}>
          {current.from} to {current.to}
        </span>
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Clicks" value={num(now.clicks)} delta={change(now.clicks, before.clicks)} />
        <Kpi label="Impressions" value={num(now.impressions)} delta={change(now.impressions, before.impressions)} />
        <Kpi label="CTR" value={pct(now.ctr)} delta={change(now.ctr, before.ctr)} />
        <Kpi label="Avg position" value={now.position ? now.position.toFixed(1) : "–"} delta={before.position ? `${(before.position - now.position >= 0 ? "+" : "")}${(before.position - now.position).toFixed(1)}` : "–"} hint="higher is better" />
      </div>

      <Trend points={points} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Table title="Top queries" rows={queries} label={(row) => row.query ?? ""} />
        <Table title="Top pages" rows={pages} label={(row) => shortPage(row.page)} href={(row) => row.page} />
      </div>

      <div className={cn(adminSurface, "p-5")}>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-base font-semibold text-slate-950">Opportunities: position 4–20, CTR under 5%</h3>
          <Link href="/admin/ai?prompt=Take%20my%20Search%20Console%20opportunities%20(position%204-20%2C%20low%20CTR)%20and%20propose%20better%20SEO%20titles%20and%20descriptions" className="text-xs font-semibold text-[#0064e0]">
            Ask AI to fix these →
          </Link>
        </div>
        {opportunities.length ? (
          <MetricRows rows={opportunities} label={(row) => `${row.query} → ${shortPage(row.page)}`} />
        ) : (
          <p className={adminHint}>None in this period (needs at least 20 impressions per query and page).</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Countries" rows={countries} />
        <Breakdown title="Devices" rows={devices} />
      </div>
    </div>
  )
}

function Kpi({ label, value, delta, hint }: { label: string; value: string; delta: string; hint?: string }) {
  const negative = delta.startsWith("-")
  return (
    <div className={cn(adminSurfaceSoft, "p-4")}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className={cn("mt-1 text-xs font-semibold", negative ? "text-rose-600" : "text-emerald-700")}>
        {delta} <span className="font-normal text-slate-500">vs previous period{hint ? ` · ${hint}` : ""}</span>
      </p>
    </div>
  )
}

function Trend({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.impressions))
  return (
    <div className={cn(adminSurface, "p-5")}>
      <h3 className="mb-3 text-base font-semibold text-slate-950">Daily impressions and clicks</h3>
      <div className="flex h-32 items-end gap-[2px]" role="img" aria-label="Daily impressions (light) and clicks (dark)">
        {points.map((p) => (
          <div key={p.date} className="relative flex h-full flex-1 items-end" title={`${p.date}: ${p.clicks} clicks, ${p.impressions} impressions`}>
            <div className="w-full rounded-t bg-[#cfe0fb]" style={{ height: `${(p.impressions / max) * 100}%` }} />
            <div className="absolute bottom-0 w-full rounded-t bg-[#0064e0]" style={{ height: `${(p.clicks / max) * 100}%`, minHeight: p.clicks ? 2 : 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricRows<T extends Metric>({ rows, label, href }: { rows: T[]; label: (row: T) => string; href?: (row: T) => string | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="py-2 pr-3 font-semibold"> </th>
            <th className="py-2 pr-3 text-right font-semibold">Clicks</th>
            <th className="py-2 pr-3 text-right font-semibold">Impr.</th>
            <th className="py-2 pr-3 text-right font-semibold">CTR</th>
            <th className="py-2 text-right font-semibold">Pos.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const link = href?.(row)
            return (
              <tr key={`${label(row)}-${index}`}>
                <td className="max-w-[320px] truncate py-2 pr-3 text-slate-800">
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#0064e0]">
                      {label(row)} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    label(row)
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{num(row.clicks)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{num(row.impressions)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{pct(row.ctr)}</td>
                <td className="py-2 text-right tabular-nums">{row.position.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Table({ title, rows, label, href }: { title: string; rows: ReportRow[]; label: (row: ReportRow) => string; href?: (row: ReportRow) => string | null }) {
  return (
    <div className={cn(adminSurface, "p-5")}>
      <h3 className="mb-3 text-base font-semibold text-slate-950">{title}</h3>
      {rows.length ? <MetricRows rows={rows} label={label} href={href} /> : <p className={adminHint}>No rows in this period.</p>}
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <div className={cn(adminSurface, "p-5")}>
      <h3 className="mb-3 text-base font-semibold text-slate-950">{title}</h3>
      {rows.length ? <MetricRows rows={rows} label={(row) => row.key.toUpperCase()} /> : <p className={adminHint}>No rows in this period.</p>}
    </div>
  )
}
