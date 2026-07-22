import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import type { BlogPost } from "@/lib/store"

const blogContentDir = path.join(process.cwd(), "content", "blog")

type Frontmatter = Record<string, string | string[]>

function stripQuotes(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---")) {
    return { frontmatter: {} as Frontmatter, body: raw }
  }

  const closeIndex = raw.indexOf("\n---", 3)
  if (closeIndex < 0) {
    return { frontmatter: {} as Frontmatter, body: raw }
  }

  const frontmatterText = raw.slice(3, closeIndex).trim()
  const body = raw.slice(closeIndex + 4).trimStart()
  const frontmatter: Frontmatter = {}

  for (const line of frontmatterText.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    const value = rawValue.trim()
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        const parsed = JSON.parse(value)
        frontmatter[key] = Array.isArray(parsed) ? parsed.map((item) => String(item)) : stripQuotes(value)
      } catch {
        frontmatter[key] = value
          .slice(1, -1)
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter(Boolean)
      }
      continue
    }

    frontmatter[key] = stripQuotes(value)
  }

  return { frontmatter, body }
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(", ") : value ?? ""
}

function asStringArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function isDraft(value: string | string[] | undefined) {
  const normalized = asString(value).trim().toLowerCase()
  return normalized === "true" || normalized === "yes"
}

export async function listContentBlogPosts(): Promise<BlogPost[]> {
  let entries: string[]

  try {
    entries = await readdir(blogContentDir)
  } catch {
    return []
  }

  const posts = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".mdx"))
      .map(async (entry) => {
        const filePath = path.join(blogContentDir, entry)
        const raw = await readFile(filePath, "utf8")
        const { frontmatter, body } = parseFrontmatter(raw)
        const slug = asString(frontmatter.slug) || entry.replace(/\.mdx$/, "")
        const date = asString(frontmatter.date) || new Date().toISOString()
        const title = asString(frontmatter.title)
        const description = asString(frontmatter.description)
        const draft = isDraft(frontmatter.draft)

        return {
          id: `content:${slug}`,
          slug,
          title,
          excerpt: description,
          content: body,
          featuredImage: asString(frontmatter.featuredImage) || "/brand/ct-labs-logo.png",
          category: asString(frontmatter.category) || "Business",
          tags: asStringArray(frontmatter.tags),
          seoTitle: asString(frontmatter.seoTitle) || title,
          seoDescription: asString(frontmatter.seoDescription) || description,
          isPublished: !draft,
          publishedAt: date,
          createdAt: date,
          updatedAt: date,
          source: "content" as const,
          readingTime: asString(frontmatter.readingTime) || null,
          primaryKeyword: asString(frontmatter.primaryKeyword) || null,
          searchIntent: asString(frontmatter.searchIntent) || null,
          targetAudience: asString(frontmatter.targetAudience) || null,
        }
      }),
  )

  return posts.filter((post) => post.title && post.slug && post.excerpt && post.isPublished)
}

export async function getContentBlogPostBySlug(slug: string) {
  const posts = await listContentBlogPosts()
  return posts.find((post) => post.slug === slug) ?? null
}
