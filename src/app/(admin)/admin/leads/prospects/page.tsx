import Link from "next/link"
import { format, formatDistanceToNowStrict } from "date-fns"
import { CalendarClock, ExternalLink, Globe, Mail, PenLine } from "lucide-react"
import { AdminLeadsTabs } from "@/components/admin-leads-tabs"
import { AdminProspectsRunButton } from "@/components/admin-prospects-run-button"
import { SectionHeading } from "@/components/section-heading"
import { saveProspectNotesAction, setProspectStatusAction } from "@/app/(admin)/admin/leads/prospects/actions"
import { adminGhostButton, adminHint, adminInfoChip, adminSurface, adminSurfaceSoft, adminTextareaClassName } from "@/lib/admin-ui"
import { groqConfigured, groqModel } from "@/lib/lead-discovery/groq"
import { QUALIFY_THRESHOLD, WEIGHTS } from "@/lib/lead-discovery/scoring"
import { countProspectsByStatus, listProspects, listRuns, type RunRow } from "@/lib/lead-discovery/store"
import { PROSPECT_STATUSES, PROSPECT_STATUS_LABEL, type Prospect, type ProspectStatus } from "@/lib/lead-discovery/types"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const SIGNAL_LABEL: Record<Prospect["signalKind"], string> = {
  funding: "Recently funded",
  hiring: "Hiring engineers",
  launch: "Launch / integration",
  growth: "Growing",
  workflow: "Manual workflow",
}

/** Status buttons shown on each card (the current status is shown, not offered). */
const ACTIONS: { status: ProspectStatus; label: string }[] = [
  { status: "approved", label: "Approve" },
  { status: "rejected", label: "Reject" },
  { status: "contacted", label: "Contacted" },
  { status: "replied", label: "Replied" },
  { status: "follow_up_due", label: "Follow-up due" },
  { status: "won", label: "Won" },
  { status: "new", label: "Back to new" },
]

function scoreTone(score: number) {
  if (score >= 85) return "bg-emerald-600 text-white"
  if (score >= 75) return "bg-emerald-50 text-emerald-800 border border-emerald-200"
  return "bg-amber-50 text-amber-800 border border-amber-200"
}

function statusTone(status: ProspectStatus) {
  switch (status) {
    case "won":
      return "bg-emerald-50 text-emerald-700"
    case "replied":
    case "approved":
      return "bg-blue-50 text-blue-700"
    case "contacted":
      return "bg-indigo-50 text-indigo-700"
    case "follow_up_due":
      return "bg-amber-50 text-amber-700"
    case "rejected":
      return "bg-rose-50 text-rose-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function safeDate(value: string, pattern: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : format(date, pattern)
}

export default async function AdminProspectsPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const params = await searchParams
  const status = PROSPECT_STATUSES.includes(params?.status as ProspectStatus) ? (params?.status as ProspectStatus) : null

  const [loaded, counts, runs] = await Promise.all([
    listProspects(status).then(
      (value) => ({ value, failed: false }),
      (error) => {
        console.error("Prospects: could not load", error)
        return { value: [] as Prospect[], failed: true }
      },
    ),
    countProspectsByStatus().catch(() => null),
    listRuns(3).catch(() => [] as RunRow[]),
  ])
  const prospects = loaded.value
  const loadError = loaded.failed ? "Prospects could not be loaded. Check that the lead-discovery migration is applied." : null
  const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : prospects.length
  const ready = groqConfigured()

  return (
    <div className="space-y-6">
      <AdminLeadsTabs active="prospects" prospectCount={total} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Prospects"
          title="High-intent companies found from public buying signals."
          description={`Every weekday morning the pipeline reads 30–50 fresh public signals (funding, launches, hiring), skips companies we already know, and saves at most five that score ${QUALIFY_THRESHOLD}/100 or more. Nothing is ever emailed automatically: review the draft, then Write Email.`}
        />
        <AdminProspectsRunButton disabled={!ready} disabledReason="Add GROQ_API_KEY in Vercel first" />
      </div>

      {!ready ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Discovery is installed but cannot qualify candidates yet: add a <strong>GROQ_API_KEY</strong> environment variable in Vercel (Production and Preview), then redeploy. See docs/LEAD-DISCOVERY.md.
        </div>
      ) : null}
      {loadError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div> : null}

      <LastRuns runs={runs} model={ready ? groqModel() : null} />

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <FilterChip href="/admin/leads/prospects" active={!status} label="All" count={total} />
        {PROSPECT_STATUSES.map((value) => (
          <FilterChip key={value} href={`/admin/leads/prospects?status=${value}`} active={status === value} label={PROSPECT_STATUS_LABEL[value]} count={counts?.[value]} />
        ))}
      </nav>

      <div className="grid gap-4">
        {prospects.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
      </div>

      {prospects.length === 0 && !loadError ? (
        <div className={`${adminSurface} p-8 text-center`}>
          <p className="text-lg font-semibold text-slate-950">{status ? `No ${PROSPECT_STATUS_LABEL[status].toLowerCase()} prospects.` : "No prospects yet."}</p>
          <p className="mt-2 text-sm text-slate-600">
            {status ? "Pick another status above." : "The first weekday run adds them automatically, or use Run discovery now. Days with no strong signal save nothing, by design."}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active ? "bg-slate-950 text-white" : "border border-[rgba(10,19,23,0.1)] bg-white text-slate-600 hover:text-slate-950",
      )}
    >
      {label}
      {typeof count === "number" ? <span className={active ? "text-white/70" : "text-slate-400"}>{count}</span> : null}
    </Link>
  )
}

