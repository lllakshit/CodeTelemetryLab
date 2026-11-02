import Link from "next/link"
import { format } from "date-fns"
import { SectionHeading } from "@/components/section-heading"
import { adminAccentButton, adminFieldLabel, adminGhostButton, adminInputClassName, adminSurface } from "@/lib/admin-ui"
import { applicationStatuses, applicationStatusStyles, isApplicationStorageReady, listApplications } from "@/lib/applications"
import { GENERAL_APPLICATION, jobOpenings } from "@/lib/careers"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; job?: string; from?: string; to?: string }>
}) {
  const filters = (await searchParams) ?? {}
  const [applications, everything] = await Promise.all([listApplications(filters), listApplications()])
  const counts = applicationStatuses.map((status) => ({
    status,
    count: everything.filter((application) => application.status === status).length,
  }))

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Applications"
        title="Every job application, with the résumé and the visit that led to it."
        description="Applications from the Careers pages arrive here instantly. The résumé stays in private storage and opens through a short-lived link."
      />

      {!isApplicationStorageReady() ? (
        <p className={`${adminSurface} p-4 text-sm text-amber-800`}>
          Supabase is not configured in this environment, so applications cannot be stored or listed.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {counts.map(({ status, count }) => (
          <Link
            key={status}
            href={`/admin/applications?status=${status}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize",
              applicationStatusStyles[status],
            )}
          >
            {status}
            <span className="rounded-full bg-white/70 px-2 py-0.5">{count}</span>
          </Link>
        ))}
      </div>

      <form
        action="/admin/applications"
        className={`${adminSurface} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_1.2fr_0.7fr_0.7fr_auto]`}
      >
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Search</span>
          <input name="search" defaultValue={filters.search ?? ""} className={adminInputClassName()} placeholder="Name, email, company, role" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className={adminInputClassName()}>
            <option value="">All statuses</option>
            {applicationStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className={adminFieldLabel}>Role</span>
          <select name="job" defaultValue={filters.job ?? ""} className={adminInputClassName()}>
            <option value="">All roles</option>
            {[...jobOpenings, GENERAL_APPLICATION].map((job) => (
              <option key={job.slug} value={job.slug}>
                {job.title}
              </option>
            ))}
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
          <Link href="/admin/applications" className={adminGhostButton}>
            Clear
          </Link>
        </div>
      </form>

      <div className={`${adminSurface} overflow-x-auto`}>
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Applied</th>
              <th className="px-5 py-3 font-semibold">Candidate</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold">Experience</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr key={application.id} className="align-top">
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {format(new Date(application.createdAt), "MMM d, yyyy")}
                  <span className="block text-xs text-slate-400">{format(new Date(application.createdAt), "h:mm a")}</span>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-950">{application.fullName}</p>
                  <p className="text-xs text-slate-500">{application.email}</p>
                </td>
                <td className="px-5 py-4 text-slate-700">{application.jobTitle}</td>
                <td className="px-5 py-4 text-slate-600">{application.location ?? "—"}</td>
                <td className="px-5 py-4 text-slate-600">{application.yearsExperience ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize", applicationStatusStyles[application.status])}>
                    {application.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/admin/applications/${application.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {!applications.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                  No applications match these filters yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
