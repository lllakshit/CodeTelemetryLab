import type { MetadataRoute } from "next"
import { absoluteUrl, SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  const host = new URL(SITE_URL).host

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/llms.txt", "/feed.xml", "/sitemap.xml"],
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/feed.xml")],
    host,
  }
}
