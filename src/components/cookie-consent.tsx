"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Cookie } from "lucide-react"
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  COOKIE_SETTINGS_EVENT,
  SESSION_COOKIE,
  VISITOR_COOKIE,
  parseConsent,
  serializeConsent,
} from "@/lib/consent"

function readCookie(name: string) {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
}

function clearAnalyticsData() {
  for (const name of [VISITOR_COOKIE, SESSION_COOKIE]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
  }
  try {
    for (const key of ["ct_landing", "ct_ref", "ct_utm"]) window.sessionStorage.removeItem(key)
  } catch {
    // Storage can be blocked; the cookies above are the source of truth.
  }
}

function subscribe(notify: () => void) {
  window.addEventListener("ct:consent-changed", notify)
  return () => window.removeEventListener("ct:consent-changed", notify)
}

const getSnapshot = () => readCookie(CONSENT_COOKIE) ?? ""
const getServerSnapshot = () => undefined

export function CookieConsent() {
  const pathname = usePathname()
  // The cookie is the source of truth. `undefined` during server render and hydration means "not ready yet".
  const rawConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const consent = parseConsent(rawConsent || undefined)
  const ready = rawConsent !== undefined

  const [reopened, setReopened] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [analyticsDraft, setAnalyticsDraft] = useState<boolean | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const open = ready && (!consent || reopened)
  const analytics = analyticsDraft ?? consent?.analytics ?? false

  useEffect(() => {
    const reopen = () => {
      setAnalyticsDraft(null)
      setShowOptions(true)
      setReopened(true)
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (open) dialogRef.current?.focus({ preventScroll: true })
  }, [open])

  const save = useCallback((allowAnalytics: boolean) => {
    writeCookie(
      CONSENT_COOKIE,
      serializeConsent({ version: CONSENT_VERSION, analytics: allowAnalytics, decidedAt: new Date().toISOString() }),
      CONSENT_MAX_AGE_SECONDS,
    )
    if (!allowAnalytics) clearAnalyticsData()
    setAnalyticsDraft(null)
    setReopened(false)
    setShowOptions(false)
    window.dispatchEvent(new CustomEvent("ct:consent-changed", { detail: { analytics: allowAnalytics } }))
  }, [])

  if (!ready || !open || pathname.startsWith("/admin")) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      tabIndex={-1}
      data-ct-consent
      className="fixed inset-x-3 bottom-3 z-[70] max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] outline-none sm:inset-x-auto sm:bottom-5 sm:left-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="cookie-consent-title" className="text-base font-semibold text-slate-950">
            Cookies on this site
          </h2>
          <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-slate-600">
            Essential cookies keep the site working. With your permission we also use analytics cookies to see which
            pages people read and where they leave, so we can improve the site. We never sell this data. See our{" "}
            <Link href="/privacy" className="font-medium text-blue-700 underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>

      {showOptions ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block font-semibold text-slate-900">Essential</span>
              <span className="block text-xs leading-5 text-slate-500">
                Remembers this choice and keeps forms and sign-in working. Always on.
              </span>
            </span>
            <input type="checkbox" checked disabled aria-label="Essential cookies, always on" className="mt-1 h-4 w-4" />
          </label>
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block font-semibold text-slate-900">Analytics and visitor journey</span>
              <span className="block text-xs leading-5 text-slate-500">
                Anonymous page views, clicks, and where a visit ends. No raw IP address is stored.
              </span>
            </span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalyticsDraft(event.target.checked)}
              aria-label="Allow analytics and visitor journey cookies"
              className="mt-1 h-4 w-4 accent-blue-600"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {showOptions ? (
          <button
            type="button"
            onClick={() => save(analytics)}
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Save preferences
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => save(true)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => save(false)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              Customize
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Footer control that lets visitors change their choice at any time. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
    >
      Cookie settings
    </button>
  )
}
