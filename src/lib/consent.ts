/** Cookie names and helpers shared by the browser and the server. */

export const CONSENT_COOKIE = "ct_consent"
export const VISITOR_COOKIE = "ct_vid"
export const SESSION_COOKIE = "ct_sid"

export const CONSENT_VERSION = 1
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export const SESSION_MAX_AGE_SECONDS = 60 * 30

export type ConsentState = {
  version: number
  analytics: boolean
  decidedAt: string
}

export function serializeConsent(state: ConsentState) {
  return `v${state.version}.${state.analytics ? "1" : "0"}.${Math.floor(new Date(state.decidedAt).getTime() / 1000)}`
}

export function parseConsent(value: string | undefined | null): ConsentState | null {
  if (!value) return null
  const match = /^v(\d+)\.([01])\.(\d{9,12})$/.exec(value)
  if (!match) return null
  const version = Number(match[1])
  if (version !== CONSENT_VERSION) return null
  return {
    version,
    analytics: match[2] === "1",
    decidedAt: new Date(Number(match[3]) * 1000).toISOString(),
  }
}

/** Reads one cookie out of a `Cookie:` request header. */
export function readCookie(header: string | null | undefined, name: string) {
  if (!header) return undefined
  for (const part of header.split(";")) {
    const index = part.indexOf("=")
    if (index < 0) continue
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim())
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

export function hasAnalyticsConsent(cookieHeader: string | null | undefined) {
  return parseConsent(readCookie(cookieHeader, CONSENT_COOKIE))?.analytics === true
}

export const COOKIE_SETTINGS_EVENT = "ct:open-cookie-settings"
