import { readFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

const cwd = process.cwd()

async function main() {
  const env = await loadEnvFiles([".env.local", ".env"])
  const supabaseUrl = firstNonEmpty(env.NEXT_PUBLIC_SUPABASE_URL, env.API_URL)
  const serviceRoleKey = firstNonEmpty(env.SUPABASE_SERVICE_ROLE_KEY, env.my_secret_key)

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase server credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or my_secret_key).")
    process.exitCode = 1
    return
  }

  const seedPath = path.join(cwd, "data", "cms-store.json")
  const raw = await readFile(seedPath, "utf8")
  const store = JSON.parse(raw)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  await upsertOrThrow(
    supabase.from("homepage_content").upsert(
      {
        key: store.homepage.key,
        hero_eyebrow: store.homepage.heroEyebrow,
        hero_title: store.homepage.heroTitle,
        hero_description: store.homepage.heroDescription,
        primary_cta_label: store.homepage.primaryCtaLabel,
        primary_cta_href: store.homepage.primaryCtaHref,
        secondary_cta_label: store.homepage.secondaryCtaLabel,
        secondary_cta_href: store.homepage.secondaryCtaHref,
        services: store.homepage.services,
        testimonials: store.homepage.testimonials,
        stats: store.homepage.stats,
        process: store.homepage.process,
        cta_title: store.homepage.ctaTitle,
        cta_description: store.homepage.ctaDescription,
      },
      { onConflict: "key" },
    ),
    "homepage_content",
  )

  await upsertOrThrow(
    supabase.from("blog_posts").upsert(
      store.blogs.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        featured_image: post.featuredImage ?? null,
        category: post.category,
        tags: post.tags,
        seo_title: post.seoTitle ?? null,
        seo_description: post.seoDescription ?? null,
        is_published: post.isPublished,
        published_at: post.publishedAt ?? null,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      })),
      { onConflict: "id" },
    ),
    "blog_posts",
  )

  await upsertOrThrow(
    supabase.from("projects").upsert(
      store.projects.map((project) => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: project.category,
        problem: project.problem,
        solution: project.solution,
        stack: project.stack,
        screenshots: project.screenshots,
        results: project.results,
        featured: project.featured,
        is_published: project.isPublished,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      })),
      { onConflict: "id" },
    ),
    "projects",
  )

  await upsertOrThrow(
    supabase.from("leads").upsert(
      (store.leads ?? []).map((lead) => ({
        id: lead.id,
        full_name: lead.fullName,
        company_name: lead.companyName ?? null,
        email: lead.email,
        phone: lead.phone ?? null,
        country: lead.country ?? null,
        budget: lead.budget ?? null,
        timeline: lead.timeline ?? null,
        service_interested_in: lead.serviceInterestedIn,
        subject: lead.subject ?? null,
        message: lead.message,
        preferred_contact_method: lead.preferredContactMethod ?? null,
        website_url: lead.websiteUrl ?? null,
        ip_address: lead.ipAddress ?? null,
        user_agent: lead.userAgent ?? null,
        referrer: lead.referrer ?? null,
        source: lead.source ?? null,
        utm_source: lead.utmSource ?? null,
        utm_medium: lead.utmMedium ?? null,
        utm_campaign: lead.utmCampaign ?? null,
        utm_term: lead.utmTerm ?? null,
        utm_content: lead.utmContent ?? null,
        status: lead.status,
        notes: lead.notes ?? null,
        assigned_team_member: lead.assignedTeamMember ?? null,
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
      })),
      { onConflict: "id" },
    ),
    "leads",
  )

  console.log("CMS content synced to Supabase.")
}

async function loadEnvFiles(filenames) {
  const loaded = {}

  for (const filename of filenames) {
    const fullPath = path.join(cwd, filename)
    try {
      const file = await readFile(fullPath, "utf8")
      Object.assign(loaded, parseEnv(file))
    } catch {
      // Ignore missing env files.
    }
  }

  return { ...loaded, ...process.env }
}

function parseEnv(raw) {
  const result = {}

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex < 0) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function firstNonEmpty(...values) {
  return values.find((value) => value && value.trim())?.trim()
}

async function upsertOrThrow(queryPromise, label) {
  const { error } = await queryPromise
  if (error) {
    throw new Error(`Failed to sync ${label}: ${error.message}`)
  }
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
