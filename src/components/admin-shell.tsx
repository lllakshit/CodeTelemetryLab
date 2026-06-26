"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { ExternalLink, LogOut, Menu, ShieldCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNav } from "@/lib/navigation"
import { useState } from "react"
import { DesignMark } from "@/components/design-mark"

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,100,224,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(0,163,255,0.1),transparent_22%),linear-gradient(180deg,#fbfdff_0%,#f4f7fb_56%,#eef2f7_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-[rgba(10,19,23,0.08)] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <DesignMark
              className="text-slate-950"
              labelClassName="hidden sm:inline-flex flex-col leading-none"
            />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Protected access
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(10,19,23,0.1)] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              View site
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(10,19,23,0.1)] bg-white md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle admin navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="border-t border-[rgba(10,19,23,0.06)] md:hidden">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
            <nav className="flex min-w-max gap-2">
              {adminNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-slate-950 text-white"
                        : "border border-[rgba(10,19,23,0.1)] bg-white text-slate-600",
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[96rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden self-start rounded-3xl border border-[rgba(10,19,23,0.08)] bg-white/92 p-4 shadow-[0_14px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:block lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[rgba(10,19,23,0.08)] bg-[linear-gradient(180deg,#f9fbff,#f3f7fb)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Operations</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Management workspace</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Update public content, review assets, and keep the site ready for client-facing delivery.
            </p>
          </div>
          <nav className="mt-5 space-y-2">
            {adminNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-5 rounded-2xl border border-[rgba(10,19,23,0.08)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm text-slate-700">Admin system online and ready for content updates.</p>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {mobileOpen ? (
            <div className="rounded-3xl border border-[rgba(10,19,23,0.08)] bg-white/92 p-4 shadow-[0_14px_44px_rgba(15,23,42,0.06)] lg:hidden">
              <div className="mb-4 rounded-2xl border border-[rgba(10,19,23,0.08)] bg-[linear-gradient(180deg,#f9fbff,#f3f7fb)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Admin menu</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Everything you need to manage content from mobile.</p>
              </div>
              <nav className="space-y-2">
                {adminNav.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                        active
                          ? "bg-slate-950 text-white"
                          : "border border-[rgba(10,19,23,0.08)] bg-slate-50 text-slate-700",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(10,19,23,0.1)] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setMobileOpen(false)}
                >
                  View site
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
