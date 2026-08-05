import type { MetadataRoute } from "next"
import { listBlogPosts, listProjects } from "@/lib/cms"
import { absoluteUrl } from "@/lib/seo"
import { getLocalServicePages, seoCities, seoServices } from "@/lib/seo-markets"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof listBlogPosts>> = []
  let projects: Awaited<ReturnType<typeof listProjects>> = []

  try {
    ;[posts, projects] = await Promise.all([
      listBlogPosts({ publishedOnly: true }),
      listProjects({ publishedOnly: true }),
    ])
  } catch {
    // Keep static + programmatic routes indexable even if CMS/Supabase is unavailable.
    posts = []
    projects = []
  }

  const now = new Date()

  const staticRoutes = [
    "",
    "/services",
    "/projects",
    "/process",
    "/about",
    "/blog",
    "/contact",
    "/locations",
    "/privacy",
    "/terms",
    "/llms.txt",
    "/feed.xml",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: now,
    changeFrequency: path === "/blog" || path === "/feed.xml" ? ("daily" as const) : ("weekly" as const),
    priority:
      path === ""
        ? 1
        : path === "/privacy" || path === "/terms" || path === "/llms.txt"
          ? 0.3
          : path === "/blog" || path === "/feed.xml"
            ? 0.75
            : 0.8,
  }))

  const serviceRoutes = seoServices.map((service) => ({
    url: absoluteUrl(`/services/${service.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }))

  const cityRoutes = seoCities.map((city) => ({
    url: absoluteUrl(`/locations/${city.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: city.priority === "primary" ? 0.85 : 0.7,
  }))

  const localServiceRoutes = getLocalServicePages().map(({ path, city }) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: city.priority === "primary" ? 0.8 : 0.65,
  }))

  const blogRoutes = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const projectRoutes = projects.map((project) => ({
    url: absoluteUrl(`/projects/${project.slug}`),
    lastModified: new Date(project.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }))

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...cityRoutes,
    ...localServiceRoutes,
    ...blogRoutes,
    ...projectRoutes,
  ]
}
