import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"

const base = "http://localhost:3000"
const root = process.cwd()
const shotDir = path.join(root, ".codex-screens")
const testImage = path.join(shotDir, "picker-upload-test.png")

function cleanupTestMedia() {
  const storePath = path.join(root, "data", "cms-store.json")
  const store = JSON.parse(fs.readFileSync(storePath, "utf8"))
  const removed = []

  store.media = (store.media || []).filter((asset) => {
    if (asset.name === "Playwright picker test image") {
      removed.push(asset)
      return false
    }
    return true
  })

  store.activity = (store.activity || []).filter((item) => item.detail !== "Playwright picker test image")
  fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`)

  for (const asset of removed) {
    if (asset.storagePath?.startsWith("uploads/")) {
      const target = path.join(root, "public", asset.storagePath)
      if (fs.existsSync(target)) fs.unlinkSync(target)
    }
  }
}

async function main() {
  fs.mkdirSync(shotDir, { recursive: true })
  fs.writeFileSync(
    testImage,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  )

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } })

  try {
    await page.goto(`${base}/blog?q=shopify&category=E-commerce`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: /Shopify Speed Optimization Service/i }).waitFor({ timeout: 15_000 })
    await page.screenshot({ path: path.join(shotDir, "pw-blog-search-shopify.png"), fullPage: true })

    await page.goto(`${base}/blog/hire-react-developer-for-startup-website`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: "How to Hire a React Developer for a Startup Website" }).waitFor({
      timeout: 15_000,
    })
    await page.getByRole("link", { name: /Request a project quote/i }).waitFor({ timeout: 15_000 })

    const sitemap = await page.request.get(`${base}/sitemap.xml`)
    const sitemapText = await sitemap.text()
    if (!sitemapText.includes("/blog/hire-react-developer-for-startup-website")) {
      throw new Error("Sitemap missing generated blog slug")
    }

    const feed = await page.request.get(`${base}/feed.xml`)
    const feedText = await feed.text()
    if (!feedText.includes("/blog/hire-react-developer-for-startup-website")) {
      throw new Error("RSS feed missing generated blog slug")
    }

    await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" })
    await page.getByLabel("Admin email").fill("admin@codetelemetrylabs.com")
    await page.getByLabel("Password").fill("admin1234")
    await page.getByRole("button", { name: /Sign in/i }).click()
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 })

    await page.goto(`${base}/admin/blogs/new`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: "Images and article body" }).waitFor({ timeout: 15_000 })
    await page.locator("button").filter({ hasText: "Insert image" }).click()
    await page.getByRole("heading", { name: /Insert article image/i }).waitFor({ timeout: 15_000 })
    await page.screenshot({ path: path.join(shotDir, "pw-media-picker-modal.png"), fullPage: true })

    await page.setInputFiles("input[type='file']", testImage)
    await page.getByPlaceholder("Asset name").fill("Playwright picker test image")
    await page.getByPlaceholder("Alt text").fill("Playwright picker test dashboard image")
    await page.getByRole("button", { name: /Upload and use/i }).click()
    await page.waitForFunction(
      () => document.querySelector("textarea[name='content']")?.value.includes("![Playwright picker test dashboard image]("),
      null,
      { timeout: 15_000 },
    )

    await page.locator("button").filter({ hasText: "Choose image" }).click()
    await page.getByRole("heading", { name: /Choose featured image/i }).waitFor({ timeout: 15_000 })
    await page.getByText("Playwright picker test image").first().click()
    await page.waitForFunction(
      () => document.querySelector("input[name='featuredImage']")?.value.includes("/uploads/"),
      null,
      { timeout: 15_000 },
    )
    await page.screenshot({ path: path.join(shotDir, "pw-blog-editor-picker-selected.png"), fullPage: true })

    console.log(
      JSON.stringify(
        {
          ok: true,
          checked: [
            "blog search",
            "generated article",
            "sitemap",
            "rss",
            "admin login",
            "media modal upload",
            "inline insert",
            "featured select",
          ],
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
    cleanupTestMedia()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
