import type { BlogPost } from "@/lib/store"

/**
 * Template-generated drafts leaked their internal SEO brief into published copy
 * (keyword tables, "image plan", "schema recommendations") and into meta descriptions.
 * These helpers detect that, strip it, and pick real cover art, so nothing internal
 * is ever rendered or indexed.
 */

const INTERNAL_SECTION_TITLES = [
  "seo brief for this article",
  "internal linking suggestions",
  "image and infographic plan",
  "schema recommendations",
]

const META_LEAK_PATTERN = /image ideas,\s*schema,\s*and\s*cta strategy/i
const NON_COVER_IMAGE_PATTERN = /(^|\/)(og-image\.svg|ct-labs-[a-z-]+\.(png|svg)|bimi-logo\.svg)$/i

export function hasTemplateLeak(post: Pick<BlogPost, "content" | "seoDescription">) {
  const content = post.content ?? ""
  return (
    INTERNAL_SECTION_TITLES.some((title) => new RegExp(`^#{2,3}\\s+${title}\\s*$`, "im").test(content)) ||
    META_LEAK_PATTERN.test(post.seoDescription ?? "")
  )
}

/** Remove internal-only `##` sections (up to the next `##` heading) from article markdown. */
export function stripInternalSections(content: string) {
  const lines = content.split(/\r?\n/)
  const kept: string[] = []
  let skipping = false

  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.*?)\s*$/)
    if (heading && heading[1] === "##") {
      skipping = INTERNAL_SECTION_TITLES.includes(heading[2].trim().toLowerCase())
    }
    if (!skipping) kept.push(line)
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n")
}

/** Meta descriptions must read like copy, never like a keyword brief. */
export function cleanSeoDescription(post: Pick<BlogPost, "seoDescription" | "excerpt">) {
  const description = (post.seoDescription ?? "").trim()
  if (description && !META_LEAK_PATTERN.test(description)) return description
  return (post.excerpt ?? "").trim()
}

/** Returns a real cover image URL, or null when the post only has the site logo / OG placeholder. */
export function realCoverImage(post: Pick<BlogPost, "featuredImage">) {
  const src = post.featuredImage?.trim()
  if (!src || NON_COVER_IMAGE_PATTERN.test(src)) return null
  return src
}
