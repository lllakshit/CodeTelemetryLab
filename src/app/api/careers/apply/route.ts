import { NextResponse } from "next/server"
import { sendApplicationNotification } from "@/lib/application-email"
import {
  applicationSchema,
  checkResume,
  createApplication,
  isApplicationStorageReady,
} from "@/lib/applications"
import { getJobBySlug } from "@/lib/careers"
import { hasAnalyticsConsent, readCookie, SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/consent"
import { hashIp, markJourneyConverted } from "@/lib/journeys"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"
import { absoluteUrl } from "@/lib/seo"

function back(request: Request, slug: string, outcome: string) {
  const target = outcome === "applied" ? `?applied=1#apply` : `?error=${outcome}#apply`
  return NextResponse.redirect(new URL(`/careers/${slug}${target}`, absoluteBase(request)), 303)
}

function absoluteBase(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) return `${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`
  return new URL(request.url).origin
}

function utmFromReferer(request: Request) {
  try {
    const referer = request.headers.get("referer")
    if (!referer) return {}
    const params = new URL(referer).searchParams
    return {
      source: params.get("utm_source")?.slice(0, 120) || undefined,
      medium: params.get("utm_medium")?.slice(0, 120) || undefined,
      campaign: params.get("utm_campaign")?.slice(0, 160) || undefined,
    }
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const slug = String(formData.get("jobSlug") ?? "")
  const job = getJobBySlug(slug)

  if (!job) return NextResponse.redirect(new URL("/careers", absoluteBase(request)), 303)

  // Honeypot: bots fill the hidden field, people never see it. Pretend it worked.
  if (String(formData.get("fax") ?? "").trim()) return back(request, slug, "applied")

  if (isRateLimited(`apply:${getClientIp(request)}`, 5)) return back(request, slug, "ratelimit")
  if (!isApplicationStorageReady()) return back(request, slug, "unavailable")
  if (formData.get("privacyConsent") !== "on") return back(request, slug, "consent")

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    console.warn("Invalid job application", parsed.error.flatten().fieldErrors)
    return back(request, slug, "invalid")
  }

  const file = formData.get("resume")
  const resume = await checkResume(file instanceof File ? file : null)
  if (!resume.ok) return back(request, slug, resume.reason === "missing" ? "resume" : resume.reason)

  const cookieHeader = request.headers.get("cookie")
  const tracked = hasAnalyticsConsent(cookieHeader)
  const visitorId = tracked ? readCookie(cookieHeader, VISITOR_COOKIE) : undefined
  const sessionKey = tracked ? readCookie(cookieHeader, SESSION_COOKIE) : undefined

  try {
    const application = await createApplication({
      data: parsed.data,
      jobTitle: job.title,
      resume,
      originalFilename: (file as File).name,
      visitorId,
      sessionKey,
      utm: utmFromReferer(request),
      referrer: request.headers.get("referer"),
      ipHash: hashIp(request),
    })

    try {
      await sendApplicationNotification(application)
    } catch (error) {
      console.error("Failed to send application notification", error)
    }

    await markJourneyConverted(sessionKey, "job-application")
    console.info(`Job application saved: ${absoluteUrl(`/admin/applications/${application.id}`)}`)
  } catch (error) {
    console.error("Failed to save job application", error)
    return back(request, slug, "failed")
  }

  return back(request, slug, "applied")
}
