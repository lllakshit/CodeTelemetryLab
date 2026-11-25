import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { pkcePair } from "@/lib/search-console/crypto"
import { authorizeUrl, googleClient, redirectUri } from "@/lib/search-console/google"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OAUTH_COOKIE = "ctl_gsc_oauth"

/** Starts the Google sign-in for Search Console (admin only). State + PKCE verifier live in a short httpOnly cookie. */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.redirect(new URL("/admin/login?from=/admin/search-console", request.url))
  const client = googleClient()
  if (!client) return NextResponse.redirect(new URL("/admin/search-console?error=not_configured", request.url))

  const origin = new URL(request.url).origin
  const callback = redirectUri(origin)
  const { verifier, challenge, state } = pkcePair()
  const response = NextResponse.redirect(authorizeUrl(client, { redirectUri: callback, state, challenge }))
  response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, callback }), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/admin/search-console",
    maxAge: 600,
  })
  return response
}
