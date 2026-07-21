import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl, serviceJsonLd } from "@/lib/seo"
import {
  getCityBySlug,
  getLocalServicePages,
  getServiceBySlug,
  localServicePrioritySlugs,
  seoCities,
} from "@/lib/seo-markets"

type PageProps = {
  params: Promise<{ city: string; service: string }>
}

export function generateStaticParams() {
  return getLocalServicePages().map(({ city, service }) => ({
    city: city.slug,
    service: service.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, service: serviceSlug } = await params
  const city = getCityBySlug(citySlug)
  const service = getServiceBySlug(serviceSlug)
  if (!city || !service) return {}

  const title = `${service.name} Company in ${city.name}`
  const description = `Looking for a ${service.name.toLowerCase()} company in ${city.name}? CodeTelemetryLab delivers ${service.primaryKeyword} for startups and product teams in ${city.name}, ${city.country}.`

  return {
    title,
    description,
    alternates: { canonical: `/locations/${city.slug}/${service.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/locations/${city.slug}/${service.slug}`),
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

export default async function CityServicePage({ params }: PageProps) {
  const { city: citySlug, service: serviceSlug } = await params
  const city = getCityBySlug(citySlug)
  const service = getServiceBySlug(serviceSlug)

  if (!city || !service || !(localServicePrioritySlugs as readonly string[]).includes(service.slug)) {
    notFound()
  }

  const otherServices = (localServicePrioritySlugs as readonly string[])
    .filter((slug) => slug !== service.slug)
    .slice(0, 6)
    .map((slug) => getServiceBySlug(slug))
    .filter(Boolean)

  const otherCities = seoCities
    .filter((item) => item.slug !== city.slug && item.priority === "primary")
    .slice(0, 8)

  const jsonLd = serviceJsonLd({
    name: `${service.name} in ${city.name}`,
    description: `${service.description} Serving buyers in ${city.name}, ${city.country}.`,
    path: `/locations/${city.slug}/${service.slug}`,
    areaServed: city.name,
  })

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Do you provide ${service.name.toLowerCase()} for companies in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. CodeTelemetryLab works with founders, SaaS teams, and operators in ${city.name} on ${service.name.toLowerCase()} engagements with remote-first delivery and clear scoping.`,
        },
      },
      ...service.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    ],
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

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
          <li>
            <Link href={`/locations/${city.slug}`} className="hover:text-slate-900">
              {city.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-900">{service.name}</li>
        </ol>
      </nav>

      <SectionHeading
        eyebrow={`${service.primaryKeyword} · ${city.name}`}
        title={`${service.name} company in ${city.name} for teams that need a real engineering partner.`}
        description={`Hire CodeTelemetryLab for ${service.name.toLowerCase()} in ${city.name}. ${city.localAngle} ${service.description}`}
        level={1}
      />

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}&city=${encodeURIComponent(city.name)}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Get a {city.name} project proposal
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
        >
          View {service.shortName} overview
        </Link>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">
            Why teams in {city.name} choose this engagement
          </h2>
          <ul className="mt-6 space-y-4">
            {service.outcomes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Delivery scope</h2>
          <ul className="mt-6 space-y-4">
            {service.deliverables.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">
          More {service.name.toLowerCase()} markets
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {otherCities.map((item) => (
            <Link
              key={item.slug}
              href={`/locations/${item.slug}/${service.slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
            >
              {service.shortName} in {item.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">
          Other services in {city.name}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherServices.map((item) =>
            item ? (
              <Link
                key={item.slug}
                href={`/locations/${city.slug}/${item.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
              >
                <p className="text-sm font-semibold text-slate-950">
                  {item.name} in {city.name}
                </p>
              </Link>
            ) : null,
          )}
        </div>
      </section>
    </div>
  )
}
