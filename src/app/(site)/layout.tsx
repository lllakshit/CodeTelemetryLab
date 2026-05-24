import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-[0.35]" />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
