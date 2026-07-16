import { execFileSync } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { createHash, randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const cwd = process.cwd()
const manifestPath = path.join(cwd, "data", "blog-cover-migration-manifest.json")
const localOutDir = path.join(cwd, ".cover-work", "wikimedia")
const defaultCoverValues = new Set(["", "/og-image.svg"])

const args = parseArgs(process.argv.slice(2))
const limit = Number(args.limit ?? 0)
const dryRun = Boolean(args["dry-run"])
const force = Boolean(args.force)
const includeContent = args["include-content"] !== "false"
const projectRef = String(args["project-ref"] || process.env.SUPABASE_PROJECT_REF || "miqmfqpwoyvcntoqprvm")

const style = {
  width: 1600,
  height: 900,
  quality: 78,
  brand: "#0f172a",
  accent: "#2563eb",
  surface: "#ffffff",
}

async function main() {
  const env = await loadEnvFiles([".env.local", ".env", ".vercel/.env.production.local"])
  const supabaseUrl = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_URL,
    `https://${projectRef}.supabase.co`,
  )
  const serviceRoleKey = firstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_SERVICE_ROLE_KEY,
    await getServiceRoleKeyFromCli(projectRef),
  )

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run `npx supabase login`.")
  }

  await mkdir(localOutDir, { recursive: true })
  await mkdir(path.dirname(manifestPath), { recursive: true })

  const manifest = await readJson(manifestPath, {
    startedAt: new Date().toISOString(),
    provider: "wikimedia-commons-openverse",
    processed: {},
    failures: {},
  })

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  if (includeContent) {
    const contentPosts = await readContentPosts()
    if (contentPosts.length && !dryRun) {
      await upsertContentPosts(supabase, contentPosts)
    }
    console.log(`Content MDX posts available for DB upsert: ${contentPosts.length}`)
  }

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, category, tags, featured_image, featured_image_source_url")
    .eq("is_published", true)
    .order("created_at", { ascending: true })

  if (error) throw error

  const candidates = posts.filter((post) => force || needsCover(post))
  const selected = limit > 0 ? candidates.slice(0, limit) : candidates
  const usedSources = new Set(Object.values(manifest.processed).map((entry) => entry.sourceUrl).filter(Boolean))
  const summary = {
    totalBlogs: posts.length,
    selected: selected.length,
    processed: 0,
    skipped: posts.length - candidates.length,
    generated: 0,
    uploaded: 0,
    updated: 0,
    failed: 0,
  }

  console.log(`Blogs in DB: ${posts.length}`)
  console.log(`Blogs needing covers: ${candidates.length}`)
  console.log(`Processing this run: ${selected.length}${dryRun ? " (dry run)" : ""}`)

  for (const post of selected) {
    try {
      const existingManifestUrl = manifest.processed[post.slug]?.publicUrl || ""
      if (!force && existingManifestUrl && !existingManifestUrl.startsWith("dry-run://")) {
        summary.skipped += 1
        continue
      }

      const queries = buildSearchQueries(post)
      const match = await findOpenImage(queries, usedSources)
      if (!match) {
        throw new Error(`No usable Wikimedia image found for queries: ${queries.join(" | ")}`)
      }

      usedSources.add(match.sourceUrl)
      const input = await downloadImage(match.imageUrl)
      const cover = await renderCover(input, post, match)
      const localPath = path.join(localOutDir, `${post.slug}.webp`)
      await writeFile(localPath, cover)
      summary.generated += 1

      const storagePath = `blog-covers/${post.slug}.webp`
      let publicUrl = `dry-run://${storagePath}`

      if (!dryRun) {
        const { error: uploadError } = await supabase.storage.from("media-assets").upload(storagePath, cover, {
          cacheControl: "31536000",
          contentType: "image/webp",
          upsert: true,
        })
        if (uploadError) throw uploadError
        summary.uploaded += 1

        const { data: publicData } = supabase.storage.from("media-assets").getPublicUrl(storagePath)
        publicUrl = publicData.publicUrl

        const attribution = attributionText(match)
        const { error: mediaError } = await supabase.from("media_assets").insert({
          name: `Blog cover: ${post.title}`.slice(0, 160),
          alt: `Cover image for ${post.title}`,
          url: publicUrl,
          storage_bucket: "media-assets",
          storage_path: storagePath,
          mime_type: "image/webp",
          size: cover.byteLength,
        })
        if (mediaError) throw mediaError

        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({
            featured_image: publicUrl,
            featured_image_attribution: attribution,
            featured_image_source_url: match.sourceUrl,
            featured_image_license: match.license,
            featured_image_license_url: match.licenseUrl,
          })
          .eq("id", post.id)
        if (updateError) throw updateError
        summary.updated += 1
      }

      manifest.processed[post.slug] = {
        blogId: post.id,
        title: post.title,
        publicUrl,
        localPath,
        sourceUrl: match.sourceUrl,
        sourceTitle: match.title,
        author: match.author,
        license: match.license,
        licenseUrl: match.licenseUrl,
        processedAt: new Date().toISOString(),
      }
      delete manifest.failures[post.slug]
      summary.processed += 1
      await writeManifest(manifest)
      console.log(`OK ${post.slug} -> ${publicUrl}`)
    } catch (error) {
      summary.failed += 1
      manifest.failures[post.slug] = {
        title: post.title,
        error: error instanceof Error ? error.message : String(error),
        failedAt: new Date().toISOString(),
      }
      await writeManifest(manifest)
      console.error(`FAIL ${post.slug}: ${manifest.failures[post.slug].error}`)
    }
  }

  manifest.lastRunAt = new Date().toISOString()
  manifest.lastSummary = summary
  await writeManifest(manifest)
  console.log(JSON.stringify(summary, null, 2))
}

