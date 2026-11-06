import { lookup } from "node:dns/promises"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { isPrivateAddress, isPublicHttpsUrl } from "@/lib/outreach/link-safety"

const schema = z.object({ url: z.string().trim().url().max(2000) })

/**
 * Soft check for shared links: a link that sends visitors to a Google sign-in page is private, so the
 * recipient would be asked for access. This never blocks sending; it only warns.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isPublicHttpsUrl(parsed.data.url)) {
    return NextResponse.json({ status: "unknown", message: "Could not check this link." })
  }

  try {
    // Resolve the name first so a public-looking host that points at a private address is never contacted.
    const addresses = await lookup(new URL(parsed.data.url).hostname, { all: true })
    if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
      return NextResponse.json({ status: "unknown", message: "Could not check this link." })
    }
    const response = await fetch(parsed.data.url, {
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CodeTelemetryLinkCheck/1.0)" },
    })
    const location = response.headers.get("location") ?? ""
    if (response.status >= 300 && response.status < 400 && /accounts\.google\.com|ServiceLogin|login/i.test(location)) {
      return NextResponse.json({
        status: "private",
        message: 'This link asks for sign-in. In Google Drive, open Share and set General access to "Anyone with the link" so the recipient can open it.',
      })
    }
    if (response.status === 404) {
      return NextResponse.json({ status: "private", message: "The link was not found. Check that it is correct and shared." })
    }
    return NextResponse.json({ status: "public", message: "The link opens without signing in." })
  } catch {
    return NextResponse.json({ status: "unknown", message: "Could not check this link." })
  }
}
