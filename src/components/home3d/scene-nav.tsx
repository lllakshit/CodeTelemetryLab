"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Handshake, House, Layers, LayoutGrid, FolderKanban, X } from "lucide-react"
import { siteNav } from "@/lib/navigation"

/** In-page navigation for the home page: dots on desktop, a bottom dock plus sheet on phones and tablets. */

type Section = { id: string; label: string }

/** Every anchor on the page, top to bottom (the notes section is added only when the page has it). */
const ALL: Section[] = [
  { id: "hero", label: "Overview" },
  { id: "who", label: "Who we help" },
  { id: "services", label: "Services" },
  { id: "process", label: "Process" },
  { id: "tech", label: "Technologies" },
  { id: "work", label: "Work" },
  { id: "why", label: "Why teams work with us" },
  { id: "faq", label: "Questions" },
  { id: "contact", label: "Contact" },
  { id: "notes", label: "Notes" },
]

/** The six stops shown as desktop dots. Each owns the neighbouring sections that share its 3D scene. */
const STOPS: Array<Section & { owns: string[] }> = [
  { id: "hero", label: "Overview", owns: ["hero", "who"] },
  { id: "services", label: "Services", owns: ["services"] },
  { id: "process", label: "Process", owns: ["process", "tech"] },
  { id: "work", label: "Work", owns: ["work"] },
  { id: "why", label: "Delivery", owns: ["why", "faq"] },
  { id: "contact", label: "Contact", owns: ["contact", "notes"] },
]

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(",")
  useEffect(() => {
    const ids = key.split(",")
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    if (!els.length || typeof IntersectionObserver === "undefined") return
    const visible = new Set<string>()
    // A thin band across the middle of the screen: the section crossing it is the one being read.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const current = ids.filter((id) => visible.has(id)).pop()
        if (current) setActive(current)
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
  return active
}

export function SceneNav({ hasNotes }: { hasNotes: boolean }) {
  const sections = useMemo(() => (hasNotes ? ALL : ALL.filter((s) => s.id !== "notes")), [hasNotes])
  const ids = useMemo(() => sections.map((s) => s.id), [sections])
  const active = useActiveSection(ids)
  const [sheet, setSheet] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const owner = STOPS.find((s) => s.owns.includes(active))?.id ?? "hero"
  const moreActive = ["process", "tech", "why", "faq", "contact", "notes"].includes(active)

  const closeSheet = useCallback(() => setSheet(false), [])
  const openSheet = () => {
    opener.current = document.activeElement as HTMLElement | null
    setSheet(true)
  }

  useEffect(() => {
    if (!sheet) {
      opener.current?.focus?.()
      return
    }
    const el = sheetRef.current
    el?.focus({ preventScroll: true })
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(false)
      if (e.key !== "Tab" || !el) return
      const focusable = el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      root.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [sheet])

  return (
    <>
      <nav className="h3d-hud" aria-label="Sections on this page">
        {STOPS.map((stop) => (
          <a key={stop.id} href={`#${stop.id}`} aria-current={owner === stop.id ? "true" : undefined}>
            <span>{stop.label}</span>
            <i aria-hidden="true" />
          </a>
        ))}
      </nav>

      <div className="h3d-dock-wrap">
        <nav className="h3d-dock" aria-label="Quick navigation">
          <a href="#hero" aria-current={owner === "hero" ? "true" : undefined}>
            <House aria-hidden="true" />
            Overview
          </a>
          <a href="#services" aria-current={owner === "services" ? "true" : undefined}>
            <Layers aria-hidden="true" />
            Services
          </a>
          <Link href="/contact" className="brief">
            <span className="orb">
              <Handshake aria-hidden="true" />
            </span>
            Brief
          </Link>
          <a href="#work" aria-current={owner === "work" ? "true" : undefined}>
            <FolderKanban aria-hidden="true" />
            Work
          </a>
          <button
            type="button"
            onClick={openSheet}
            aria-haspopup="dialog"
            aria-current={moreActive ? "true" : undefined}
            style={moreActive ? { color: "var(--blue)", background: "var(--blue-lt)" } : undefined}
          >
            <LayoutGrid aria-hidden="true" />
            More
          </button>
        </nav>

        {sheet ? (
          <>
            <div className="h3d-sheet-backdrop" onClick={closeSheet} aria-hidden="true" />
            <div ref={sheetRef} className="h3d-sheet" role="dialog" aria-modal="true" aria-label="Jump to a section or page" tabIndex={-1}>
              <span className="h3d-sheet-handle" aria-hidden="true" />
              <button type="button" className="x" onClick={closeSheet} aria-label="Close">
                <X width={20} height={20} aria-hidden="true" />
              </button>
              <h2>Jump to</h2>
              <p className="grp">On this page</p>
              <div className="grid">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} onClick={closeSheet} aria-current={active === s.id ? "true" : undefined}>
                    {s.label}
                  </a>
                ))}
              </div>
              <p className="grp">Pages</p>
              <div className="grid">
                {siteNav.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeSheet}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
