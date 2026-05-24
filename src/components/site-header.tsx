"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { siteNav } from "@/lib/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0B1020]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            CT
          </span>
          <div>
            <p className="text-sm font-medium tracking-[0.24em] text-slate-300 uppercase">
              CodeTelemetryLabs
            </p>
            <p className="text-xs text-slate-500">Software engineering studio</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {siteNav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  active ? "text-white" : "text-slate-300",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-blue-400/30 bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-cyan-500"
          >
            Start a project
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/8 bg-[#0B1020]/95 px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {siteNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/15 hover:bg-white/6"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="rounded-2xl bg-blue-500 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Start a project
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
