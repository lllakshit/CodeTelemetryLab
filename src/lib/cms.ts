import { randomUUID } from "node:crypto"
import { isAfter, isBefore, parseISO } from "date-fns"
import { slugify } from "@/lib/utils"
import type {
  ActivityLog,
  BlogPost,
  CmsStore,
  HomeContent,
  MediaAsset,
  Message,
  Project,
} from "@/lib/store"
import { readStore, updateStore } from "@/lib/store"

function nowIso() {
  return new Date().toISOString()
}

function toDate(value?: string | null) {
  return value ? new Date(value) : new Date(0)
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

export async function getHomeContent(): Promise<HomeContent> {
  const store = await readStore()
  return store.homepage
}

export async function saveHomeContent(input: HomeContent) {
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

export async function listBlogPosts(options?: { publishedOnly?: boolean }) {
  const store = await readStore()
  const posts = options?.publishedOnly
    ? store.blogs.filter((post) => post.isPublished)
    : store.blogs
  return sortNewest(posts)
}

export async function getBlogPostBySlug(slug: string) {
  const store = await readStore()
  return store.blogs.find((post) => post.slug === slug) ?? null
}

export async function getBlogPostById(id: string) {
  const store = await readStore()
  return store.blogs.find((post) => post.id === id) ?? null
}

export async function saveBlogPost(input: Partial<BlogPost> & {
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
}) {
  const id = input.id ?? randomUUID()
  const timestamp = nowIso()
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

export async function deleteBlogPost(id: string) {
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
}

export async function listProjects(options?: { publishedOnly?: boolean }) {
  const store = await readStore()
  const projects = options?.publishedOnly
    ? store.projects.filter((project) => project.isPublished)
    : store.projects
  return sortNewest(projects)
}

export async function getProjectBySlug(slug: string) {
  const store = await readStore()
  return store.projects.find((project) => project.slug === slug) ?? null
}

export async function getProjectById(id: string) {
  const store = await readStore()
  return store.projects.find((project) => project.id === id) ?? null
}

export async function saveProject(input: Partial<Project> & {
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
}) {
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

export async function deleteProject(id: string) {
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
}

export async function listMessages() {
  const store = await readStore()
  return sortNewest(store.messages)
}

export async function createMessage(input: Omit<Message, "id" | "createdAt" | "status">) {
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

export async function listMedia() {
  const store = await readStore()
  return sortNewest(store.media)
}

export async function addMediaAsset(input: Omit<MediaAsset, "id" | "createdAt">) {
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

export async function deleteMediaAsset(id: string) {
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
}

export async function listActivity() {
  const store = await readStore()
  return sortNewest(store.activity)
}

export async function getDashboardMetrics() {
  const [blogs, projects, messages, activity] = await Promise.all([
    listBlogPosts(),
    listProjects(),
    listMessages(),
    listActivity(),
  ])

  return {
    blogs: blogs.length,
    projects: projects.length,
    messages: messages.length,
    activity: activity.slice(0, 6),
  }
}

export function isRecent(dateValue: string) {
  const date = parseISO(dateValue)
  return isAfter(date, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))
}
