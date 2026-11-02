import type { Metadata } from "next"
import { NotFoundContent } from "@/components/not-found-content"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found.",
  robots: { index: false, follow: true },
}

/** Unknown URLs land here. They sit outside the (site) layout, so the header and footer are added explicitly. */
export default function GlobalNotFound() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] text-slate-900">
      <SiteHeader />
      <main>
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  )
}
