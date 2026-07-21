import Link from "next/link"
import { Mail, MapPin, Sparkles } from "lucide-react"
import { siteNav } from "@/lib/navigation"
import { DesignMark } from "@/components/design-mark"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"
import { seoCities, seoServices } from "@/lib/seo-markets"

export function SiteFooter() {
  const featuredServices = seoServices.slice(0, 6)
  const featuredCities = seoCities.filter((city) => city.priority === "primary").slice(0, 7)

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Built for serious product teams
            </div>
            <div className="mb-5">
              <DesignMark size="lg" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              A dependable engineering partner for AI, SaaS, automation, and product launches.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">
              CodeTelemetryLab focuses on clarity, delivery discipline, and systems that stay maintainable
              as the product grows—across India, North America, and international metros.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Navigate</p>
            <div className="mt-4 flex flex-col gap-3">
              {siteNav.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-slate-600 transition hover:text-slate-950">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Services</p>
            <div className="mt-4 flex flex-col gap-3">
              {featuredServices.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="text-sm text-slate-600 transition hover:text-slate-950"
                >
                  {service.name}
                </Link>
              ))}
              <Link href="/services" className="text-sm font-medium text-blue-700 transition hover:text-blue-900">
                All services
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <a href={`mailto:${CONTACT_DISPLAY_EMAIL}`} className="transition hover:text-slate-950">
                  {CONTACT_DISPLAY_EMAIL}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>Jaipur HQ · remote-first for US, Canada, UK, UAE & Australia</span>
              </p>
            </div>
            <p className="mt-6 text-sm font-semibold text-slate-900">Priority markets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {featuredCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/locations/${city.slug}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CodeTelemetryLab. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition hover:text-slate-950">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-950">
              Terms
            </Link>
            <Link href="/locations" className="transition hover:text-slate-950">
              Locations
            </Link>
            <Link href="/contact" className="transition hover:text-slate-950">
              Book Free Consultation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
