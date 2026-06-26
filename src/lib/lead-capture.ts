import { z } from "zod"
import type { Lead } from "@/lib/store"
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
  fax: z.preprocess((value) => cleanText(value), z.string().optional()),
})

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
    fax: formData.get("fax"),
  })
}

export function parseLeadJson(value: unknown) {
  return leadCaptureSchema.safeParse(value)
}

export function leadFromCapture(input: LeadCaptureInput, request: Request): Parameters<typeof leadPayload>[0] {
  return {
    ...input,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
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
