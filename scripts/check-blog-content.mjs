import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

/**
 * CI guard: published MDX articles must not contain template-generated SEO-brief text.
 * (Drafts under content/blog/_factory-drafts are archived and never published.)
 */
const blogDir = path.join(process.cwd(), "content", "blog")

const INTERNAL_HEADINGS = [
  "seo brief for this article",
  "internal linking suggestions",
  "image and infographic plan",
  "schema recommendations",
]
const META_LEAK = /image ideas,\s*schema,\s*and\s*cta strategy/i

function frontmatterValue(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"))
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : ""
}

const files = (await readdir(blogDir)).filter((name) => name.endsWith(".mdx"))
const problems = []

for (const file of files) {
  const raw = await readFile(path.join(blogDir, file), "utf8")
  if (/^draft:\s*true\s*$/m.test(raw)) continue

  for (const heading of INTERNAL_HEADINGS) {
    if (new RegExp(`^#{2,3}\\s+${heading}\\s*$`, "im").test(raw)) {
      problems.push(`${file}: contains internal section "${heading}"`)
    }
  }

  const description = frontmatterValue(raw, "seoDescription") || frontmatterValue(raw, "description")
  if (!description) problems.push(`${file}: missing description`)
  else if (META_LEAK.test(description)) problems.push(`${file}: meta description contains template text`)
  else if (description.length < 70 || description.length > 200) {
    problems.push(`${file}: description is ${description.length} chars (expected 70-200)`)
  }

  if (!frontmatterValue(raw, "title")) problems.push(`${file}: missing title`)
}

if (problems.length) {
  console.error(`Blog content check failed (${problems.length}):`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`Blog content check passed for ${files.length} article files.`)
