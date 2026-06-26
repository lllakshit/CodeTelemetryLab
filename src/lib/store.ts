import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import seed from "../../data/cms-store.json"

export type ServiceItem = {
  title: string
  description: string
  notes: string
}

export type TestimonialItem = {
  name: string
  role: string
  quote: string
}

export type StatItem = {
  label: string
  value: string
}

export type ProcessItem = {
  title: string
  description: string
}

export type HomeContent = {
  key: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  services: ServiceItem[]
  testimonials: TestimonialItem[]
  stats: StatItem[]
  process: ProcessItem[]
  ctaTitle: string
  ctaDescription: string
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featuredImage?: string | null
  category: string
  tags: string[]
  seoTitle?: string | null
  seoDescription?: string | null
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  source?: "cms" | "content"
  readingTime?: string | null
  primaryKeyword?: string | null
  searchIntent?: string | null
  targetAudience?: string | null
}

export type Project = {
  id: string
  slug: string
  title: string
  category: string
  problem: string
  solution: string
  stack: string[]
  screenshots: string[]
  results: string
  featured: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: string
  name: string
  email: string
  company?: string | null
  projectType: string
  budget: string
  message: string
  status: string
  createdAt: string
}

export const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
  "Archived",
] as const

export type LeadStatus = (typeof leadStatuses)[number]

export type Lead = {
  id: string
  fullName: string
  companyName?: string | null
  email: string
  phone?: string | null
  country?: string | null
  budget?: string | null
  timeline?: string | null
  serviceInterestedIn: string
  subject?: string | null
  message: string
  preferredContactMethod?: string | null
  websiteUrl?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  referrer?: string | null
  source?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  status: LeadStatus
  notes?: string | null
  assignedTeamMember?: string | null
  createdAt: string
  updatedAt: string
}

export type MediaAsset = {
  id: string
  name: string
  alt: string
  url: string
  storageBucket?: string | null
  storagePath?: string | null
  mimeType?: string | null
  size?: number | null
  createdAt: string
}

export type ActivityLog = {
  id: string
  kind: string
  title: string
  detail: string
  createdAt: string
}

export type CmsStore = {
  homepage: HomeContent
  blogs: BlogPost[]
  projects: Project[]
  messages: Message[]
  leads: Lead[]
  media: MediaAsset[]
  activity: ActivityLog[]
}

const storePath = path.join(process.cwd(), "data", "cms-store.json")

function fallbackStore() {
  return normalizeStore(seed as Partial<CmsStore>)
}

function leadFromMessage(message: Message): Lead {
  return {
    id: message.id,
    fullName: message.name,
    companyName: message.company ?? null,
    email: message.email,
    phone: null,
    country: null,
    budget: message.budget,
    timeline: null,
    serviceInterestedIn: message.projectType,
    subject: "Project inquiry",
    message: message.message,
    preferredContactMethod: "Email",
    websiteUrl: null,
    ipAddress: null,
    userAgent: null,
    referrer: null,
    source: "legacy-contact",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    status: leadStatuses.includes(message.status as LeadStatus) ? (message.status as LeadStatus) : "New",
    notes: null,
    assignedTeamMember: null,
    createdAt: message.createdAt,
    updatedAt: message.createdAt,
  }
}

export function normalizeStore(store: Partial<CmsStore>): CmsStore {
  const messages = store.messages ?? []

  return {
    homepage: store.homepage ?? (seed as CmsStore).homepage,
    blogs: store.blogs ?? [],
    projects: store.projects ?? [],
    messages,
    leads: store.leads ?? messages.map(leadFromMessage),
    media: store.media ?? [],
    activity: store.activity ?? [],
  }
}

async function ensureStoreFile() {
  await mkdir(path.dirname(storePath), { recursive: true })
}

export async function readStore(): Promise<CmsStore> {
  try {
    const raw = await readFile(storePath, "utf8")
    return normalizeStore(JSON.parse(raw) as Partial<CmsStore>)
  } catch {
    const store = fallbackStore()
    await writeStore(store)
    return store
  }
}

export async function writeStore(store: CmsStore) {
  await ensureStoreFile()
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8")
}

export async function updateStore(
  updater: (store: CmsStore) => CmsStore | Promise<CmsStore>,
) {
  const current = await readStore()
  const next = await updater(current)
  await writeStore(next)
  return next
}
