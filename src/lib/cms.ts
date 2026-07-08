import { randomUUID } from "node:crypto"
import { isAfter, parseISO } from "date-fns"
import seed from "../../data/cms-store.json"
import { getContentBlogPostBySlug, listContentBlogPosts } from "@/lib/content-blog"
import { slugify } from "@/lib/utils"
import {
  createSupabaseAdminClient,
  getSupabaseConfig,
  SUPABASE_MEDIA_BUCKET,
} from "@/lib/supabase"
import { notifyLeadCreated } from "@/lib/mobile-push"
import {
  readStore,
  updateStore,
  normalizeStore,
  type ActivityLog,
  type BlogPost,
  type HomeContent,
  type Lead,
  type LeadStatus,
  type MediaAsset,
  type Message,
  type Project,
  type CmsStore,
} from "@/lib/store"

const supabaseConfig = getSupabaseConfig()
const supabase = supabaseConfig.isConfigured ? createSupabaseAdminClient() : null
const supabaseClient = supabase as NonNullable<typeof supabase>

const TABLES = {
  homepage: "homepage_content",
  blogs: "blog_posts",
  projects: "projects",
  messages: "messages",
  leads: "leads",
  media: "media_assets",
  activity: "activity_logs",
} as const

type CmsTableName = (typeof TABLES)[keyof typeof TABLES]

type HomepageRow = {
  key: string
  hero_eyebrow: string
  hero_title: string
  hero_description: string
  primary_cta_label: string
  primary_cta_href: string
  secondary_cta_label: string
  secondary_cta_href: string
  services: unknown
  testimonials: unknown
  stats: unknown
  process: unknown
  cta_title: string
  cta_description: string
  created_at?: string
  updated_at?: string
}

type BlogRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featured_image: string | null
  category: string
  tags: unknown
  seo_title: string | null
  seo_description: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

type ProjectRow = {
  id: string
  slug: string
  title: string
  category: string
  problem: string
  solution: string
  stack: unknown
  screenshots: unknown
  results: string
  featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

type MessageRow = {
  id: string
  name: string
  email: string
  company: string | null
  project_type: string
  budget: string
  message: string
  status: string
  created_at: string
}

type LeadRow = {
  id: string
  full_name: string
  company_name: string | null
  email: string
  phone: string | null
  country: string | null
  budget: string | null
  timeline: string | null
  service_interested_in: string
  subject: string | null
  message: string
  preferred_contact_method: string | null
  website_url: string | null
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_term: string | null
  utm_content: string | null
  status: string
  notes: string | null
  assigned_team_member: string | null
  created_at: string
  updated_at: string
}

type MediaRow = {
  id: string
  name: string
  alt: string
  url: string
  storage_bucket: string | null
  storage_path: string | null
  mime_type: string | null
  size: number | null
  created_at: string
}

type LeadFilters = {
  search?: string
  status?: string
  service?: string
  from?: string
  to?: string
}

type ActivityRow = {
  id: string
  kind: string
  title: string
  detail: string
  created_at: string
}

function nowIso() {
  return new Date().toISOString()
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function asArray<T>(value: unknown, mapper: (item: any) => T): T[] {
  return Array.isArray(value) ? value.map(mapper) : []
}

function nullableString(value: unknown) {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

function sortNewest<T extends { createdAt?: string; updatedAt?: string; publishedAt?: string | null }>(
  items: T[],
) {
  return [...items].sort((a, b) => {
    const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime()
    const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime()
    return bDate - aDate
  })
}

function mergeBlogSources(cmsPosts: BlogPost[], contentPosts: BlogPost[]) {
  const cmsSlugs = new Set(cmsPosts.map((post) => post.slug))
  return [
    ...cmsPosts.map((post) => ({ ...post, source: post.source ?? "cms" as const })),
    ...contentPosts.filter((post) => !cmsSlugs.has(post.slug)),
  ]
}

function isMissingSupabaseTableError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const maybeError = error as { code?: string; message?: string }
  return (
    maybeError.code === "PGRST205" ||
    maybeError.code === "42P01" ||
    maybeError.message?.includes("Could not find the table")
  )
}

async function fallbackFromStore<T>(selector: (store: CmsStore) => T) {
  const store = await readStore()
  return selector(store)
}

function isSupabaseReady() {
  return Boolean(supabase)
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL)
}

async function hasSupabaseTable(table: CmsTableName) {
  if (!isSupabaseReady()) return false

  const { error } = await supabaseClient.from(table).select("id", {
    count: "exact",
    head: true,
  })

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return false
    }

    throw error
  }

  return true
}

