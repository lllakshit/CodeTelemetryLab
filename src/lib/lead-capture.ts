import { z } from "zod"
import type { Lead } from "@/lib/store"
import { absoluteUrl } from "@/lib/seo"
import { getClientIp } from "@/lib/rate-limit"

const optionalText = z.preprocess((value) => cleanOptionalText(value), z.string().max(400).optional().nullable())
const requiredText = (maxLength = 400) =>
  z.preprocess((value) => cleanText(value, maxLength), z.string().min(1).max(maxLength))

export const leadCaptureSchema = z.object({
  fullName: requiredText(120),
  companyName: optionalText,
  email: z.preprocess((value) => cleanText(value), z.string().email().max(160)),
  phone: optionalText,
  country: optionalText,
  budget: optionalText,
  timeline: optionalText,
  serviceInterestedIn: z.preprocess(
    (value) => cleanText(value) || "General project inquiry",
    z.string().min(2).max(120),
  ),
  subject: optionalText,
  message: requiredText(5000),
  preferredContactMethod: optionalText,
  websiteUrl: optionalText,
  source: optionalText,
  utmSource: optionalText,
  utmMedium: optionalText,
  utmCampaign: optionalText,
  utmTerm: optionalText,
  utmContent: optionalText,
  referrer: z.preprocess((value) => cleanOptionalText(value, 2000), z.string().max(2000).optional().nullable()),
  fax: z.preprocess((value) => cleanText(value), z.string().optional()),
})

export type LeadAttribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  landingPageUrl?: string
  serviceInterestedIn?: string
}

const ATTRIBUTION_QUERY_KEYS = new Set(["error", "sent"])

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>

export function parseLeadFormData(formData: FormData) {
  return leadCaptureSchema.safeParse({
    fullName: formData.get("fullName") ?? formData.get("name"),
    companyName: formData.get("companyName") ?? formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    budget: formData.get("budget"),
    timeline: formData.get("timeline"),
    serviceInterestedIn: formData.get("serviceInterestedIn") ?? formData.get("projectType"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    preferredContactMethod: formData.get("preferredContactMethod"),
    websiteUrl: formData.get("websiteUrl"),
    source: formData.get("source") ?? "contact-form",
    utmSource: formData.get("utmSource"),
    utmMedium: formData.get("utmMedium"),
    utmCampaign: formData.get("utmCampaign"),
    utmTerm: formData.get("utmTerm"),
    utmContent: formData.get("utmContent"),
    referrer: formData.get("referrer") ?? formData.get("landingPageUrl"),
    fax: formData.get("fax"),
  })
}

function readSearchParam(
  params: Record<string, string | string[] | undefined> | undefined,
  keys: string[],
) {
  if (!params) return undefined

  for (const key of keys) {
    const value = params[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

export function attributionFromSearchParams(
  params: Record<string, string | string[] | undefined> | undefined,
): LeadAttribution {
  return {
    utmSource: readSearchParam(params, ["utm_source", "utmSource"]),
    utmMedium: readSearchParam(params, ["utm_medium", "utmMedium"]),
    utmCampaign: readSearchParam(params, ["utm_campaign", "utmCampaign"]),
    utmTerm: readSearchParam(params, ["utm_term", "utmTerm"]),
    utmContent: readSearchParam(params, ["utm_content", "utmContent"]),
    serviceInterestedIn: readSearchParam(params, [
      "service",
      "serviceInterestedIn",
      "projectType",
      "project_type",
    ]),
    landingPageUrl: buildContactLandingUrl(params),
  }
}

export function buildContactLandingUrl(
  params: Record<string, string | string[] | undefined> | undefined,
) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params ?? {})) {
    if (ATTRIBUTION_QUERY_KEYS.has(key)) continue
    if (typeof value === "string" && value.trim()) {
      query.set(key, value.trim())
    }
  }

  const queryString = query.toString()
  return `${absoluteUrl("/contact")}${queryString ? `?${queryString}` : ""}`
}

export function parseLeadJson(value: unknown) {
  return leadCaptureSchema.safeParse(value)
}

export function leadFromCapture(input: LeadCaptureInput, request: Request): Parameters<typeof leadPayload>[0] {
  return {
    ...input,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    referrer: input.referrer ?? request.headers.get("referer"),
  }
}

export function leadPayload(input: LeadCaptureInput & {
  ipAddress?: string | null
  userAgent?: string | null
  referrer?: string | null
}): Partial<Lead> & {
  fullName: string
  email: string
  serviceInterestedIn: string
  message: string
} {
  return {
    fullName: input.fullName,
    companyName: input.companyName ?? null,
    email: input.email,
    phone: input.phone ?? null,
    country: input.country ?? null,
    budget: input.budget ?? null,
    timeline: input.timeline ?? null,
    serviceInterestedIn: input.serviceInterestedIn,
    subject: input.subject ?? "Project inquiry",
    message: input.message,
    preferredContactMethod: input.preferredContactMethod ?? "Email",
    websiteUrl: input.websiteUrl ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
    source: input.source ?? "contact-form",
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    utmTerm: input.utmTerm ?? null,
    utmContent: input.utmContent ?? null,
    status: "New",
  }
}

function cleanText(value: unknown, maxLength = 400) {
  if (value == null) return ""
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}

function cleanOptionalText(value: unknown, maxLength = 400) {
  const text = cleanText(value, maxLength)
  return text || undefined
}
