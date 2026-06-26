import { listBlogPosts } from "@/lib/cms"
import { absoluteUrl, SITE_URL } from "@/lib/seo"

export async function GET() {
  const posts = await listBlogPosts({ publishedOnly: true })
  const updated = posts[0]?.updatedAt ?? new Date().toISOString()

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CodeTelemetryLabs Blog</title>
    <link>${SITE_URL}</link>
    <description>Engineering notes on software systems, SaaS delivery, automation, and technical SEO.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
      <guid>${absoluteUrl(`/blog/${post.slug}`)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
    </item>`,
      )
      .join("\n")}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}