async function shouldUseStoreFallback() {
  if (!isSupabaseReady()) return true

  try {
    await ensureSupabaseSeeded()
    return false
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return true
    }
    throw error
  }
}

async function shouldUseStoreFallbackForWrite(table: CmsTableName) {
  if (!isSupabaseReady()) {
    if (isVercelRuntime()) {
      throw new Error(
        "Supabase server credentials are missing in this Vercel deployment. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.",
      )
    }

    return true
  }

  const tableExists = await hasSupabaseTable(table)
  if (tableExists) {
    return false
  }

  if (isVercelRuntime()) {
    throw new Error(
      `Supabase table "${table}" is unavailable in this Vercel deployment. Apply supabase/schema.sql to the connected Supabase project before using admin write actions.`,
    )
  }

  return true
}

function toHomeRow(homepage: HomeContent): HomepageRow {
  return {
    key: homepage.key,
    hero_eyebrow: homepage.heroEyebrow,
    hero_title: homepage.heroTitle,
    hero_description: homepage.heroDescription,
    primary_cta_label: homepage.primaryCtaLabel,
    primary_cta_href: homepage.primaryCtaHref,
    secondary_cta_label: homepage.secondaryCtaLabel,
    secondary_cta_href: homepage.secondaryCtaHref,
    services: homepage.services,
    testimonials: homepage.testimonials,
    stats: homepage.stats,
    process: homepage.process,
    cta_title: homepage.ctaTitle,
    cta_description: homepage.ctaDescription,
  }
}

function fromHomeRow(row: HomepageRow): HomeContent {
  return {
    key: row.key,
    heroEyebrow: row.hero_eyebrow,
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    primaryCtaLabel: row.primary_cta_label,
    primaryCtaHref: row.primary_cta_href,
    secondaryCtaLabel: row.secondary_cta_label,
    secondaryCtaHref: row.secondary_cta_href,
    services: asArray(row.services, (item) => ({
      title: String(item?.title ?? ""),
      description: String(item?.description ?? ""),
      notes: String(item?.notes ?? ""),
    })),
    testimonials: asArray(row.testimonials, (item) => ({
      name: String(item?.name ?? ""),
      role: String(item?.role ?? ""),
      quote: String(item?.quote ?? ""),
    })),
    stats: asArray(row.stats, (item) => ({
      label: String(item?.label ?? ""),
      value: String(item?.value ?? ""),
    })),
    process: asArray(row.process, (item) => ({
      title: String(item?.title ?? ""),
      description: String(item?.description ?? ""),
    })),
    ctaTitle: row.cta_title,
    ctaDescription: row.cta_description,
  }
}

function toBlogRow(post: Partial<BlogPost> & {
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  isPublished: boolean
  featuredImage?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  slug?: string
}): BlogRow {
  const timestamp = nowIso()
  const publishedAt = post.isPublished ? post.publishedAt || timestamp : null

  return {
    id: post.id ?? randomUUID(),
    slug: slugify(post.slug || post.title),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: post.featuredImage ?? null,
    category: post.category,
    tags: post.tags,
    seo_title: post.seoTitle ?? null,
    seo_description: post.seoDescription ?? null,
    is_published: post.isPublished,
    published_at: publishedAt,
    created_at: post.createdAt || timestamp,
    updated_at: timestamp,
  }
}

