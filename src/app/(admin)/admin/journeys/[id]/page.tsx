import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, FileText, LogOut, MousePointerClick, Navigation, ScrollText, ExternalLink, Eye } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { adminSurface, adminSurfaceSoft } from "@/lib/admin-ui"
import { formatDuration, getJourneySession, sessionSource, type JourneyEvent } from "@/lib/journeys"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const eventMeta: Record<string, { label: string; icon: typeof Eye; tone: string }> = {
  pageview: { label: "Viewed page", icon: Eye, tone: "bg-blue-50 text-blue-700" },
  click: { label: "Clicked", icon: MousePointerClick, tone: "bg-slate-100 text-slate-700" },
  outbound: { label: "Left via link", icon: ExternalLink, tone: "bg-amber-50 text-amber-700" },
  form_start: { label: "Started a form", icon: FileText, tone: "bg-violet-50 text-violet-700" },
  form_submit: { label: "Submitted a form", icon: FileText, tone: "bg-emerald-50 text-emerald-700" },
  scroll: { label: "Scrolled", icon: ScrollText, tone: "bg-slate-100 text-slate-600" },
  exit: { label: "Left the page", icon: LogOut, tone: "bg-rose-50 text-rose-700" },
}

function describe(event: JourneyEvent) {
  switch (event.type) {
    case "pageview":
      return event.meta.status === 404 ? `${event.path} (404 page not found)` : (event.path ?? "")
    case "click":
    case "outbound":
      return `“${event.target ?? "link"}”${event.href ? ` → ${event.href}` : ""}`
    case "form_start":
    case "form_submit":
      return `${event.target ?? "form"} on ${event.path}`
    case "scroll":
      return `${event.scrollDepth}% of ${event.path}`
    case "exit":
      return `${event.path} after ${formatDuration(Math.round((event.durationMs ?? 0) / 1000))}, scrolled ${event.scrollDepth ?? 0}%`
    default:
      return event.path ?? ""
  }
}

export default async function AdminJourneyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getJourneySession(id)
  if (!result) notFound()

  const { session, events, visitorSessionCount } = result
  const startedAt = new Date(session.startedAt).getTime()

  const pageviews = events.filter((event) => event.type === "pageview")
  const exitEvents = events.filter((event) => event.type === "exit")
  const flow = pageviews.map((view, index) => {
    const next = pageviews[index + 1]
    const lastExit = [...exitEvents].reverse().find((event) => event.path === view.path)
    const ms = next
      ? (next.meta.previousDurationMs as number | undefined)
      : (lastExit?.durationMs ?? undefined)
    return { path: view.path ?? "", seconds: typeof ms === "number" ? Math.round(ms / 1000) : null, notFound: view.meta.status === 404 }
  })

  return (
    <div className="space-y-6">
      <Link href="/admin/journeys" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        All journeys
      </Link>

      <SectionHeading
        eyebrow="Customer Journey"
        title={`${session.entryPath ?? "Unknown page"} → ${session.exitPath ?? "unknown"}`}
        description={`Visit started ${format(new Date(session.startedAt), "MMMM d, yyyy 'at' h:mm a")}. ${session.converted ? `Converted: ${session.conversionType === "job-application" ? "submitted a job application" : "sent a contact brief"}.` : "No conversion in this visit."}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pages viewed", value: String(session.pageCount) },
          { label: "Actions logged", value: String(session.eventCount) },
          { label: "Visit length", value: formatDuration(session.durationSeconds) },
          { label: "Visits by this visitor", value: String(visitorSessionCount) },
        ].map((card) => (
          <div key={card.label} className={`${adminSurface} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className={`${adminSurface} p-6`}>
          <h2 className="text-lg font-semibold text-slate-950">Activity timeline</h2>
          <ol className="mt-5 space-y-1">
            {events.map((event) => {
              const meta = eventMeta[event.type] ?? eventMeta.click
              const Icon = meta.icon
              const offset = Math.max(0, Math.round((new Date(event.occurredAt).getTime() - startedAt) / 1000))
              return (
                <li key={event.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                  <span className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                    <p className="break-words text-sm text-slate-600">{describe(event)}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-slate-400" title={format(new Date(event.occurredAt), "h:mm:ss a")}>
                    +{formatDuration(offset)}
                  </span>
                </li>
              )
            })}
            {!events.length ? <li className="text-sm text-slate-500">No activity recorded.</li> : null}
          </ol>
        </section>

        <div className="space-y-6">
          <section className={`${adminSurface} p-6`}>
            <h2 className="text-lg font-semibold text-slate-950">Page flow</h2>
            <ol className="mt-4 space-y-2 text-sm">
              {flow.map((step, index) => (
                <li key={`${step.path}-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-semibold text-slate-400">{index + 1}</span>
                  <span className="min-w-0 flex-1 break-words text-slate-800">
                    {step.path}
                    {step.notFound ? <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-700">404</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{step.seconds === null ? "" : formatDuration(step.seconds)}</span>
                  {index < flow.length - 1 ? null : <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-label="Exit page" />}
                </li>
              ))}
              {!flow.length ? <li className="text-slate-500">No page views recorded.</li> : null}
            </ol>
          </section>

          <section className={`${adminSurfaceSoft} p-5 text-sm`}>
            <h2 className="text-base font-semibold text-slate-950">Visitor</h2>
            <dl className="mt-4 space-y-3 text-slate-700">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Visitor ID</dt>
                <dd className="font-mono text-xs">{session.visitorId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Location</dt>
                <dd>{[session.city, session.region, session.country].filter(Boolean).join(", ") || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Device</dt>
                <dd>{[session.deviceType, session.browser, session.os].filter(Boolean).join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Source</dt>
                <dd>
                  {sessionSource(session)}
                  {session.utmCampaign ? ` · ${session.utmCampaign}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Referrer</dt>
                <dd className="break-all">{session.referrer || "None (direct visit)"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Returning visitor</dt>
                <dd>{session.isReturning ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
