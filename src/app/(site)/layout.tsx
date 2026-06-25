import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] text-slate-900">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,rgba(0,100,224,0.06),transparent_58%)]" />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
