"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { siteNav } from "@/lib/navigation"
import { DesignMark } from "@/components/design-mark"
import "./site-chrome.css"

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sh sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="CodeTelemetryLab home">
          <DesignMark priority labelClassName="hidden sm:inline-flex flex-col leading-none" />
        </Link>

        <nav className="sh-nav hidden items-center gap-1 lg:flex" aria-label="Primary">
          {siteNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sh-link"
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="sh-cta"
          >
            Send a brief
          </Link>
        </div>

        <button
          type="button"
          className="sh-burger lg:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="sh-menu lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {siteNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="sh-mlink"
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="sh-cta"
              onClick={() => setOpen(false)}
            >
              Send a brief
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
