import { randomUUID } from "node:crypto"
import { z } from "zod"
import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"

export const RESUME_BUCKET = "job-applications"
export const MAX_RESUME_BYTES = 5 * 1024 * 1024

export const applicationStatuses = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const
export type ApplicationStatus = (typeof applicationStatuses)[number]

export const applicationStatusStyles: Record<ApplicationStatus, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-700",
  shortlisted: "border-violet-200 bg-violet-50 text-violet-700",
  interview: "border-cyan-200 bg-cyan-50 text-cyan-700",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hired: "border-emerald-300 bg-emerald-100 text-emerald-800",
  rejected: "border-slate-200 bg-slate-100 text-slate-600",
}

const text = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value),
    z.string().max(max),
  )

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.replace(/\s+/g, " ").trim()
      return trimmed || undefined
    },
    z.string().max(max).optional(),
  )

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  },
  z.string().url().max(300).optional(),
)

export const applicationSchema = z.object({
  jobSlug: text(120).pipe(z.string().min(1)),
  fullName: text(120).pipe(z.string().min(2)),
  email: text(160).pipe(z.string().email()),
  phone: optionalText(40),
  location: text(120).pipe(z.string().min(2)),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  currentCompany: optionalText(120),
  yearsExperience: optionalText(40),
  noticePeriod: optionalText(60),
  expectedCompensation: optionalText(80),
  coverNote: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() || undefined : undefined),
    z.string().max(3000).optional(),
  ),
  fax: optionalText(40),
})

export type ApplicationInput = z.infer<typeof applicationSchema>

export type JobApplication = {
  id: string
  jobSlug: string
  jobTitle: string
  fullName: string
  email: string
  phone: string | null
  location: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  currentCompany: string | null
  yearsExperience: string | null
  noticePeriod: string | null
  expectedCompensation: string | null
  coverNote: string | null
  resumePath: string | null
  resumeFilename: string | null
  status: ApplicationStatus
  notes: string | null
  visitorId: string | null
  sessionKey: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  referrer: string | null
  createdAt: string
  updatedAt: string
}

type ApplicationRow = {
  id: string
  job_slug: string
  job_title: string
  full_name: string
  email: string
  phone: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  current_company: string | null
  years_experience: string | null
  notice_period: string | null
  expected_compensation: string | null
  cover_note: string | null
  resume_path: string | null
  resume_filename: string | null
  status: ApplicationStatus
  notes: string | null
  visitor_id: string | null
  session_key: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    jobSlug: row.job_slug,
    jobTitle: row.job_title,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    currentCompany: row.current_company,
    yearsExperience: row.years_experience,
    noticePeriod: row.notice_period,
    expectedCompensation: row.expected_compensation,
    coverNote: row.cover_note,
    resumePath: row.resume_path,
    resumeFilename: row.resume_filename,
    status: row.status,
    notes: row.notes,
    visitorId: row.visitor_id,
    sessionKey: row.session_key,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    referrer: row.referrer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function isApplicationStorageReady() {
  return getSupabaseConfig().isConfigured
}

const RESUME_TYPES: Record<string, { contentType: string; matches: (bytes: Uint8Array) => boolean }> = {
  pdf: {
    contentType: "application/pdf",
    matches: (bytes) => bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46,
  },
  doc: {
    contentType: "application/msword",
    matches: (bytes) => bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0,
  },
  docx: {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    matches: (bytes) => bytes[0] === 0x50 && bytes[1] === 0x4b,
  },
}

export type ResumeCheck =
  | { ok: true; extension: string; contentType: string; bytes: Uint8Array; safeName: string }
  | { ok: false; reason: "missing" | "too_large" | "type" }

/** Checks size, extension, and the file's real signature, not just the name the browser reports. */
export async function checkResume(file: File | null): Promise<ResumeCheck> {
  if (!file || file.size === 0) return { ok: false, reason: "missing" }
  if (file.size > MAX_RESUME_BYTES) return { ok: false, reason: "too_large" }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  const rule = RESUME_TYPES[extension]
  if (!rule) return { ok: false, reason: "type" }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!rule.matches(bytes)) return { ok: false, reason: "type" }

  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)

  return { ok: true, extension, contentType: rule.contentType, bytes, safeName: base || "resume" }
}

export async function createApplication(input: {
  data: ApplicationInput
  jobTitle: string
  resume: Extract<ResumeCheck, { ok: true }>
  originalFilename: string
  visitorId?: string
  sessionKey?: string
  utm?: { source?: string; medium?: string; campaign?: string }
  referrer?: string | null
  ipHash?: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const now = new Date()
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}-${input.resume.safeName}.${input.resume.extension}`

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(path, input.resume.bytes, { contentType: input.resume.contentType, upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      job_slug: input.data.jobSlug,
      job_title: input.jobTitle,
      full_name: input.data.fullName,
      email: input.data.email,
      phone: input.data.phone ?? null,
      location: input.data.location,
      linkedin_url: input.data.linkedinUrl ?? null,
      portfolio_url: input.data.portfolioUrl ?? null,
      current_company: input.data.currentCompany ?? null,
      years_experience: input.data.yearsExperience ?? null,
      notice_period: input.data.noticePeriod ?? null,
      expected_compensation: input.data.expectedCompensation ?? null,
      cover_note: input.data.coverNote ?? null,
      resume_path: path,
      resume_filename: input.originalFilename.slice(0, 160),
      visitor_id: input.visitorId ?? null,
      session_key: input.sessionKey ?? null,
      utm_source: input.utm?.source ?? null,
      utm_medium: input.utm?.medium ?? null,
      utm_campaign: input.utm?.campaign ?? null,
      referrer: input.referrer ?? null,
      ip_hash: input.ipHash ?? null,
    })
    .select("*")
    .single()

  if (error) {
    // Do not leave an orphaned résumé behind if the row could not be saved.
    await supabase.storage.from(RESUME_BUCKET).remove([path])
    throw error
  }

  return fromRow(data as ApplicationRow)
}

export type ApplicationFilters = { search?: string; status?: string; job?: string; from?: string; to?: string }

export async function listApplications(filters: ApplicationFilters = {}, limit = 500) {
  if (!isApplicationStorageReady()) return []
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("job_applications").select("*").order("created_at", { ascending: false }).limit(limit)

  if (filters.status && (applicationStatuses as readonly string[]).includes(filters.status)) {
    query = query.eq("status", filters.status)
  }
  if (filters.job) query = query.eq("job_slug", filters.job)
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00.000Z`)
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`)
  if (filters.search) {
    const term = filters.search.replace(/[%,()]/g, "").trim()
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,job_title.ilike.%${term}%,current_company.ilike.%${term}%`,
      )
    }
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => fromRow(row as ApplicationRow))
}

export async function getApplication(id: string) {
  if (!isApplicationStorageReady() || !/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("job_applications").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data ? fromRow(data as ApplicationRow) : null
}

export async function updateApplication(id: string, patch: { status?: ApplicationStatus; notes?: string }) {
  const supabase = createSupabaseAdminClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status) update.status = patch.status
  if (patch.notes !== undefined) update.notes = patch.notes.slice(0, 4000)
  const { error } = await supabase.from("job_applications").update(update).eq("id", id)
  if (error) throw error
}

export async function createResumeSignedUrl(path: string, expiresInSeconds = 300) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function countNewApplications() {
  if (!isApplicationStorageReady()) return 0
  const supabase = createSupabaseAdminClient()
  const { count } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "new")
  return count ?? 0
}
