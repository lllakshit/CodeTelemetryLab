import Link from "next/link"
import { format } from "date-fns"
import { SectionHeading } from "@/components/section-heading"
import { adminAccentButton, adminFieldLabel, adminGhostButton, adminInputClassName, adminSurface } from "@/lib/admin-ui"
import {
  formatDuration,
  isJourneyStorageReady,
  listJourneySessions,
  sessionSource,
  summarizeJourneys,
  type JourneyFilters,
} from "@/lib/journeys"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

function TopList({ title, items }: { title: string; items: Array<[string, number]> }) {
  return (
    <div className={`${adminSurface} p-5`}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h3>
      {items.length ? (
        <ol className="mt-3 space-y-2 text-sm">
          {items.map(([label, count]) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="truncate text-slate-800" title={label}>
                {label}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No data yet</p>
      )}
    </div>
  )
}

export default async function AdminJourneysPage({ searchParams }: { searchParams?: Promise<JourneyFilters> }) {
  const filters = (await searchParams) ?? {}
  const sessions = await listJourneySessions(filters)
  const summary = summarizeJourneys(sessions)

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Customer Journey"
        title="See where every visit started, what it did, and where it ended."
        description="Journeys are recorded only for visitors who accepted analytics cookies. Each visit lists the pages viewed, clicks, form activity, scroll depth, and the exit page."
      />

      {!isJourneyStorageReady() ? (
        <p className={`${adminSurface} p-4 text-sm text-amber-800`}>
          Supabase is not configured in this environment, so journeys cannot be stored or listed.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Visits", value: String(summary.total) },
          { label: "Converted", value: `${summary.converted} (${summary.conversionRate}%)` },
          { label: "Pages per visit", value: String(summary.averagePages) },
          { label: "Average visit", value: formatDuration(summary.averageSeconds) },
        ].map((card) => (
          <div key={card.label} className={`${adminSurface} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList title="Top entry pages" items={summary.topEntryPages} />
        <TopList title="Top exit pages" items={summary.topExitPages} />
        <TopList title="Top sources" items={summary.topSources} />
      </div>

      <form action="/admin/journeys" className={`${adminSurface} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.9fr_0.8fr_0.7fr_0.7fr_auto]`}>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Search</span>
          <input name="search" defaultValue={filters.search ?? ""} className={adminInputClassName()} placeholder="Page, referrer, country, city" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>UTM source</span>
          <input name="source" defaultValue={filters.source ?? ""} className={adminInputClassName()} placeholder="e.g. linkedin" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Converted</span>
          <select name="converted" defaultValue={filters.converted ?? ""} className={adminInputClassName()}>
            <option value="">All visits</option>
            <option value="yes">Converted only</option>
            <option value="no">Not converted</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>From</span>
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={adminInputClassName()} />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>To</span>
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={adminInputClassName()} />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={adminAccentButton}>
            Filter
          </button>
          <Link href="/admin/journeys" className={adminGhostButton}>
            Clear
          </Link>
        </div>
      </form>

      <div className={`${adminSurface} overflow-x-auto`}>
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Started</th>
              <th className="px-5 py-3 font-semibold">Visitor</th>
              <th className="px-5 py-3 font-semibold">Came in on</th>
              <th className="px-5 py-3 font-semibold">Left from</th>
              <th className="px-5 py-3 font-semibold">Pages</th>
              <th className="px-5 py-3 font-semibold">Time</th>
              <th className="px-5 py-3 font-semibold">Source</th>
              <th className="px-5 py-3 font-semibold">Result</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <tr key={session.id} className="align-top">
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {format(new Date(session.startedAt), "MMM d, h:mm a")}
                </td>
                <td className="px-5 py-4">
                  <p className="font-mono text-xs text-slate-700">{session.visitorId.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">
                    {[session.city, session.country].filter(Boolean).join(", ") || "Unknown location"} ·{" "}
                    {[session.deviceType, session.browser].filter(Boolean).join(" · ")}
                  </p>
                  {session.isReturning ? <p className="text-xs font-semibold text-blue-700">Returning</p> : null}
                </td>
                <td className="max-w-[14rem] truncate px-5 py-4 text-slate-800" title={session.entryPath ?? ""}>
                  {session.entryPath ?? "—"}
                </td>
                <td className="max-w-[14rem] truncate px-5 py-4 text-slate-800" title={session.exitPath ?? ""}>
                  {session.exitPath ?? "—"}
                </td>
                <td className="px-5 py-4 text-slate-600">{session.pageCount}</td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDuration(session.durationSeconds)}</td>
                <td className="max-w-[10rem] truncate px-5 py-4 text-slate-600">
                  {sessionSource(session)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      session.converted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    {session.converted ? (session.conversionType === "job-application" ? "Applied" : "Contacted") : "Browsing"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/admin/journeys/${session.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!sessions.length ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">
                  No journeys recorded yet. They appear here once visitors accept analytics cookies.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