function fromBlogRow(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    featuredImage: row.featured_image,
    category: row.category,
    tags: asStringArray(row.tags),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProjectRow(project: Partial<Project> & {
  title: string
  category: string
  problem: string
  solution: string
  stack: string[]
  screenshots: string[]
  results: string
  featured: boolean
  isPublished: boolean
  slug?: string
}): ProjectRow {
  const timestamp = nowIso()

  return {
    id: project.id ?? randomUUID(),
    slug: slugify(project.slug || project.title),
    title: project.title,
    category: project.category,
    problem: project.problem,
    solution: project.solution,
    stack: project.stack,
    screenshots: project.screenshots,
    results: project.results,
    featured: project.featured,
    is_published: project.isPublished,
    created_at: project.createdAt || timestamp,
    updated_at: timestamp,
  }
}

function fromProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    problem: row.problem,
    solution: row.solution,
    stack: asStringArray(row.stack),
    screenshots: asStringArray(row.screenshots),
    results: row.results,
    featured: row.featured,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMessageRow(input: Omit<Message, "id" | "createdAt" | "status">): MessageRow {
  return {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    project_type: input.projectType,
    budget: input.budget,
    message: input.message,
    status: "new",
    created_at: nowIso(),
  }
}

function fromMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    projectType: row.project_type,
    budget: row.budget,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }
}

function toLeadRow(input: Partial<Lead> & {
  fullName: string
  email: string
  serviceInterestedIn: string
  message: string
}): LeadRow {
  const timestamp = nowIso()

  return {
    id: input.id ?? randomUUID(),
    full_name: input.fullName,
    company_name: input.companyName ?? null,
    email: input.email,
    phone: input.phone ?? null,
    country: input.country ?? null,
    budget: input.budget ?? null,
    timeline: input.timeline ?? null,
    service_interested_in: input.serviceInterestedIn,
    subject: input.subject ?? null,
    message: input.message,
    preferred_contact_method: input.preferredContactMethod ?? null,
    website_url: input.websiteUrl ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
    source: input.source ?? null,
    utm_source: input.utmSource ?? null,
    utm_medium: input.utmMedium ?? null,
    utm_campaign: input.utmCampaign ?? null,
    utm_term: input.utmTerm ?? null,
    utm_content: input.utmContent ?? null,
    status: input.status ?? "New",
    notes: input.notes ?? null,
    assigned_team_member: input.assignedTeamMember ?? null,
    created_at: input.createdAt ?? timestamp,
    updated_at: timestamp,
  }
}

function fromLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    fullName: row.full_name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    budget: row.budget,
    timeline: row.timeline,
    serviceInterestedIn: row.service_interested_in,
    subject: row.subject,
    message: row.message,
    preferredContactMethod: row.preferred_contact_method,
    websiteUrl: row.website_url,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    referrer: row.referrer,
    source: row.source,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmTerm: row.utm_term,
    utmContent: row.utm_content,
    status: row.status as LeadStatus,
    notes: row.notes,
    assignedTeamMember: row.assigned_team_member,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function filterLeads(leads: Lead[], filters?: LeadFilters) {
  if (!filters) return leads

  const search = filters.search?.trim().toLowerCase()
  const status = filters.status?.trim()
  const service = filters.service?.trim().toLowerCase()
  const fromTime = filters.from ? new Date(filters.from).getTime() : null
  const toTime = filters.to ? new Date(`${filters.to}T23:59:59.999Z`).getTime() : null

  return leads.filter((lead) => {
    const createdTime = new Date(lead.createdAt).getTime()
    const searchHaystack = [
      lead.fullName,
      lead.companyName,
      lead.email,
      lead.phone,
      lead.country,
      lead.serviceInterestedIn,
      lead.subject,
      lead.message,
      lead.source,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!search || searchHaystack.includes(search)) &&
      (!status || lead.status === status) &&
      (!service || lead.serviceInterestedIn.toLowerCase().includes(service)) &&
      (!fromTime || createdTime >= fromTime) &&
      (!toTime || createdTime <= toTime)
    )
  })
}

function toMediaRow(input: Omit<MediaAsset, "id" | "createdAt">): MediaRow {
  return {
    id: randomUUID(),
    name: input.name,
    alt: input.alt,
    url: input.url,
    storage_bucket: input.storageBucket ?? SUPABASE_MEDIA_BUCKET,
    storage_path: input.storagePath ?? null,
    mime_type: input.mimeType ?? null,
    size: input.size ?? null,
    created_at: nowIso(),
  }
}

function fromMediaRow(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    name: row.name,
    alt: row.alt,
    url: row.url,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  }
}