function needsCover(post) {
  const image = String(post.featured_image ?? "").trim()
  return defaultCoverValues.has(image)
}

function buildSearchQueries(post) {
  const title = post.title.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim()
  const tags = Array.isArray(post.tags) ? post.tags.join(" ") : ""
  const category = post.category || ""
  const slugTerms = post.slug.split("-").filter((part) => part.length > 3).slice(0, 4).join(" ")
  const sector = sectorKeyword(`${title} ${tags} ${category} ${slugTerms}`)
  return unique([
    `${title} ${sector}`.trim(),
    `${slugTerms} ${sector}`.trim(),
    `${sector} laptop`,
    `${sector} office`,
    `${sector} technology`,
    `${category} software dashboard`,
    `${sector} business technology`,
    ...fallbackQueriesForSector(sector),
    "office laptop business",
    "business meeting laptop",
    "business professional laptop",
    "people working laptop office",
    "computer workstation office",
    "technology team meeting",
    "software engineer laptop",
    "server room technology",
  ]).filter(Boolean)
}

function sectorKeyword(text) {
  const lower = text.toLowerCase()
  const pairs = [
    ["redis", "server room technology"],
    ["cache", "server room technology"],
    ["docker", "software development"],
    ["kubernetes", "cloud infrastructure"],
    ["devops", "software development"],
    ["ci cd", "software development"],
    ["aws", "cloud infrastructure"],
    ["azure", "cloud infrastructure"],
    ["google cloud", "cloud infrastructure"],
    ["cloud", "cloud infrastructure"],
    ["database", "database technology"],
    ["postgres", "database technology"],
    ["mongodb", "database technology"],
    ["stripe", "online payment"],
    ["razorpay", "online payment"],
    ["payment", "online payment"],
    ["crm", "customer relationship management"],
    ["erp", "business operations"],
    ["pwa", "mobile application"],
    ["flutter", "mobile application"],
    ["react native", "mobile application"],
    ["microservices", "software architecture"],
    ["health", "healthcare technology"],
    ["finance", "finance technology"],
    ["ecommerce", "ecommerce business"],
    ["shopify", "online store"],
    ["restaurant", "restaurant business"],
    ["real estate", "real estate office"],
    ["education", "online education"],
    ["analytics", "analytics dashboard"],
    ["security", "cybersecurity"],
    ["automation", "business automation"],
    ["seo", "search engine optimization"],
    ["website", "website design"],
    ["mobile", "mobile application"],
    ["api", "application programming interface"],
    ["saas", "software as a service"],
  ]
  return pairs.find(([needle]) => lower.includes(needle))?.[1] ?? "business technology"
}

