import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { LayoutDashboard, FileText, MessageSquare, FolderKanban } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { getDashboardMetrics } from "@/lib/cms"

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  const cards = [
    { label: "Blogs", value: metrics.blogs, icon: FileText, href: "/admin/blogs" },
    { label: "Projects", value: metrics.projects, icon: FolderKanban, href: "/admin/projects" },
    { label: "Messages", value: metrics.messages, icon: MessageSquare, href: "/admin/dashboard" },
    { label: "Activity", value: metrics.activity.length, icon: LayoutDashboard, href: "/admin/dashboard" },
  ]

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Dashboard"
        title="A straightforward operational view for content, projects, and incoming inquiries."
        description="The first phase keeps the dashboard compact so the numbers and activity stream are easy to scan."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{card.label}</p>
                <Icon className="h-5 w-5 text-blue-300" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Content health</p>
          <h2 className="mt-4 text-xl font-semibold text-white">What is live</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Homepage CMS</span>
              <span className="text-emerald-300">Configured</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Blog workflow</span>
              <span className="text-emerald-300">Ready</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Project management</span>
              <span className="text-emerald-300">Ready</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <span>Media library</span>
              <span className="text-emerald-300">Ready</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Recent activity</p>
          <h2 className="mt-4 text-xl font-semibold text-white">Latest actions</h2>
          <div className="mt-5 space-y-4">
            {metrics.activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
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
