import type { Metadata } from "next"
import { NotFoundContent } from "@/components/not-found-content"

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found.",
  robots: { index: false, follow: true },
}

/** Used when a page inside the site (for example a missing blog post) calls notFound(). The site layout supplies the chrome. */
export default function SiteNotFound() {
  return <NotFoundContent />
}