function LastRuns({ runs, model }: { runs: RunRow[]; model: string | null }) {
  if (!runs.length) {
    return (
      <p className={`${adminSurfaceSoft} px-4 py-3 text-sm text-slate-600`}>
        No discovery run yet. Schedule: weekdays at 03:00 UTC (08:30 IST){model ? ` · model ${model}` : ""}.
      </p>
    )
  }
  return (
    <details className={`${adminSurfaceSoft} px-4 py-3 text-sm text-slate-700`}>
      <summary className="cursor-pointer list-none">
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <CalendarClock className="h-4 w-4 text-blue-700" aria-hidden="true" />
          <span className="font-semibold text-slate-950">Last run {formatDistanceToNowStrict(new Date(runs[0].started_at), { addSuffix: true })}</span>
          <span>· {runs[0].trigger === "cron" ? "scheduled" : "manual"}</span>
          <span>· {runs[0].status === "done" ? `${runs[0].summary.candidates ?? 0} checked, ${runs[0].summary.qualified ?? 0} qualified, ${runs[0].summary.inserted ?? 0} saved` : runs[0].status}</span>
          <span className="text-slate-500">· weekdays 03:00 UTC (08:30 IST){model ? ` · ${model}` : ""}</span>
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        {runs.map((run) => (
          <div key={run.id} className="rounded-xl border border-[rgba(10,19,23,0.08)] bg-white p-3">
            <p className="font-semibold text-slate-900">
              {safeDate(run.started_at, "MMM d, yyyy h:mm a")} · {run.trigger} · {run.status}
              {run.summary.durationMs ? ` · ${Math.round(run.summary.durationMs / 1000)} s` : ""}
            </p>
            {run.error ? <p className="mt-1 text-xs text-rose-600">{run.error}</p> : null}
            {run.status === "done" ? (
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {run.summary.candidates ?? 0} candidates · {run.summary.deduplicated ?? 0} already known · {run.summary.noWebsite ?? 0} without a findable website · {run.summary.enriched ?? 0} researched · {run.summary.qualified ?? 0} qualified · {run.summary.inserted ?? 0} saved
                {run.summary.notScoredInTime ? ` · ${run.summary.notScoredInTime} not scored in time` : ""}
              </p>
            ) : null}
            {run.summary.sources ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Sources: {Object.entries(run.summary.sources).map(([id, count]) => `${id} ${count}${run.summary.sourceErrors?.[id] ? " (error)" : ""}`).join(" · ")}
              </p>
            ) : null}
            {run.summary.rejections?.length ? (
              <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
                {run.summary.rejections.slice(0, 8).map((rejection, index) => (
                  <li key={`${rejection.company}-${index}`}>
                    <span className="font-medium text-slate-700">{rejection.company}</span>: {rejection.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-1.5 break-words text-sm font-medium leading-5 text-slate-800">{children}</div>
    </div>
  )
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const breakdown = prospect.scoreBreakdown
  return (
    <article className={`${adminSurface} p-4 sm:p-5`}>
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${scoreTone(prospect.score)}`} title="Weighted score out of 100">
              {prospect.score}/100
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(prospect.status)}`}>{PROSPECT_STATUS_LABEL[prospect.status]}</span>
            <span className={adminInfoChip}>{SIGNAL_LABEL[prospect.signalKind]}</span>
            <span className={adminInfoChip}>Confidence: {prospect.confidence}</span>
            <span className={adminInfoChip}>Signal {safeDate(prospect.signalDate, "MMM d, yyyy")}</span>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">{prospect.company}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-700">{prospect.signalSummary}</p>
          </div>

          <div className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <Info label="Website">
              <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-blue-700 hover:underline">
                <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {prospect.domain}
              </a>
            </Info>
            <Info label="Evidence">
              <a href={prospect.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-blue-700 hover:underline">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {(() => {
                  try {
                    return new URL(prospect.evidenceUrl).hostname.replace(/^www\./, "")
                  } catch {
                    return prospect.evidenceUrl
                  }
                })()}
              </a>
            </Info>
            <Info label="Decision-maker">
              {prospect.decisionMakerName ? `${prospect.decisionMakerName}${prospect.decisionMakerRole ? `, ${prospect.decisionMakerRole}` : ""}` : "Not named in public sources"}
            </Info>
            <Info label="Contact route">{prospect.contactRoute || "Website"}</Info>
            <Info label="Public email">
              {prospect.contactEmail ? (
                <span className="inline-flex items-center gap-1 break-all">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {prospect.contactEmail}
                </span>
              ) : (
                "None found on official pages"
              )}
            </Info>
            <Info label="Industry · location">{[prospect.industry, prospect.location].filter(Boolean).join(" · ") || "Not stated"}</Info>
          </div>

          <div className={adminSurfaceSoft}>
            <div className="space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Potential need</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">{prospect.potentialNeed}</p>
              </div>
              {prospect.serviceFit.length ? (
                <div className="flex flex-wrap gap-2">
                  {prospect.serviceFit.map((service) => (
                    <span key={service} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {service}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {breakdown ? (
            <details className="rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white p-4 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-950">Score breakdown</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[22rem] text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1.5 pr-3 font-semibold">Dimension</th>
                      <th className="py-1.5 pr-3 font-semibold">Weight</th>
                      <th className="py-1.5 pr-3 font-semibold">Sub-score</th>
                      <th className="py-1.5 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {([
                      ["pain", "Business pain / opportunity"],
                      ["fit", "Service fit"],
                      ["timing", "Buying timing"],
                      ["contact", "Decision-maker & contact"],
                      ["evidence", "Evidence quality & recency"],
                    ] as const).map(([key, label]) => (
                      <tr key={key} className="border-t border-slate-100">
                        <td className="py-1.5 pr-3">{label}</td>
                        <td className="py-1.5 pr-3">{WEIGHTS[key]}%</td>
                        <td className="py-1.5 pr-3">{breakdown[key]}/10</td>
                        <td className="py-1.5">{breakdown.points[key]}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-semibold">
                      <td className="py-1.5 pr-3" colSpan={3}>Total</td>
                      <td className="py-1.5">{breakdown.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {breakdown.rationale ? <p className="mt-3 leading-6">{breakdown.rationale}</p> : null}
              {breakdown.adjustments.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
                  {breakdown.adjustments.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </details>
          ) : null}

          <details className="rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white p-4 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-950">Draft email</summary>
            <p className="mt-3 font-semibold text-slate-900">{prospect.draftSubject}</p>
            <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">{prospect.draftBody}</p>
          </details>
        </div>

        <div className={`${adminSurfaceSoft} self-start space-y-4 p-4`}>
          <Link href={`/admin/email?prospectId=${prospect.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0064e0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0457cb]">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Write Email
          </Link>
          <p className={adminHint}>
            Opens the Email page with {prospect.contactEmail ? "the public address," : "no recipient (none was found publicly),"} subject and draft filled in. Nothing is sent until you press Send; sending marks this prospect Contacted.
          </p>

          <div>
            <p className="text-sm font-medium text-slate-700">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIONS.filter((action) => action.status !== prospect.status).map((action) => (
                <form key={action.status} action={setProspectStatusAction}>
                  <input type="hidden" name="id" value={prospect.id} />
                  <input type="hidden" name="status" value={action.status} />
                  <button
                    type="submit"
                    className={cn(
                      adminGhostButton,
                      "px-3 py-1.5 text-xs",
                      action.status === "rejected" && "border-rose-200 text-rose-700 hover:border-rose-400 hover:text-rose-800",
                      action.status === "approved" && "border-emerald-200 text-emerald-700 hover:border-emerald-500 hover:text-emerald-800",
                    )}
                  >
                    {action.label}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <form action={saveProspectNotesAction} className="space-y-2">
            <input type="hidden" name="id" value={prospect.id} />
            <label className="grid gap-2 text-sm">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea name="notes" defaultValue={prospect.notes ?? ""} rows={4} maxLength={5000} className={adminTextareaClassName("min-h-24")} placeholder="Follow-up dates, replies, context" />
            </label>
            <button type="submit" className="w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Save notes
            </button>
          </form>

          <p className="text-xs text-slate-500">
            Found {safeDate(prospect.createdAt, "MMM d, yyyy")} via {prospect.source}
            {prospect.contactedAt ? ` · contacted ${safeDate(prospect.contactedAt, "MMM d, yyyy")}` : ""}
          </p>
        </div>
      </div>
    </article>
  )
}