function toActivityRow(input: ActivityLog): ActivityRow {
  return {
    id: input.id,
    kind: input.kind,
    title: input.title,
    detail: input.detail,
    created_at: input.createdAt,
  }
}

function fromActivityRow(row: ActivityRow): ActivityLog {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    createdAt: row.created_at,
  }
}

async function ensureSupabaseSeeded() {
  if (!supabase) return

  const { count, error } = await supabaseClient.from(TABLES.homepage).select("id", { count: "exact", head: true })

  if (error) {
    throw error
  }

  if ((count ?? 0) > 0) {
    return
  }

  const store = normalizeStore(seed as Partial<CmsStore>)
  const homepage = await supabaseClient.from(TABLES.homepage).upsert(toHomeRow(store.homepage), {
    onConflict: "key",
  })
  if (homepage.error) throw homepage.error

  const blogs = await supabaseClient.from(TABLES.blogs).upsert(store.blogs.map(toBlogRow), {
    onConflict: "id",
  })
  if (blogs.error) throw blogs.error

  const projects = await supabaseClient.from(TABLES.projects).upsert(store.projects.map(toProjectRow), {
    onConflict: "id",
  })
  if (projects.error) throw projects.error

  const messages = await supabaseClient.from(TABLES.messages).upsert(
    store.messages.map((message) => ({
      id: message.id,
      name: message.name,
      email: message.email,
      company: message.company ?? null,
      project_type: message.projectType,
      budget: message.budget,
      message: message.message,
      status: message.status,
      created_at: message.createdAt,
    })),
    { onConflict: "id" },
  )
  if (messages.error) throw messages.error

  const leads = await supabaseClient.from(TABLES.leads).upsert(store.leads.map(toLeadRow), {
    onConflict: "id",
  })
  if (leads.error) throw leads.error

  const media = await supabaseClient.from(TABLES.media).upsert(
    store.media.map((asset) => ({
      id: asset.id,
      name: asset.name,
      alt: asset.alt,
      url: asset.url,
      storage_bucket: asset.storageBucket ?? SUPABASE_MEDIA_BUCKET,
      storage_path: asset.storagePath ?? null,
      mime_type: asset.mimeType ?? null,
      size: asset.size ?? null,
      created_at: asset.createdAt,
    })),
    { onConflict: "id" },
  )
  if (media.error) throw media.error

  const activity = await supabaseClient.from(TABLES.activity).upsert(store.activity.map(toActivityRow), {
    onConflict: "id",
  })
  if (activity.error) throw activity.error
}

async function addActivity(kind: string, title: string, detail: string) {
  if (!supabase) return

  await supabaseClient.from(TABLES.activity).insert({
    id: randomUUID(),
    kind,
    title,
    detail,
    created_at: nowIso(),
  })
}

async function deleteMediaObject(row: MediaAsset | null) {
  if (!supabase || !row?.storagePath) return

  const bucket = row.storageBucket || SUPABASE_MEDIA_BUCKET
  await supabaseClient.storage.from(bucket).remove([row.storagePath])
}

export async function getHomeContent(): Promise<HomeContent> {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => store.homepage)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.homepage).select("*").eq("key", "home").maybeSingle()
    if (error) throw error
    if (!data) return (seed as CmsStore).homepage
    return fromHomeRow(data as HomepageRow)
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => store.homepage)
    }
    throw error
  }
}

export async function saveHomeContent(input: HomeContent) {
  if (await shouldUseStoreFallbackForWrite(TABLES.homepage)) {
    const store = await updateStore((draft) => {
      draft.homepage = input
      draft.activity.unshift({
        id: randomUUID(),
        kind: "homepage",
        title: "Homepage content updated",
        detail: "Homepage hero, services, testimonials, stats, or CTA fields were saved.",
        createdAt: nowIso(),
      })
      return draft
    })

    return store.homepage
  }

  const row = toHomeRow(input)
  const { error } = await supabaseClient.from(TABLES.homepage).upsert(row, { onConflict: "key" })
  if (error) throw error

  await addActivity("homepage", "Homepage content updated", "Homepage hero, services, testimonials, stats, or CTA fields were saved.")
  return input
}

