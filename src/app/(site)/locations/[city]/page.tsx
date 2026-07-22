import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, MapPin } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo"
import { getLocationNarrative } from "@/lib/location-narratives"
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
  const narrative = getLocationNarrative(citySlug)
  if (!city) return {}

  const title = narrative?.metaTitle ?? `Software engineering in ${city.name}`
  const description =
    narrative?.metaDescription ??
    `CodeTelemetryLab works with teams in ${city.name}, ${city.country} on AI, automation, SaaS, and custom software.`

  return {
    title: { absolute: `${title} | CodeTelemetryLab` },
    description,
    alternates: { canonical: `/locations/${city.slug}` },
    openGraph: {
      title: `${title} | CodeTelemetryLab`,
      description,
      url: absoluteUrl(`/locations/${city.slug}`),
      images: ["/brand/ct-labs-logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CodeTelemetryLab`,
      description,
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params
  const city = getCityBySlug(citySlug)
  if (!city) notFound()

  const narrative = getLocationNarrative(citySlug)
  const services = seoServices.filter((service) =>
    (localServicePrioritySlugs as readonly string[]).includes(service.slug),
  )
  const recommended = (narrative?.recommendedServices ?? [])
    .map((slug) => getServiceBySlug(slug))
    .filter(Boolean)
  const nearby = seoCities
    .filter((item) => item.countryCode === city.countryCode && item.slug !== city.slug)
    .slice(0, 6)

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: city.name, path: `/locations/${city.slug}` },
  ])

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `CodeTelemetryLab — ${city.name}`,
    url: absoluteUrl(`/locations/${city.slug}`),
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "Country", name: city.country },
    },
    serviceType: services.map((service) => service.name),
  }

  const faqLd = narrative
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: narrative.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
      {faqLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      ) : null}

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
        title={narrative?.introTitle ?? `Software partner for teams in ${city.name}`}
        description={narrative?.intro ?? city.localAngle}
        level={1}
      />

      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {city.name}, {city.region} · {city.timezone}
      </div>

      {narrative ? (
        <>
          <section className="mt-14 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-slate-950">Regional context</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{narrative.environment}</p>
            <h3 className="mt-8 text-lg font-semibold text-slate-950">Industries we commonly support</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {narrative.industries.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">Software challenges we see</h2>
              <ul className="mt-5 space-y-3">
                {narrative.challenges.map((item) => (
                  <li key={item} className="text-sm leading-7 text-slate-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">Example use cases</h2>
              <ul className="mt-5 space-y-3">
                {narrative.useCases.map((item) => (
                  <li key={item} className="text-sm leading-7 text-slate-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14 max-w-3xl">
            <h2 className="text-2xl font-medium tracking-tight text-slate-950">How we collaborate remotely</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{narrative.collaboration}</p>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Read more about our{" "}
              <Link href="/process" className="font-medium text-blue-700 hover:text-blue-900">
                delivery process
              </Link>{" "}
              and{" "}
              <Link href="/about" className="font-medium text-blue-700 hover:text-blue-900">
                working principles
              </Link>
              .
            </p>
          </section>
        </>
      ) : null}

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">
          Recommended services for {city.name}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(recommended.length ? recommended : services.slice(0, 6)).map((service) =>
            service ? (
              <Link
                key={service.slug}
                href={`/locations/${city.slug}/${service.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
              >
                <p className="text-sm font-semibold text-slate-950">{service.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
              </Link>
            ) : null,
          )}
        </div>
        <Link href="/services" className="mt-6 inline-flex text-sm font-semibold text-blue-700">
          Browse all services
        </Link>
      </section>

      {narrative?.faqs?.length ? (
        <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-medium text-slate-950">Questions from {city.name} teams</h2>
          <div className="mt-6 space-y-6">
            {narrative.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-medium text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {nearby.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Other markets in {city.country}</h2>
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

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-medium text-white">
          {narrative?.ctaTitle ?? `Ready to talk about a ${city.name} project?`}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          {narrative?.ctaText ?? "Send a brief with the problem, users, and timeline."}
        </p>
        <Link
          href={`/contact?city=${encodeURIComponent(city.name)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
        >
          {narrative?.ctaLabel ?? "Send a brief"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
