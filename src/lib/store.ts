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

export type MediaAsset = {
  id: string
  name: string
  alt: string
  url: string
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
  media: MediaAsset[]
  activity: ActivityLog[]
}

const storePath = path.join(process.cwd(), "data", "cms-store.json")

function fallbackStore() {
  return seed as CmsStore
}

async function ensureStoreFile() {
  await mkdir(path.dirname(storePath), { recursive: true })
}

export async function readStore(): Promise<CmsStore> {
  try {
    const raw = await readFile(storePath, "utf8")
    return JSON.parse(raw) as CmsStore
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
