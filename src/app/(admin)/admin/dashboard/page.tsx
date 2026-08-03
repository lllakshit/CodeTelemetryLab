import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ArrowRight, FileText, FolderKanban, LayoutDashboard, UserRoundCheck } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { adminAccentButton, adminGhostButton, adminInfoChip, adminSurface, adminSurfaceSoft } from "@/lib/admin-ui"
import { getDashboardMetrics } from "@/lib/cms"

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  const cards = [
    { label: "Leads", value: metrics.leads, icon: UserRoundCheck, href: "/admin/leads" },
    { label: "Blogs", value: metrics.blogs, icon: FileText, href: "/admin/blogs" },
    { label: "Projects", value: metrics.projects, icon: FolderKanban, href: "/admin/projects" },
    { label: "Activity", value: metrics.activity.length, icon: LayoutDashboard, href: "/admin/dashboard" },
  ]

  return (
    <div className="space-y-8">
      <div className={`${adminSurface} grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]`}>
        <SectionHeading
          eyebrow="Dashboard"
          title="A clear operational view for content, projects, and incoming inquiries."
          description="The admin area now follows the same light, structured visual system as the public website while keeping the management workflow fast to scan."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${adminSurfaceSoft} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Focus today</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review new messages, keep portfolio entries current, and make sure the homepage narrative matches the current offer.
            </p>
          </div>
          <div className={`${adminSurfaceSoft} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Quick actions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/admin/email" className={adminAccentButton}>Compose email</Link>
              <Link href="/admin/blogs/new" className={adminGhostButton}>New blog</Link>
              <Link href="/admin/projects/new" className={adminGhostButton}>New project</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} className={`${adminSurface} p-5 transition hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                Open section
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={`${adminSurface} p-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Content health</p>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">What is live</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-4 py-3">
              <span>Homepage CMS</span>
              <span className={adminInfoChip}>Configured</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-4 py-3">
              <span>Blog workflow</span>
              <span className={adminInfoChip}>Ready</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-4 py-3">
              <span>Project management</span>
              <span className={adminInfoChip}>Ready</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] px-4 py-3">
              <span>Media library</span>
              <span className={adminInfoChip}>Ready</span>
            </div>
          </div>
        </section>

        <section className={`${adminSurface} p-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Recent activity</p>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Latest actions</h2>
          <div className="mt-5 space-y-4">
            {metrics.activity.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