export async function listBlogPosts(options?: { publishedOnly?: boolean }) {
  const contentPosts = await listContentBlogPosts()

  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => {
      const posts = options?.publishedOnly ? store.blogs.filter((post) => post.isPublished) : store.blogs
      return sortNewest(mergeBlogSources(posts, contentPosts))
    })
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.blogs).select("*")
    if (error) throw error

    const posts = (data ?? []).map((row) => fromBlogRow(row as BlogRow))
    const filtered = options?.publishedOnly ? posts.filter((post) => post.isPublished) : posts
    return sortNewest(mergeBlogSources(filtered, contentPosts))
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => {
        const posts = options?.publishedOnly ? store.blogs.filter((post) => post.isPublished) : store.blogs
        return sortNewest(mergeBlogSources(posts, contentPosts))
      })
    }
    throw error
  }
}

export async function getBlogPostBySlug(slug: string) {
  if (!isSupabaseReady()) {
    const store = await readStore()
    return store.blogs.find((post) => post.slug === slug) ?? await getContentBlogPostBySlug(slug)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.blogs).select("*").eq("slug", slug).maybeSingle()
    if (error) throw error
    return data ? fromBlogRow(data as BlogRow) : await getContentBlogPostBySlug(slug)
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      const store = await readStore()
      return store.blogs.find((post) => post.slug === slug) ?? await getContentBlogPostBySlug(slug)
    }
    throw error
  }
}

export async function getBlogPostById(id: string) {
  if (id.startsWith("content:")) {
    const slug = id.replace(/^content:/, "")
    return getContentBlogPostBySlug(slug)
  }

  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => store.blogs.find((post) => post.id === id) ?? null)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.blogs).select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? fromBlogRow(data as BlogRow) : null
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => store.blogs.find((post) => post.id === id) ?? null)
    }
    throw error
  }
}

export async function saveBlogPost(
  input: Partial<BlogPost> & {
    title: string
    excerpt: string
    content: string
    category: string
    tags: string[]
    isPublished: boolean
    featuredImage?: string | null
    seoTitle?: string | null
    seoDescription?: string | null
    slug?: string
  },
) {
  if (await shouldUseStoreFallbackForWrite(TABLES.blogs)) {
    const timestamp = nowIso()
    const id = input.id ?? randomUUID()
    const slug = slugify(input.slug || input.title)
    const post: BlogPost = {
      id,
      slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      featuredImage: input.featuredImage ?? null,
      category: input.category,
      tags: input.tags,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? input.publishedAt || timestamp : null,
      createdAt: input.createdAt || timestamp,
      updatedAt: timestamp,
    }

    await updateStore((draft) => {
      const existingIndex = draft.blogs.findIndex((entry) => entry.id === id)
      if (existingIndex >= 0) draft.blogs[existingIndex] = post
      else draft.blogs.unshift(post)
      draft.activity.unshift({
        id: randomUUID(),
        kind: "blog",
        title: existingIndex >= 0 ? "Blog post updated" : "Blog post created",
        detail: post.title,
        createdAt: timestamp,
      })
      return draft
    })

    return post
  }

  const row = toBlogRow(input as Parameters<typeof toBlogRow>[0])
  const { error } = await supabaseClient.from(TABLES.blogs).upsert(row, { onConflict: "id" })
  if (error) throw error

  await addActivity(
    "blog",
    input.id ? "Blog post updated" : "Blog post created",
    row.title,
  )

  return fromBlogRow(row)
}

export async function deleteBlogPost(id: string) {
  if (await shouldUseStoreFallbackForWrite(TABLES.blogs)) {
    await updateStore((draft) => {
      const existing = draft.blogs.find((post) => post.id === id)
      draft.blogs = draft.blogs.filter((post) => post.id !== id)
      if (existing) {
        draft.activity.unshift({
          id: randomUUID(),
          kind: "blog",
          title: "Blog post deleted",
          detail: existing.title,
          createdAt: nowIso(),
        })
      }
      return draft
    })
    return
  }

  await ensureSupabaseSeeded()
  const existing = await getBlogPostById(id)
  const { error } = await supabaseClient.from(TABLES.blogs).delete().eq("id", id)
  if (error) throw error
  if (existing) {
    await addActivity("blog", "Blog post deleted", existing.title)
  }
}

