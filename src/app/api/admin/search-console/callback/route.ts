import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import { emailFromIdToken, exchangeCode, googleClient, GSC_SCOPES } from "@/lib/search-console/google"
import { saveConnection } from "@/lib/search-console/store"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OAUTH_COOKIE = "ctl_gsc_oauth"

function back(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/admin/search-console", request.url)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = NextResponse.redirect(url)
  response.cookies.set(OAUTH_COOKIE, "", { path: "/api/admin/search-console", maxAge: 0 })
  return response
}

function same(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Google redirects here after consent. Checks the admin session and the state, then stores the refresh token. */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.redirect(new URL("/admin/login?from=/admin/search-console", request.url))
  const client = googleClient()
  if (!client) return back(request, { error: "not_configured" })

  const params = request.nextUrl.searchParams
  if (params.get("error")) return back(request, { error: params.get("error") === "access_denied" ? "denied" : "google" })

  let saved: { state?: string; verifier?: string; callback?: string } = {}
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value ?? "{}")
  } catch {
    saved = {}
  }
  const state = params.get("state") ?? ""
  const code = params.get("code") ?? ""
  if (!saved.state || !saved.verifier || !saved.callback || !code || !same(state, saved.state)) return back(request, { error: "state" })

  try {
    const tokens = await exchangeCode(client, { code, redirectUri: saved.callback, verifier: saved.verifier })
    const granted = (tokens.scope ?? "").split(" ")
    if (!granted.includes(GSC_SCOPES[2])) return back(request, { error: "scope" })
    if (!tokens.refresh_token) return back(request, { error: "no_refresh" })
    await saveConnection({ refreshToken: tokens.refresh_token, email: emailFromIdToken(tokens.id_token), scope: tokens.scope ?? "" })
    return back(request, { connected: "1" })
  } catch (error) {
    console.error("[search-console] callback failed", error instanceof Error ? error.message : error)
    return back(request, { error: "exchange" })
  }
}
