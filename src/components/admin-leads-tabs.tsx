import Link from "next/link"
import { cn } from "@/lib/utils"

/** Switches between inbound leads (contact form) and discovered prospects. */
export function AdminLeadsTabs({ active, prospectCount }: { active: "inbound" | "prospects"; prospectCount?: number }) {
  const tabs = [
    { key: "inbound", href: "/admin/leads", label: "Inbound leads" },
    { key: "prospects", href: "/admin/leads/prospects", label: "Prospects", count: prospectCount },
  ] as const
  return (
    <nav aria-label="Lead views" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-[rgba(10,19,23,0.1)] bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
            active === tab.key ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950",
          )}
        >
          {tab.label}
          {"count" in tab && typeof tab.count === "number" ? (
            <span className={cn("rounded-full px-2 py-0.5 text-xs", active === tab.key ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600")}>{tab.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}
