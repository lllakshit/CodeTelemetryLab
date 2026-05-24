"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, Menu, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNav } from "@/lib/navigation"
import { useState } from "react"

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,#0b1020,#0a1020)] text-white">
      <div className="border-b border-white/8 bg-[#0b1020]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold">
              CT
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] uppercase">CodeTelemetryLabs</p>
              <p className="text-xs text-slate-500">Admin console</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Protected access
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/8"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle admin navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 lg:block">
          <nav className="space-y-2">
            {adminNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-blue-500/15 text-white ring-1 ring-blue-400/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          {mobileOpen ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 lg:hidden">
              <nav className="space-y-2">
                {adminNav.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                        active
                          ? "bg-blue-500/15 text-white ring-1 ring-blue-400/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
