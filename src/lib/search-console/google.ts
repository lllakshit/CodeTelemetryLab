/**
 * Google OAuth (web client) and the Search Console APIs, with plain fetch. Server only.
 * Scope is read-only: the site's Search Console data can be read, never changed.
 */

export const GSC_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/webmasters.readonly"]
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const API = "https://searchconsole.googleapis.com"

export type GoogleClient = { clientId: string; clientSecret: string }

export function googleClient(env: Record<string, string | undefined> = process.env): GoogleClient | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

/** The callback Google sends the admin back to. Must be listed exactly under "Authorized redirect URIs". */
export function redirectUri(origin: string, env: Record<string, string | undefined> = process.env) {
  const fixed = env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  return fixed || `${origin.replace(/\/$/, "")}/api/admin/search-console/callback`
}

export function authorizeUrl(client: GoogleClient, input: { redirectUri: string; state: string; challenge: string; loginHint?: string }) {
  const url = new URL(AUTH_URL)
  url.searchParams.set("client_id", client.clientId)
  url.searchParams.set("redirect_uri", input.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", GSC_SCOPES.join(" "))
  url.searchParams.set("access_type", "offline")
  // consent: Google only returns a refresh token on consent, so reconnecting always yields a fresh one.
  url.searchParams.set("prompt", "consent select_account")
  url.searchParams.set("include_granted_scopes", "true")
  url.searchParams.set("state", input.state)
  url.searchParams.set("code_challenge", input.challenge)
  url.searchParams.set("code_challenge_method", "S256")
  if (input.loginHint) url.searchParams.set("login_hint", input.loginHint)
  return url.toString()
}

export class GoogleError extends Error {
  readonly status: number
  readonly reconnect: boolean
  constructor(message: string, status: number, reconnect = false) {
    super(message)
    this.status = status
    this.reconnect = reconnect
  }
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "")
  try {
    const data = JSON.parse(text) as { error?: string | { message?: string }; error_description?: string }
    if (typeof data.error === "string") return `${data.error}${data.error_description ? `: ${data.error_description}` : ""}`
    return data.error?.message ?? text.slice(0, 300)
  } catch {
    return text.slice(0, 300) || `HTTP ${response.status}`
  }
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; scope?: string; id_token?: string }

export async function exchangeCode(client: GoogleClient, input: { code: string; redirectUri: string; verifier: string }) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.verifier,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new GoogleError(`Google refused the sign-in code (${await readError(response)})`, response.status)
  return (await response.json()) as TokenResponse
}

/** Email from the id_token Google returned to us over TLS (not used for any security decision). */
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: string }
    return typeof payload.email === "string" ? payload.email : null
  } catch {
    return null
  }
}

let cached: { refreshToken: string; accessToken: string; expiresAt: number } | null = null

export async function accessToken(client: GoogleClient, refreshToken: string): Promise<string> {
  if (cached && cached.refreshToken === refreshToken && cached.expiresAt > Date.now() + 60_000) return cached.accessToken
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: client.clientId, client_secret: client.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    const message = await readError(response)
    // invalid_grant: the user removed access, the token expired (7 days for apps in "Testing"), or the password changed.
    throw new GoogleError(`Google access ended (${message}). Reconnect Search Console.`, response.status, /invalid_grant|unauthorized_client|invalid_client/i.test(message))
  }
  const data = (await response.json()) as TokenResponse
  cached = { refreshToken, accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

export async function revokeToken(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => {})
  cached = null
}

async function api<T>(token: string, path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(45_000),
    })
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await response.body?.cancel().catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** attempt))
      continue
    }
    if (!response.ok) {
      const message = await readError(response)
      throw new GoogleError(`Search Console API: ${message}`, response.status, response.status === 401)
    }
    return (await response.json()) as T
  }
  throw new GoogleError("Search Console API kept failing", 503)
}

export type GscSite = { siteUrl: string; permissionLevel: string }

export async function listSites(token: string): Promise<GscSite[]> {
  const data = await api<{ siteEntry?: GscSite[] }>(token, "/webmasters/v3/sites")
  return (data.siteEntry ?? []).filter((site) => site.permissionLevel !== "siteUnverifiedUser")
}

export type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }

/** searchAnalytics.query with paging (25,000 rows per page). */
export async function searchAnalytics(
  token: string,
  siteUrl: string,
  input: { startDate: string; endDate: string; dimensions: string[]; maxRows?: number },
): Promise<GscRow[]> {
  const rows: GscRow[] = []
  const maxRows = input.maxRows ?? 200_000
  for (let startRow = 0; startRow < maxRows; startRow += 25_000) {
    const data = await api<{ rows?: GscRow[] }>(token, `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      body: { startDate: input.startDate, endDate: input.endDate, dimensions: input.dimensions, rowLimit: 25_000, startRow, dataState: "all", type: "web" },
    })
    const page = data.rows ?? []
    rows.push(...page)
    if (page.length < 25_000) break
  }
  return rows
}

export type GscSitemap = { path: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; warnings?: string; errors?: string; contents?: { type: string; submitted?: string; indexed?: string }[] }

export async function listSitemaps(token: string, siteUrl: string): Promise<GscSitemap[]> {
  const data = await api<{ sitemap?: GscSitemap[] }>(token, `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`)
  return data.sitemap ?? []
}

export type UrlInspection = {
  verdict?: string
  coverageState?: string
  indexingState?: string
  robotsTxtState?: string
  pageFetchState?: string
  lastCrawlTime?: string
  googleCanonical?: string
  userCanonical?: string
  crawledAs?: string
  mobileVerdict?: string
  richResults?: string
}

export async function inspectUrl(token: string, siteUrl: string, url: string): Promise<UrlInspection> {
  const data = await api<{
    inspectionResult?: {
      indexStatusResult?: Record<string, string>
      mobileUsabilityResult?: { verdict?: string }
      richResultsResult?: { verdict?: string; detectedItems?: { richResultType?: string }[] }
    }
  }>(token, "/v1/urlInspection/index:inspect", { method: "POST", body: { inspectionUrl: url, siteUrl } })
  const index = data.inspectionResult?.indexStatusResult ?? {}
  const rich = data.inspectionResult?.richResultsResult
  return {
    verdict: index.verdict,
    coverageState: index.coverageState,
    indexingState: index.indexingState,
    robotsTxtState: index.robotsTxtState,
    pageFetchState: index.pageFetchState,
    lastCrawlTime: index.lastCrawlTime,
    googleCanonical: index.googleCanonical,
    userCanonical: index.userCanonical,
    crawledAs: index.crawledAs,
    mobileVerdict: data.inspectionResult?.mobileUsabilityResult?.verdict,
    richResults: rich ? `${rich.verdict ?? ""} ${(rich.detectedItems ?? []).map((item) => item.richResultType).filter(Boolean).join(", ")}`.trim() : undefined,
  }
}
