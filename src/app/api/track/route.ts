import { NextResponse } from "next/server"
import { hasAnalyticsConsent } from "@/lib/consent"
import { recordJourneyEvents, trackPayloadSchema } from "@/lib/journeys"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"

const MAX_BODY_CHARS = 60_000

/**
 * Receives journey events from the browser (sendBeacon or fetch).
 * Nothing is stored unless the visitor accepted analytics cookies: the consent cookie is re-checked here
 * on the server, so a modified client cannot bypass the choice.
 */
export async function POST(request: Request) {
  if (!hasAnalyticsConsent(request.headers.get("cookie"))) {
    return new NextResponse(null, { status: 204 })
  }

  if (isRateLimited(`track:${getClientIp(request)}`, 240, 60_000)) {
    return NextResponse.json({ error: "Too many events" }, { status: 429 })
  }

  const raw = await request.text()
  if (!raw || raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = trackPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // The admin area is never part of a visitor journey.
  const events = parsed.data.events.filter((event) => !event.path.startsWith("/admin"))
  if (!events.length) return new NextResponse(null, { status: 204 })

  try {
    await recordJourneyEvents({ ...parsed.data, events }, request)
  } catch (error) {
    // Tracking must never break the site; log and move on.
    console.error("Failed to record journey events", error)
  }

  return new NextResponse(null, { status: 204 })
}