function fallbackQueriesForSector(sector) {
  if (sector.includes("server room")) return ["server room technology", "data center servers", "network operations center"]
  if (sector.includes("cloud")) return ["cloud computing data center", "server room technology", "software engineer laptop"]
  if (sector.includes("database")) return ["database server room", "data center servers", "computer workstation office"]
  if (sector.includes("payment")) return ["online payment terminal", "credit card payment business", "ecommerce checkout"]
  if (sector.includes("customer relationship")) return ["business meeting laptop", "customer service office", "office laptop business"]
  if (sector.includes("business operations")) return ["operations management office", "business meeting laptop", "people working laptop office"]
  if (sector.includes("software architecture")) return ["software engineer laptop", "developer conference laptop", "server room technology"]
  if (sector.includes("healthcare")) return ["healthcare technology laptop", "medical office computer"]
  if (sector.includes("finance")) return ["finance office laptop", "business analytics computer"]
  if (sector.includes("ecommerce") || sector.includes("online store")) return ["online shopping laptop", "ecommerce warehouse"]
  if (sector.includes("restaurant")) return ["restaurant technology tablet", "restaurant point of sale"]
  if (sector.includes("education")) return ["online education laptop", "classroom technology"]
  if (sector.includes("analytics")) return ["business analytics computer", "data visualization screen"]
  if (sector.includes("cybersecurity")) return ["cybersecurity computer", "server room technology"]
  if (sector.includes("automation")) return ["industrial automation control room", "business process automation"]
  if (sector.includes("search engine")) return ["web design computer", "office laptop business"]
  if (sector.includes("mobile")) return ["mobile application smartphone", "smartphone app development"]
  if (sector.includes("api")) return ["software development laptop", "server room technology"]
  if (sector.includes("software")) return ["software development laptop", "web design computer"]
  return ["office laptop business", "web design computer"]
}

async function findOpenImage(queries, usedSources) {
  return (await findCommonsImage(queries, usedSources)) ?? (await findOpenverseImage(queries, usedSources))
}

async function findCommonsImage(queries, usedSources) {
  for (const query of queries) {
    const url = new URL("https://commons.wikimedia.org/w/api.php")
    url.searchParams.set("action", "query")
    url.searchParams.set("format", "json")
    url.searchParams.set("origin", "*")
    url.searchParams.set("generator", "search")
    url.searchParams.set("gsrnamespace", "6")
    url.searchParams.set("gsrsearch", query)
    url.searchParams.set("gsrlimit", "12")
    url.searchParams.set("prop", "imageinfo")
    url.searchParams.set("iiprop", "url|mime|size|dimensions|extmetadata")
    url.searchParams.set("iiurlwidth", String(style.width))

    const response = await fetch(url, { headers: wikimediaHeaders() })
    if (!response.ok) continue
    const data = await response.json()
    const pages = Object.values(data.query?.pages ?? {})
    const candidates = pages.map(normalizeCommonsPage).filter(Boolean)
    const match = candidates
      .filter((item) => !usedSources.has(item.sourceUrl))
      .find((item) => isUsableImage(item))
    if (match) return match
  }
  return null
}

async function findOpenverseImage(queries, usedSources) {
  for (const query of queries) {
    const url = new URL("https://api.openverse.engineering/v1/images/")
    url.searchParams.set("q", query)
    url.searchParams.set("license_type", "commercial,modification")
    url.searchParams.set("page_size", "20")
    url.searchParams.set("mature", "false")

    const response = await fetch(url, { headers: wikimediaHeaders() })
    if (!response.ok) continue
    const data = await response.json()
    const candidates = (data.results ?? []).map(normalizeOpenverseImage).filter(Boolean)
    const match = candidates
      .filter((item) => !usedSources.has(item.sourceUrl))
      .find((item) => isUsableOpenverseImage(item))
    if (match) return match
  }
  return null
}

