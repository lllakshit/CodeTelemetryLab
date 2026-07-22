import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, MapPin } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl } from "@/lib/seo"
import {
  getCityBySlug,
  getServiceBySlug,
  localServicePrioritySlugs,
  seoCities,
  seoServices,
} from "@/lib/seo-markets"

type PageProps = {
  params: Promise<{ city: string }>
}

export function generateStaticParams() {
  return seoCities.map((city) => ({ city: city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = getCityBySlug(citySlug)
  if (!city) return {}

  const title = `Software & AI Development Company in ${city.name}`
  const description = `CodeTelemetryLab provides AI development, automation, SaaS, MVP, and custom software services for teams in ${city.name}, ${city.country}. Remote-first delivery with local market focus.`

  return {
    title,
    description,
    alternates: { canonical: `/locations/${city.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/locations/${city.slug}`),
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params
  const city = getCityBySlug(citySlug)
  if (!city) notFound()

  const services = seoServices.filter((service) =>
    (localServicePrioritySlugs as readonly string[]).includes(service.slug),
  )
  const nearby = seoCities
    .filter((item) => item.countryCode === city.countryCode && item.slug !== city.slug)
    .slice(0, 6)

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `CodeTelemetryLab — ${city.name}`,
    url: absoluteUrl(`/locations/${city.slug}`),
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "Country",
        name: city.country,
      },
    },
    serviceType: services.map((service) => service.name),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/locations" className="hover:text-slate-900">
              Locations
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-900">{city.name}</li>
        </ol>
      </nav>

      <SectionHeading
        eyebrow={`${city.name} · ${city.country}`}
        title={`AI and software development partner for teams in ${city.name}.`}
        description={`${city.localAngle} CodeTelemetryLab helps startups, SaaS companies, and operators in ${city.name} ship AI, automation, and custom software with clear scope and durable handoff.`}
        level={1}
      />

      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        <MapPin className="h-4 w-4" />
        Serving {city.name}, {city.region} · timezone {city.timezone}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?city=${encodeURIComponent(city.name)}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Start a project in {city.name}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
        >
          Browse all services
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">
          In-demand services in {city.name}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/locations/${city.slug}/${service.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
            >
              <p className="text-sm font-semibold text-slate-950">
                {service.name} in {city.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {nearby.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Nearby markets</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {nearby.map((item) => (
              <Link
                key={item.slug}
                href={`/locations/${item.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
