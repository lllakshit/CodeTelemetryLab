import Link from "next/link"
import { Mail, MapPin, Sparkles } from "lucide-react"
import { siteNav } from "@/lib/navigation"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#09111f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Built for serious product teams
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              A dependable engineering partner for product launches, internal systems, and agency support.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
              CodeTelemetryLabs focuses on clarity, delivery discipline, and systems that stay maintainable
              as the product grows.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Navigate</p>
            <div className="mt-4 flex flex-col gap-3">
              {siteNav.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-slate-400 transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-300" />
                hello@codetelemetrylabs.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-300" />
                Remote-first, USA and Canada time zones
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>CodeTelemetryLabs. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/admin/login" className="transition hover:text-slate-300">
              Admin
            </Link>
            <Link href="/contact" className="transition hover:text-slate-300">
              Request proposal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
