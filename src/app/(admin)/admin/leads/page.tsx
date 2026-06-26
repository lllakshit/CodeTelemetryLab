import Link from "next/link"
import { format } from "date-fns"
import { Download, Search, Trash2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { deleteLeadAction, updateLeadAction } from "@/app/(admin)/admin/actions"
import {
  adminAccentButton,
  adminDangerButton,
  adminFieldLabel,
  adminGhostButton,
  adminInputClassName,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import { listLeads } from "@/lib/cms"
import { leadStatuses } from "@/lib/store"

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string
    status?: string
    service?: string
    from?: string
    to?: string
  }>
}) {
  const filters = await searchParams
  const leads = await listLeads(filters)
  const allLeads = await listLeads()
  const services = Array.from(new Set(allLeads.map((lead) => lead.serviceInterestedIn))).sort()
  const exportParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value) exportParams.set(key, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Leads"
          title="Manage every inquiry from first contact to proposal outcome."
          description="Public form submissions are stored as leads first, with email notifications acting as a backup signal."
        />
        <Link href={`/api/leads/export?${exportParams.toString()}`} className={`${adminGhostButton} gap-2`}>
          <Download className="h-4 w-4" />
          Export CSV
        </Link>
      </div>

      <form action="/admin/leads" className={`${adminSurface} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.75fr)_minmax(10rem,0.9fr)_minmax(9rem,0.7fr)_minmax(9rem,0.7fr)_auto]`}>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Search</span>
          <input name="search" defaultValue={filters?.search ?? ""} className={adminInputClassName()} placeholder="Name, company, email" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Status</span>
          <select name="status" defaultValue={filters?.status ?? ""} className={adminInputClassName()}>
            <option value="">All statuses</option>
            {leadStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Service</span>
          <select name="service" defaultValue={filters?.service ?? ""} className={adminInputClassName()}>
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>From</span>
          <input type="date" name="from" defaultValue={filters?.from ?? ""} className={adminInputClassName()} />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>To</span>
          <input type="date" name="to" defaultValue={filters?.to ?? ""} className={adminInputClassName()} />
        </label>
        <button type="submit" className={`${adminAccentButton} mt-auto h-11 gap-2 px-4`}>
          <Search className="h-4 w-4" />
          Filter
        </button>
      </form>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <article key={lead.id} className={`${adminSurface} p-4 sm:p-5`}>
            <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{lead.serviceInterestedIn}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{lead.status}</span>
                  <span className="rounded-full border border-[rgba(10,19,23,0.08)] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">{lead.fullName}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{lead.subject || "Project inquiry"}</p>
                </div>

                <div className="grid min-w-0 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <Info label="Email" value={lead.email} compact />
                  <Info label="Company" value={lead.companyName} />
                  <Info label="Phone" value={lead.phone} />
                  <Info label="Country" value={lead.country} />
                  <Info label="Budget" value={lead.budget} />
                  <Info label="Timeline" value={lead.timeline} />
                  <Info label="Contact method" value={lead.preferredContactMethod} />
                  <Info label="Website" value={lead.websiteUrl} compact />
                  <Info label="Source" value={lead.source} />
                </div>

                <div className={adminSurfaceSoft}>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Message</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.message}</p>
                  </div>
                </div>

                <details className="rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white p-4 text-sm text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-950">Submission metadata</summary>
                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                    <Info label="IP address" value={lead.ipAddress} compact />
                    <Info label="Landing URL" value={lead.referrer} compact />
                    <Info label="UTM source" value={lead.utmSource} />
                    <Info label="UTM medium" value={lead.utmMedium} />
                    <Info label="UTM campaign" value={lead.utmCampaign} />
                    <Info label="UTM term" value={lead.utmTerm} />
                    <Info label="UTM content" value={lead.utmContent} />
                    <Info label="User agent" value={lead.userAgent} compact />
                  </div>
                </details>
              </div>

              <div className={`${adminSurfaceSoft} self-start p-4`}>
                <form action={updateLeadAction} className="space-y-4">
                  <input type="hidden" name="id" value={lead.id} />
                  <label className="grid gap-2 text-sm">
                    <span className={adminFieldLabel}>Status</span>
                    <select name="status" defaultValue={lead.status} className={adminInputClassName()}>
                      {leadStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className={adminFieldLabel}>Assigned team member</span>
                    <input
                      name="assignedTeamMember"
                      defaultValue={lead.assignedTeamMember ?? ""}
                      className={adminInputClassName()}
                      placeholder="Owner name"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className={adminFieldLabel}>Internal notes</span>
                    <textarea
                      name="notes"
                      defaultValue={lead.notes ?? ""}
                      rows={5}
                      className={adminTextareaClassName()}
                      placeholder="Qualification notes, follow-up dates, proposal context"
                    />
                  </label>
                  <button type="submit" className="w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Save lead
                  </button>
                </form>
                <form action={deleteLeadAction} className="mt-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <button type="submit" className={`${adminDangerButton} w-full gap-2`}>
                    <Trash2 className="h-4 w-4" />
                    Delete lead
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className={`${adminSurface} p-8 text-center`}>
          <p className="text-lg font-semibold text-slate-950">No leads match those filters.</p>
          <p className="mt-2 text-sm text-slate-600">Clear the search or widen the date range to see more submissions.</p>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value, compact }: { label: string; value?: string | null; compact?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-1.5 text-sm font-medium leading-5 text-slate-800 ${compact ? "break-all" : "break-words"}`}>
        {value?.trim() || "Not provided"}
      </p>
    </div>
  )
}
