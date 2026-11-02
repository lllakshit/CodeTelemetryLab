import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import {
  adminAccentButton,
  adminFieldLabel,
  adminInputClassName,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import { applicationStatuses, applicationStatusStyles, getApplication } from "@/lib/applications"
import { findJourneySessionId } from "@/lib/journeys"
import { cn } from "@/lib/utils"
import { updateApplicationAction } from "../actions"

export const dynamic = "force-dynamic"

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  )
}

export default async function AdminApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ saved?: string }>
}) {
  const { id } = await params
  const application = await getApplication(id)
  if (!application) notFound()

  const saved = (await searchParams)?.saved === "1"
  const journeyId = await findJourneySessionId(application.sessionKey)

  return (
    <div className="space-y-6">
      <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        All applications
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Application" title={application.fullName} description={`Applied for ${application.jobTitle} on ${format(new Date(application.createdAt), "MMMM d, yyyy 'at' h:mm a")}.`} />
        <span className={cn("inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold capitalize", applicationStatusStyles[application.status])}>
          {application.status}
        </span>
      </div>

      {saved ? (
        <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Saved.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={`${adminSurface} p-6`}>
            <h2 className="text-lg font-semibold text-slate-950">Candidate</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Detail label="Email" value={application.email} />
              <Detail label="Phone" value={application.phone} />
              <Detail label="Location" value={application.location} />
              <Detail label="Current company" value={application.currentCompany} />
              <Detail label="Experience" value={application.yearsExperience} />
              <Detail label="Notice period" value={application.noticePeriod} />
              <Detail label="Expected compensation" value={application.expectedCompensation} />
              <Detail label="Role applied for" value={application.jobTitle} />
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {application.resumePath ? (
                <a href={`/api/admin/applications/${application.id}/resume`} className={`${adminAccentButton} gap-2`}>
                  <Download className="h-4 w-4" />
                  Open résumé{application.resumeFilename ? ` (${application.resumeFilename})` : ""}
                </a>
              ) : null}
              {application.linkedinUrl ? (
                <a href={application.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {application.portfolioUrl ? (
                <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Portfolio <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </section>

          <section className={`${adminSurface} p-6`}>
            <h2 className="text-lg font-semibold text-slate-950">Cover note</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {application.coverNote || "No note provided."}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <form action={updateApplicationAction} className={`${adminSurface} grid gap-4 p-6`}>
            <h2 className="text-lg font-semibold text-slate-950">Review</h2>
            <input type="hidden" name="id" value={application.id} />
            <label className="grid gap-2 text-sm">
              <span className={adminFieldLabel}>Status</span>
              <select name="status" defaultValue={application.status} className={adminInputClassName()}>
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className={adminFieldLabel}>Internal notes</span>
              <textarea name="notes" defaultValue={application.notes ?? ""} maxLength={4000} className={adminTextareaClassName()} placeholder="Interview feedback, next steps…" />
            </label>
            <button type="submit" className={adminAccentButton}>
              Save review
            </button>
          </form>

          <section className={`${adminSurfaceSoft} p-5 text-sm`}>
            <h2 className="text-base font-semibold text-slate-950">How they found us</h2>
            <dl className="mt-4 space-y-3">
              <Detail label="Source" value={application.utmSource} />
              <Detail label="Campaign" value={application.utmCampaign} />
              <Detail label="Referrer" value={application.referrer} />
            </dl>
            {journeyId ? (
              <Link href={`/admin/journeys/${journeyId}`} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
                See this visitor&apos;s full journey →
              </Link>
            ) : (
              <p className="mt-4 text-xs text-slate-500">No journey linked (the visitor did not accept analytics cookies).</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