export async function listProjects(options?: { publishedOnly?: boolean }) {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => {
      const projects = options?.publishedOnly ? store.projects.filter((project) => project.isPublished) : store.projects
      return sortNewest(projects)
    })
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.projects).select("*")
    if (error) throw error

    const projects = (data ?? []).map((row) => fromProjectRow(row as ProjectRow))
    const filtered = options?.publishedOnly ? projects.filter((project) => project.isPublished) : projects
    return sortNewest(filtered)
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => {
        const projects = options?.publishedOnly ? store.projects.filter((project) => project.isPublished) : store.projects
        return sortNewest(projects)
      })
    }
    throw error
  }
}

export async function getProjectBySlug(slug: string) {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => store.projects.find((project) => project.slug === slug) ?? null)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.projects).select("*").eq("slug", slug).maybeSingle()
    if (error) throw error
    return data ? fromProjectRow(data as ProjectRow) : null
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => store.projects.find((project) => project.slug === slug) ?? null)
    }
    throw error
  }
}

export async function getProjectById(id: string) {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => store.projects.find((project) => project.id === id) ?? null)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.projects).select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? fromProjectRow(data as ProjectRow) : null
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => store.projects.find((project) => project.id === id) ?? null)
    }
    throw error
  }
}

export async function saveProject(
  input: Partial<Project> & {
    title: string
    category: string
    problem: string
    solution: string
    stack: string[]
    screenshots: string[]
    results: string
    featured: boolean
    isPublished: boolean
    slug?: string
  },
) {
  if (await shouldUseStoreFallbackForWrite(TABLES.projects)) {
    const id = input.id ?? randomUUID()
    const timestamp = nowIso()
    const project: Project = {
      id,
      slug: slugify(input.slug || input.title),
      title: input.title,
      category: input.category,
      problem: input.problem,
      solution: input.solution,
      stack: input.stack,
      screenshots: input.screenshots,
      results: input.results,
      featured: input.featured,
      isPublished: input.isPublished,
      createdAt: input.createdAt || timestamp,
      updatedAt: timestamp,
    }

    await updateStore((draft) => {
      const existingIndex = draft.projects.findIndex((entry) => entry.id === id)
      if (existingIndex >= 0) draft.projects[existingIndex] = project
      else draft.projects.unshift(project)
      draft.activity.unshift({
        id: randomUUID(),
        kind: "project",
        title: existingIndex >= 0 ? "Project updated" : "Project created",
        detail: project.title,
        createdAt: timestamp,
      })
      return draft
    })

    return project
  }

  const row = toProjectRow(input as Parameters<typeof toProjectRow>[0])
  const { error } = await supabaseClient.from(TABLES.projects).upsert(row, { onConflict: "id" })
  if (error) throw error

  await addActivity(
    "project",
    input.id ? "Project updated" : "Project created",
    row.title,
  )

  return fromProjectRow(row)
}

export async function deleteProject(id: string) {
  if (await shouldUseStoreFallbackForWrite(TABLES.projects)) {
    await updateStore((draft) => {
      const existing = draft.projects.find((project) => project.id === id)
      draft.projects = draft.projects.filter((project) => project.id !== id)
      if (existing) {
        draft.activity.unshift({
          id: randomUUID(),
          kind: "project",
          title: "Project deleted",
          detail: existing.title,
          createdAt: nowIso(),
        })
      }
      return draft
    })
    return
  }

  await ensureSupabaseSeeded()
  const existing = await getProjectById(id)
  const { error } = await supabaseClient.from(TABLES.projects).delete().eq("id", id)
  if (error) throw error
  if (existing) {
    await addActivity("project", "Project deleted", existing.title)
  }
}

export async function listMessages() {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => sortNewest(store.messages))
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.messages).select("*")
    if (error) throw error
    return sortNewest((data ?? []).map((row) => fromMessageRow(row as MessageRow)))
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => sortNewest(store.messages))
    }
    throw error
  }
}

