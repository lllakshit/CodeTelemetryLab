"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { deleteBlogPost, deleteMediaAsset, deleteProject, getBlogPostById, getHomeContent, getProjectById, saveBlogPost, saveHomeContent, saveProject } from "@/lib/cms"
import type { HomeContent } from "@/lib/store"

function csvList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function rowList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseSeparatedRow(value: string) {
  return value
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
}

const blogSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  slug: z.string().optional().default(""),
  excerpt: z.string().min(12),
  category: z.string().min(2),
  tags: z.string().optional().default(""),
  featuredImage: z.string().optional().default(""),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  content: z.string().min(20),
  isPublished: z.string().optional(),
})

export async function saveBlogAction(formData: FormData) {
  const parsed = blogSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    category: formData.get("category"),
    tags: formData.get("tags"),
    featuredImage: formData.get("featuredImage"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    content: formData.get("content"),
    isPublished: formData.get("isPublished"),
  })

  if (!parsed.success) {
    throw new Error("Invalid blog entry")
  }

  const existing = parsed.data.id ? await getBlogPostById(parsed.data.id) : null
  await saveBlogPost({
    ...existing,
    id: parsed.data.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    category: parsed.data.category,
    tags: csvList(formData.get("tags")),
    featuredImage: parsed.data.featuredImage || null,
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
    content: parsed.data.content,
    isPublished: Boolean(parsed.data.isPublished),
    createdAt: existing?.createdAt,
    publishedAt: existing?.publishedAt,
  })

  revalidatePath("/blog")
  revalidatePath("/projects")
  revalidatePath("/admin/blogs")
  revalidatePath("/admin/dashboard")
  redirect("/admin/blogs")
}

export async function deleteBlogAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Missing blog id")
  await deleteBlogPost(id)
  revalidatePath("/blog")
  revalidatePath("/admin/blogs")
  revalidatePath("/admin/dashboard")
  redirect("/admin/blogs")
}

const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  slug: z.string().optional().default(""),
  category: z.string().min(2),
  problem: z.string().min(20),
  solution: z.string().min(20),
  stack: z.string().optional().default(""),
  screenshots: z.string().optional().default(""),
  results: z.string().min(10),
  featured: z.string().optional(),
  isPublished: z.string().optional(),
})

export async function saveProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    problem: formData.get("problem"),
    solution: formData.get("solution"),
    stack: formData.get("stack"),
    screenshots: formData.get("screenshots"),
    results: formData.get("results"),
    featured: formData.get("featured"),
    isPublished: formData.get("isPublished"),
  })

  if (!parsed.success) {
    throw new Error("Invalid project entry")
  }

  const existing = parsed.data.id ? await getProjectById(parsed.data.id) : null
  await saveProject({
    ...existing,
    id: parsed.data.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    category: parsed.data.category,
    problem: parsed.data.problem,
    solution: parsed.data.solution,
    stack: csvList(formData.get("stack")),
    screenshots: csvList(formData.get("screenshots")),
    results: parsed.data.results,
    featured: Boolean(parsed.data.featured),
    isPublished: Boolean(parsed.data.isPublished),
    createdAt: existing?.createdAt,
  })

  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  revalidatePath("/admin/dashboard")
  redirect("/admin/projects")
}

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Missing project id")
  await deleteProject(id)
  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  revalidatePath("/admin/dashboard")
  redirect("/admin/projects")
}

const homepageSchema = z.object({
  heroEyebrow: z.string().min(3),
  heroTitle: z.string().min(10),
  heroDescription: z.string().min(20),
  primaryCtaLabel: z.string().min(2),
  primaryCtaHref: z.string().min(1),
  secondaryCtaLabel: z.string().min(2),
  secondaryCtaHref: z.string().min(1),
  ctaTitle: z.string().min(10),
  ctaDescription: z.string().min(20),
  servicesText: z.string().min(10),
  testimonialsText: z.string().min(10),
  statsText: z.string().min(10),
  processText: z.string().min(10),
})

export async function saveHomepageAction(formData: FormData) {
  const parsed = homepageSchema.safeParse({
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
    primaryCtaLabel: formData.get("primaryCtaLabel"),
    primaryCtaHref: formData.get("primaryCtaHref"),
    secondaryCtaLabel: formData.get("secondaryCtaLabel"),
    secondaryCtaHref: formData.get("secondaryCtaHref"),
    ctaTitle: formData.get("ctaTitle"),
    ctaDescription: formData.get("ctaDescription"),
    servicesText: formData.get("servicesText"),
    testimonialsText: formData.get("testimonialsText"),
    statsText: formData.get("statsText"),
    processText: formData.get("processText"),
  })

  if (!parsed.success) {
    throw new Error("Invalid homepage content")
  }

  const existing = await getHomeContent()

  const homepage: HomeContent = {
    ...existing,
    heroEyebrow: parsed.data.heroEyebrow,
    heroTitle: parsed.data.heroTitle,
    heroDescription: parsed.data.heroDescription,
    primaryCtaLabel: parsed.data.primaryCtaLabel,
    primaryCtaHref: parsed.data.primaryCtaHref,
    secondaryCtaLabel: parsed.data.secondaryCtaLabel,
    secondaryCtaHref: parsed.data.secondaryCtaHref,
    ctaTitle: parsed.data.ctaTitle,
    ctaDescription: parsed.data.ctaDescription,
    services: rowList(formData.get("servicesText")).map((line) => {
      const [title = "", description = "", notes = ""] = parseSeparatedRow(line)
      return { title, description, notes }
    }),
    testimonials: rowList(formData.get("testimonialsText")).map((line) => {
      const [name = "", role = "", quote = ""] = parseSeparatedRow(line)
      return { name, role, quote }
    }),
    stats: rowList(formData.get("statsText")).map((line) => {
      const [label = "", value = ""] = parseSeparatedRow(line)
      return { label, value }
    }),
    process: rowList(formData.get("processText")).map((line) => {
      const [title = "", description = ""] = parseSeparatedRow(line)
      return { title, description }
    }),
  }

  await saveHomeContent(homepage)
  revalidatePath("/")
  revalidatePath("/services")
  revalidatePath("/projects")
  revalidatePath("/blog")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/homepage")
  redirect("/admin/homepage")
}

export async function deleteMediaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) throw new Error("Missing media id")
  await deleteMediaAsset(id)
  revalidatePath("/admin/media")
  revalidatePath("/admin/dashboard")
  redirect("/admin/media")
}
