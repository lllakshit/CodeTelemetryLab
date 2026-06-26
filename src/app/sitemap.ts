import type { MetadataRoute } from "next"
import { listBlogPosts, listProjects } from "@/lib/cms"
import { absoluteUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    listBlogPosts({ publishedOnly: true }),
    listProjects({ publishedOnly: true }),
  ])

  const staticRoutes = ["", "/services", "/projects", "/about", "/blog", "/contact"].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
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

  return [...staticRoutes, ...blogRoutes, ...projectRoutes]
}