export async function createMessage(input: Omit<Message, "id" | "createdAt" | "status">) {
  if (await shouldUseStoreFallbackForWrite(TABLES.messages)) {
    const timestamp = nowIso()
    const message: Message = {
      id: randomUUID(),
      status: "new",
      createdAt: timestamp,
      ...input,
    }

    await updateStore((draft) => {
      draft.messages.unshift(message)
      draft.activity.unshift({
        id: randomUUID(),
        kind: "message",
        title: "New inquiry received",
        detail: `${message.name} - ${message.projectType}`,
        createdAt: timestamp,
      })
      return draft
    })

    return message
  }

  const row = toMessageRow(input)
  const { error } = await supabaseClient.from(TABLES.messages).insert(row)
  if (error) throw error

  await addActivity("message", "New inquiry received", `${row.name} - ${row.project_type}`)
  return fromMessageRow(row)
}

export async function listLeads(filters?: LeadFilters) {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => sortNewest(filterLeads(store.leads, filters)))
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.leads).select("*")
    if (error) throw error
    return sortNewest(filterLeads((data ?? []).map((row) => fromLeadRow(row as LeadRow)), filters))
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => sortNewest(filterLeads(store.leads, filters)))
    }
    throw error
  }
}

export async function getLeadById(id: string) {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => store.leads.find((lead) => lead.id === id) ?? null)
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.leads).select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? fromLeadRow(data as LeadRow) : null
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => store.leads.find((lead) => lead.id === id) ?? null)
    }
    throw error
  }
}

export async function createLead(
  input: Partial<Lead> & {
    fullName: string
    email: string
    serviceInterestedIn: string
    message: string
  },
) {
  if (await shouldUseStoreFallbackForWrite(TABLES.leads)) {
    const timestamp = nowIso()
    const lead: Lead = {
      id: input.id ?? randomUUID(),
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
      status: input.status ?? "New",
      notes: input.notes ?? null,
      assignedTeamMember: input.assignedTeamMember ?? null,
      createdAt: input.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    await updateStore((draft) => {
      draft.leads.unshift(lead)
      draft.messages.unshift({
        id: lead.id,
        name: lead.fullName,
        email: lead.email,
        company: lead.companyName,
        projectType: lead.serviceInterestedIn,
        budget: lead.budget ?? "Not specified",
        message: lead.message,
        status: "new",
        createdAt: lead.createdAt,
      })
      draft.activity.unshift({
        id: randomUUID(),
        kind: "lead",
        title: "New lead received",
        detail: `${lead.fullName} - ${lead.serviceInterestedIn}`,
        createdAt: timestamp,
      })
      return draft
    })

    await notifyLeadCreated(lead)
    return lead
  }

  const row = toLeadRow(input)
  const { error } = await supabaseClient.from(TABLES.leads).insert(row)
  if (error) throw error

  await addActivity("lead", "New lead received", `${row.full_name} - ${row.service_interested_in}`)
  const lead = fromLeadRow(row)
  await notifyLeadCreated(lead)
  return lead
}

export async function updateLead(
  id: string,
  input: Partial<Pick<Lead, "status" | "notes" | "assignedTeamMember">>,
) {
  if (await shouldUseStoreFallbackForWrite(TABLES.leads)) {
    const timestamp = nowIso()
    let updated: Lead | null = null

    await updateStore((draft) => {
      draft.leads = draft.leads.map((lead) => {
        if (lead.id !== id) return lead
        updated = {
          ...lead,
          status: input.status ?? lead.status,
          notes: input.notes ?? lead.notes ?? null,
          assignedTeamMember: input.assignedTeamMember ?? lead.assignedTeamMember ?? null,
          updatedAt: timestamp,
        }
        return updated
      })
      if (updated) {
        draft.activity.unshift({
          id: randomUUID(),
          kind: "lead",
          title: "Lead updated",
          detail: `${updated.fullName} - ${updated.status}`,
          createdAt: timestamp,
        })
      }
      return draft
    })

    return updated
  }

  const payload = {
    status: input.status,
    notes: input.notes ?? null,
    assigned_team_member: input.assignedTeamMember ?? null,
    updated_at: nowIso(),
  }

  const { data, error } = await supabaseClient
    .from(TABLES.leads)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error

  const lead = data ? fromLeadRow(data as LeadRow) : null
  if (lead) {
    await addActivity("lead", "Lead updated", `${lead.fullName} - ${lead.status}`)
  }

  return lead
}

export async function deleteLead(id: string) {
  if (await shouldUseStoreFallbackForWrite(TABLES.leads)) {
    await updateStore((draft) => {
      const existing = draft.leads.find((lead) => lead.id === id)
      draft.leads = draft.leads.filter((lead) => lead.id !== id)
      if (existing) {
        draft.activity.unshift({
          id: randomUUID(),
          kind: "lead",
          title: "Lead archived",
          detail: existing.fullName,
          createdAt: nowIso(),
        })
      }
      return draft
    })
    return
  }

  await ensureSupabaseSeeded()
  const existing = await getLeadById(id)
  const { error } = await supabaseClient.from(TABLES.leads).delete().eq("id", id)
  if (error) throw error
  if (existing) {
    await addActivity("lead", "Lead archived", existing.fullName)
  }
}

export async function listMedia() {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => sortNewest(store.media))
  }

  try {
    const mediaTableExists = await hasSupabaseTable(TABLES.media)
    if (!mediaTableExists) {
      return fallbackFromStore((store) => sortNewest(store.media))
    }

    const { data, error } = await supabaseClient.from(TABLES.media).select("*")
    if (error) throw error
    return sortNewest((data ?? []).map((row) => fromMediaRow(row as MediaRow)))
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => sortNewest(store.media))
    }
    throw error
  }
}