function normalizeCommonsPage(page) {
  const info = page.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata ?? {}
  return {
    title: cleanHtml(meta.ObjectName?.value || page.title?.replace(/^File:/, "") || "Wikimedia Commons image"),
    imageUrl: info.thumburl || info.url,
    sourceUrl: meta.AssetUrl?.value || info.descriptionurl,
    mime: info.mime,
    width: Number(info.thumbwidth || info.width || 0),
    height: Number(info.thumbheight || info.height || 0),
    author: cleanHtml(meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons contributor"),
    license: cleanHtml(meta.LicenseShortName?.value || meta.UsageTerms?.value || "Wikimedia Commons license"),
    licenseUrl: meta.LicenseUrl?.value || "",
    description: cleanHtml(meta.ImageDescription?.value || ""),
  }
}

function normalizeOpenverseImage(item) {
  const sourceUrl = item.foreign_landing_url || item.url
  const imageUrl = item.url || item.thumbnail
  if (!sourceUrl || !imageUrl) return null
  const license = formatOpenverseLicense(item.license, item.license_version)
  return {
    title: cleanHtml(item.title || "Openverse image"),
    imageUrl,
    sourceUrl,
    mime: item.mime_type || "",
    width: Number(item.width || 0),
    height: Number(item.height || 0),
    author: cleanHtml(item.creator || item.provider || "Openverse contributor"),
    license,
    licenseUrl: item.license_url || "",
    description: cleanHtml(item.description || item.tags?.map((tag) => tag.name).join(", ") || ""),
    provider: item.source || item.provider || "openverse",
  }
}

function isUsableImage(image) {
  if (!image.imageUrl || !image.sourceUrl) return false
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.mime)) return false
  if (image.width < 900 || image.height < 500) return false
  const license = `${image.license} ${image.licenseUrl}`.toLowerCase()
  return !license.includes("noncommercial") && !license.includes("cc-by-nc") && !license.includes("no derivatives")
}

function isUsableOpenverseImage(image) {
  if (!image.imageUrl || !image.sourceUrl) return false
  const lowerUrl = image.imageUrl.toLowerCase()
  if (lowerUrl.endsWith(".svg") || lowerUrl.endsWith(".gif") || lowerUrl.endsWith(".pdf")) return false
  const license = `${image.license} ${image.licenseUrl}`.toLowerCase()
  return !license.includes("nc") && !license.includes("nd") && !license.includes("sampling")
}

function formatOpenverseLicense(license, version) {
  const normalized = String(license || "").toUpperCase()
  if (!normalized) return "Openverse license"
  if (normalized === "PDM") return "Public Domain Mark"
  if (normalized === "CC0") return "CC0"
  return `CC ${normalized.replace(/-/g, "-").replace(/^CC\s+/, "")}${version ? ` ${version}` : ""}`
}

async function downloadImage(url) {
  const response = await fetch(url, { headers: wikimediaHeaders() })
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function renderCover(input, post, image) {
  const title = wrapText(post.title, 38, 3)
  const category = escapeXml(post.category || "CodeTelemetryLabs")
  const source = escapeXml(image.title).slice(0, 90)
  const overlay = `
    <svg width="${style.width}" height="${style.height}" viewBox="0 0 ${style.width} ${style.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.82"/>
          <stop offset="48%" stop-color="#0f172a" stop-opacity="0.46"/>
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0.28"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#shade)"/>
      <rect x="92" y="84" width="255" height="42" rx="21" fill="#ffffff" fill-opacity="0.92"/>
      <text x="120" y="112" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="${style.accent}" letter-spacing="2">${category.toUpperCase().slice(0, 22)}</text>
      <text x="92" y="610" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="${style.surface}">
        ${title.map((line, index) => `<tspan x="92" dy="${index === 0 ? 0 : 86}">${escapeXml(line)}</tspan>`).join("")}
      </text>
      <rect x="92" y="772" width="420" height="4" rx="2" fill="${style.accent}"/>
      <text x="92" y="826" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="#dbeafe">CodeTelemetryLabs editorial cover</text>
      <text x="92" y="858" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#cbd5e1">${source}</text>
    </svg>
  `
  return sharp(input)
    .resize(style.width, style.height, { fit: "cover", position: "attention" })
    .modulate({ saturation: 0.85, brightness: 0.92 })
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .webp({ quality: style.quality, effort: 5 })
    .toBuffer()
}

async function upsertContentPosts(supabase, posts) {
  const rows = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: post.featuredImage || "/og-image.svg",
    category: post.category,
    tags: post.tags,
    seo_title: post.seoTitle || post.title,
    seo_description: post.seoDescription || post.excerpt,
    is_published: true,
    published_at: post.publishedAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  }))
  const { error } = await supabase.from("blog_posts").upsert(rows, { onConflict: "slug" })
  if (error) throw error
}

