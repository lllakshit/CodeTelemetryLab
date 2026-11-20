import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { homeSections, homeStops, serviceMeta, spotlightSlugs } from "../../src/components/home3d/home-data.ts"

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")

test("every spotlight service exists and the page keeps its current order", () => {
  // seo-markets.ts imports through the "@/" alias, which plain node cannot resolve, so read the slugs from the source.
  const source = read("src/lib/seo-markets.ts")
  const block = source.slice(source.indexOf("export const seoServices"))
  const slugs = [...block.matchAll(/^\s{4}slug: "([a-z0-9-]+)"/gm)].map((m) => m[1])
  const shown = slugs.filter((slug) => (spotlightSlugs as readonly string[]).includes(slug))
  assert.deepEqual(shown, [
    "ai-development",
    "ai-automation",
    "custom-software-development",
    "saas-development",
    "mvp-development",
    "api-development",
  ])
})

test("each spotlight service has a label and a distinct 3D icon", () => {
  const glyphs = spotlightSlugs.map((slug) => serviceMeta[slug]?.glyph)
  assert.ok(glyphs.every((g) => Number.isInteger(g) && g >= 0 && g <= 5), "glyph must be 0 to 5")
  assert.equal(new Set(glyphs).size, spotlightSlugs.length, "glyphs must be unique")
  for (const slug of spotlightSlugs) assert.ok(serviceMeta[slug].short.length > 0)
})

test("navigation sections are unique and each belongs to exactly one dot", () => {
  const ids = homeSections.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length)
  const owned = homeStops.flatMap((s) => s.owns)
  assert.deepEqual([...owned].sort(), [...ids].sort())
})

test("the page renders an element for every navigation section", () => {
  const page = read("src/app/(site)/page.tsx")
  for (const { id } of homeSections) assert.match(page, new RegExp(`id="${id}"`), `missing #${id} in page.tsx`)
})

test("the page keeps the SEO-critical copy and links of the previous design", () => {
  const page = read("src/app/(site)/page.tsx")
  assert.match(page, /Build systems your operators can run—AI, automation, SaaS, and custom software with clear ownership\./)
  assert.match(page, /title: \{\s*absolute: "CodeTelemetryLab \| Custom Software, AI Systems & Product Delivery"/)
  assert.match(page, /alternates: \{ canonical: "\/" \}/)
  assert.equal((page.match(/<h1[ >]/g) ?? []).length, 1, "exactly one h1")
  for (const href of ["/contact", "/process", "/services", "/projects", "/about", "/locations"]) {
    assert.ok(page.includes(`"${href}"`), `link to ${href} is missing`)
  }
})

test("home page sections fed by the CMS refresh when content is saved in the admin", () => {
  const actions = read("src/app/(admin)/admin/actions.ts")
  for (const name of ["saveBlogAction", "deleteBlogAction", "saveProjectAction", "deleteProjectAction", "saveHomepageAction"]) {
    const start = actions.indexOf(`export async function ${name}`)
    assert.ok(start >= 0, `${name} not found`)
    const next = actions.indexOf("export async function", start + 10)
    const body = actions.slice(start, next === -1 ? undefined : next)
    assert.ok(body.includes('revalidatePath("/")'), `${name} must revalidate the home page`)
  }
})