export async function addMediaAsset(
  input: Omit<MediaAsset, "id" | "createdAt">,
) {
  if (await shouldUseStoreFallbackForWrite(TABLES.media)) {
    const timestamp = nowIso()
    const asset: MediaAsset = {
      id: randomUUID(),
      createdAt: timestamp,
      ...input,
    }

    await updateStore((draft) => {
      draft.media.unshift(asset)
      draft.activity.unshift({
        id: randomUUID(),
        kind: "media",
        title: "Media asset added",
        detail: asset.name,
        createdAt: timestamp,
      })
      return draft
    })

    return asset
  }

  const row = toMediaRow(input)
  const { data, error } = await supabaseClient.from(TABLES.media).insert(row).select("*").single()
  if (error) throw error

  await addActivity("media", "Media asset added", row.name)
  return fromMediaRow(data as MediaRow)
}

export async function deleteMediaAsset(id: string) {
  if (await shouldUseStoreFallbackForWrite(TABLES.media)) {
    await updateStore((draft) => {
      const existing = draft.media.find((asset) => asset.id === id)
      draft.media = draft.media.filter((asset) => asset.id !== id)
      if (existing) {
        draft.activity.unshift({
          id: randomUUID(),
          kind: "media",
          title: "Media asset deleted",
          detail: existing.name,
          createdAt: nowIso(),
        })
      }
      return draft
    })
    return
  }

  await ensureSupabaseSeeded()
  const { data: existing, error: lookupError } = await supabaseClient
    .from(TABLES.media)
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (lookupError) throw lookupError

  if (existing) {
    await deleteMediaObject(fromMediaRow(existing as MediaRow))
  }

  const { error } = await supabaseClient.from(TABLES.media).delete().eq("id", id)
  if (error) throw error
  if (existing) {
    await addActivity("media", "Media asset deleted", (existing as MediaRow).name)
  }
}

export async function listActivity() {
  if (!isSupabaseReady()) {
    return fallbackFromStore((store) => sortNewest(store.activity))
  }

  try {
    await ensureSupabaseSeeded()
    const { data, error } = await supabaseClient.from(TABLES.activity).select("*")
    if (error) throw error
    return sortNewest((data ?? []).map((row) => fromActivityRow(row as ActivityRow)))
  } catch (error) {
    if (isMissingSupabaseTableError(error)) {
      return fallbackFromStore((store) => sortNewest(store.activity))
    }
    throw error
  }
}

export async function getDashboardMetrics() {
  const [blogs, projects, messages, leads, activity] = await Promise.all([
    listBlogPosts(),
    listProjects(),
    listMessages(),
    listLeads(),
    listActivity(),
  ])

  return {
    blogs: blogs.length,
    projects: projects.length,
    messages: messages.length,
    leads: leads.length,
    activity: activity.slice(0, 6),
  }
}

export function isRecent(dateValue: string) {
  const date = parseISO(dateValue)
  return isAfter(date, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))
}
