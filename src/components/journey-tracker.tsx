"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useSyncExternalStore } from "react"
import {
  CONSENT_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE_SECONDS,
  parseConsent,
} from "@/lib/consent"

type QueuedEvent = {
  type: "pageview" | "click" | "outbound" | "form_start" | "form_submit" | "scroll" | "exit"
  at: number
  path: string
  title?: string
  target?: string
  href?: string
  durationMs?: number
  scrollDepth?: number
  meta?: Record<string, string | number | boolean>
}

const FLUSH_INTERVAL_MS = 4000
const MAX_QUEUE = 20
const SCROLL_MARKS = [25, 50, 75, 100]

function readCookie(name: string) {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0
        return (char === "x" ? random : (random & 0x3) | 0x8).toString(16)
      })
}

function storage(key: string, value?: string) {
  try {
    if (value !== undefined) window.sessionStorage.setItem(key, value)
    return window.sessionStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}`.slice(0, 500)
}

function formName(form: HTMLFormElement) {
  const action = form.getAttribute("action") ?? ""
  if (action.includes("/api/contact")) return "contact"
  if (action.includes("/api/careers/apply")) return "job-application"
  return (form.dataset.trackForm || form.id || action || "form").slice(0, 80)
}

function subscribeToConsent(notify: () => void) {
  window.addEventListener("ct:consent-changed", notify)
  return () => window.removeEventListener("ct:consent-changed", notify)
}

const readAnalyticsConsent = () => parseConsent(readCookie(CONSENT_COOKIE))?.analytics === true

/**
 * Records an anonymous visitor journey: pages viewed, clicks, form activity, scroll depth,
 * and the page where each visit ends. It stays completely inactive until the visitor accepts analytics cookies.
 */
export function JourneyTracker() {
  const pathname = usePathname()
  const enabled = useSyncExternalStore(subscribeToConsent, readAnalyticsConsent, () => false)

  const queue = useRef<QueuedEvent[]>([])
  const idsRef = useRef<{ visitorId: string; sessionKey: string; isReturning: boolean } | null>(null)
  const pageRef = useRef({ path: "", startedAt: 0, maxScroll: 0, marks: new Set<number>(), exitSent: false })
  const startedForms = useRef(new WeakSet<HTMLFormElement>())

  // Cookies, listeners, and the flush timer exist only while analytics is allowed.
  useEffect(() => {
    if (!enabled) {
      queue.current = []
      idsRef.current = null
      return
    }

    const ensureIds = () => {
      let visitorId = readCookie(VISITOR_COOKIE)
      const isReturning = Boolean(visitorId)
      if (!visitorId) visitorId = newId()
      writeCookie(VISITOR_COOKIE, visitorId, VISITOR_MAX_AGE_SECONDS)

      let sessionKey = readCookie(SESSION_COOKIE)
      if (!sessionKey) {
        sessionKey = newId()
        const params = new URLSearchParams(window.location.search)
        const utm = {
          source: params.get("utm_source") ?? undefined,
          medium: params.get("utm_medium") ?? undefined,
          campaign: params.get("utm_campaign") ?? undefined,
          term: params.get("utm_term") ?? undefined,
          content: params.get("utm_content") ?? undefined,
        }
        storage("ct_utm", JSON.stringify(utm))
        storage("ct_landing", window.location.href.slice(0, 800))
        const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : ""
        storage("ct_ref", ref.slice(0, 800))
      }
      writeCookie(SESSION_COOKIE, sessionKey, SESSION_MAX_AGE_SECONDS)
      idsRef.current = { visitorId, sessionKey, isReturning }
      return idsRef.current
    }

    const flush = (useBeacon: boolean) => {
      if (!queue.current.length) return
      // Re-check the choice every time: a visitor who just withdrew consent must not get cookies re-created.
      if (parseConsent(readCookie(CONSENT_COOKIE))?.analytics !== true) {
        queue.current = []
        return
      }
      const ids = ensureIds()
      const events = queue.current.splice(0, queue.current.length)
      let utm: unknown
      try {
        utm = JSON.parse(storage("ct_utm") ?? "{}")
      } catch {
        utm = undefined
      }
      const body = JSON.stringify({
        sessionKey: ids.sessionKey,
        visitorId: ids.visitorId,
        isReturning: ids.isReturning,
        landingUrl: storage("ct_landing") || undefined,
        referrer: storage("ct_ref") || undefined,
        utm,
        events,
      })

      if (useBeacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" }))
        return
      }
      void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(
        () => undefined,
      )
    }

    const enqueue = (event: Omit<QueuedEvent, "at" | "path"> & { path?: string }) => {
      if (window.location.pathname.startsWith("/admin")) return
      queue.current.push({ at: Date.now(), path: currentPath(), ...event })
      if (queue.current.length >= MAX_QUEUE) flush(false)
    }

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>("a, button, [role=button], [data-track]")
      if (!element || element.closest("[data-ct-consent]")) return

      const label = (element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80)
      const anchor = element instanceof HTMLAnchorElement ? element : element.closest("a")
      if (anchor?.href) {
        const url = new URL(anchor.href, window.location.href)
        const outbound = url.origin !== window.location.origin && /^https?:$/.test(url.protocol)
        enqueue({
          type: outbound ? "outbound" : "click",
          target: label || anchor.getAttribute("href") || "link",
          href: (outbound ? url.href : `${url.pathname}${url.search}`).slice(0, 500),
        })
        if (outbound) flush(true)
        return
      }
      enqueue({ type: "click", target: label || element.tagName.toLowerCase(), meta: { element: element.tagName.toLowerCase() } })
    }

    const onFocusIn = (event: FocusEvent) => {
      const field = event.target as HTMLElement | null
      const form = field?.closest("form")
      if (!form || startedForms.current.has(form) || form.closest("[data-ct-consent]")) return
      if (!field?.matches("input, textarea, select")) return
      startedForms.current.add(form)
      enqueue({ type: "form_start", target: formName(form), meta: { form: formName(form) } })
    }

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null
      if (!form || !(form instanceof HTMLFormElement)) return
      enqueue({ type: "form_submit", target: formName(form), meta: { form: formName(form) } })
      flush(true)
    }

    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const depth = Math.min(100, Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100))
      const page = pageRef.current
      page.maxScroll = Math.max(page.maxScroll, depth)
      for (const mark of SCROLL_MARKS) {
        if (depth >= mark && !page.marks.has(mark)) {
          page.marks.add(mark)
          enqueue({ type: "scroll", scrollDepth: mark })
        }
      }
    }

    const sendExit = () => {
      const page = pageRef.current
      // visibilitychange and pagehide both fire when a tab closes: record the exit once.
      if (!page.path || page.exitSent) return
      page.exitSent = true
      enqueue({
        type: "exit",
        path: page.path,
        durationMs: Math.max(0, Date.now() - page.startedAt),
        scrollDepth: page.maxScroll,
      })
      flush(true)
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendExit()
      else pageRef.current.exitSent = false
    }

    document.addEventListener("click", onClick, true)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("submit", onSubmit, true)
    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", sendExit)
    const timer = window.setInterval(() => flush(false), FLUSH_INTERVAL_MS)

    ensureIds()
    ;(window as unknown as { __ctEnqueue?: typeof enqueue }).__ctEnqueue = enqueue

    return () => {
      flush(true)
      window.clearInterval(timer)
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("submit", onSubmit, true)
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", sendExit)
      delete (window as unknown as { __ctEnqueue?: unknown }).__ctEnqueue
    }
  }, [enabled])

  // One page view per route change, with the time spent on the page that was just left.
  useEffect(() => {
    if (!enabled || pathname.startsWith("/admin")) return

    const enqueue = (window as unknown as { __ctEnqueue?: (event: Omit<QueuedEvent, "at" | "path">) => void }).__ctEnqueue
    const previous = pageRef.current
    const meta: Record<string, string | number | boolean> = {}
    if (previous.path) {
      meta.previousPath = previous.path
      meta.previousDurationMs = Math.max(0, Date.now() - previous.startedAt)
      meta.previousScrollDepth = previous.maxScroll
    }

    pageRef.current = { path: currentPath(), startedAt: Date.now(), maxScroll: 0, marks: new Set<number>(), exitSent: false }

    // Wait a tick so the page has rendered and we can tell a 404 from a normal page.
    const timer = window.setTimeout(() => {
      meta.status = document.querySelector("[data-not-found]") ? 404 : 200
      enqueue?.({ type: "pageview", title: document.title.slice(0, 200), meta })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [enabled, pathname])

  return null
}