async function readContentPosts() {
  const dir = path.join(cwd, "content", "blog")
  let entries = []
  try {
    entries = (await import("node:fs/promises")).readdir(dir)
    entries = await entries
  } catch {
    return []
  }
  const posts = []
  for (const entry of entries.filter((item) => item.endsWith(".mdx"))) {
    const raw = await readFile(path.join(dir, entry), "utf8")
    const { frontmatter, body } = parseFrontmatter(raw)
    const slug = asString(frontmatter.slug) || entry.replace(/\.mdx$/, "")
    const title = asString(frontmatter.title)
    const excerpt = asString(frontmatter.description)
    const date = asString(frontmatter.date) || new Date().toISOString()
    if (!slug || !title || !excerpt) continue
    posts.push({
      slug,
      title,
      excerpt,
      content: body,
      featuredImage: asString(frontmatter.featuredImage) || "/og-image.svg",
      category: asString(frontmatter.category) || "Business",
      tags: asStringArray(frontmatter.tags),
      seoTitle: asString(frontmatter.seoTitle) || title,
      seoDescription: asString(frontmatter.seoDescription) || excerpt,
      publishedAt: date,
      createdAt: date,
      updatedAt: date,
    })
  }
  return posts
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { frontmatter: {}, body: raw }
  const closeIndex = raw.indexOf("\n---", 3)
  if (closeIndex < 0) return { frontmatter: {}, body: raw }
  const frontmatter = {}
  const text = raw.slice(3, closeIndex).trim()
  const body = raw.slice(closeIndex + 4).trimStart()
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    const value = stripQuotes(match[2].trim())
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        frontmatter[match[1]] = JSON.parse(value)
      } catch {
        frontmatter[match[1]] = value.slice(1, -1).split(",").map((item) => stripQuotes(item.trim())).filter(Boolean)
      }
    } else {
      frontmatter[match[1]] = value
    }
  }
  return { frontmatter, body }
}

function attributionText(image) {
  return `${image.title} by ${image.author}`
}

function wikimediaHeaders() {
  return {
    "User-Agent": process.env.WIKIMEDIA_USER_AGENT || "CodeTelemetryLabsBlogCoverBot/1.0 (https://www.codetelemetrylab.me)",
  }
}

function wrapText(text, maxLength, maxLines) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
    if (lines.length === maxLines - 1) break
  }
  if (current) lines.push(current)
  if (lines.length > maxLines) return lines.slice(0, maxLines)
  if (words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]$/, "")}...`
  }
  return lines
}

function asString(value) {
  return Array.isArray(value) ? value.join(", ") : value ?? ""
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.map(String)
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function cleanHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function loadEnvFiles(files) {
  const env = {}
  for (const file of files) {
    try {
      Object.assign(env, parseEnv(await readFile(path.join(cwd, file), "utf8")))
    } catch {
      // Ignore missing env files.
    }
  }
  return env
}

function parseEnv(raw) {
  const result = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index < 0) continue
    result[trimmed.slice(0, index).trim()] = stripQuotes(trimmed.slice(index + 1).trim())
  }
  return result
}

async function getServiceRoleKeyFromCli(ref) {
  try {
    const safeRef = String(ref).replace(/[^a-z0-9]/gi, "")
    const stdout =
      process.platform === "win32"
        ? execFileSync("cmd.exe", ["/d", "/s", "/c", `npx supabase projects api-keys --project-ref ${safeRef} --reveal --output json`], {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
          })
        : execFileSync("npx", ["supabase", "projects", "api-keys", "--project-ref", safeRef, "--reveal", "--output", "json"], {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
          })
    const keys = JSON.parse(stdout)
    return keys.find((key) => key.name === "service_role")?.api_key || ""
  } catch {
    return ""
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"))
  } catch {
    return fallback
  }
}

async function writeManifest(manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

function parseArgs(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith("--")) continue
    const key = value.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith("--")) {
      parsed[key] = true
    } else {
      parsed[key] = next
      index += 1
    }
  }
  return parsed
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim()
}

function unique(values) {
  return [...new Set(values)]
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
