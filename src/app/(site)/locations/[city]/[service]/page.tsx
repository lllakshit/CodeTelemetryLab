import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl, breadcrumbJsonLd, serviceJsonLd } from "@/lib/seo"
import { getLocationNarrative } from "@/lib/location-narratives"
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
  const narrative = getLocationNarrative(citySlug)
  if (!city || !service) return {}

  const title = `${service.name} in ${city.name}`
  const description = narrative
    ? `${service.shortName} for ${city.name} teams. ${service.description} ${narrative.collaboration.split(".")[0]}.`
    : `CodeTelemetryLab provides ${service.name.toLowerCase()} for product teams in ${city.name}, ${city.country}. ${service.description}`

  const cleanDescription = description.replace(/\s+/g, " ").slice(0, 158)

  return {
    title: { absolute: `${title} | CodeTelemetryLab` },
    description: cleanDescription,
    alternates: { canonical: `/locations/${city.slug}/${service.slug}` },
    openGraph: {
      title: `${title} | CodeTelemetryLab`,
      description: cleanDescription,
      url: absoluteUrl(`/locations/${city.slug}/${service.slug}`),
      images: ["/brand/ct-labs-logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CodeTelemetryLab`,
      description: cleanDescription,
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

function buildCityServiceFaqs(
  cityName: string,
  serviceName: string,
  collaboration: string | undefined,
  serviceOutcomes: string[],
) {
  return [
    {
      question: `How do you run ${serviceName.toLowerCase()} with a team based outside ${cityName}?`,
      answer: collaboration
        ? `${collaboration} For ${serviceName.toLowerCase()}, we keep a shared backlog, written acceptance criteria, and a named owner on your side so progress is visible without daily status theater.`
        : `We work remote-first with written decisions, a shared backlog, and overlap calls when needed. ${serviceName} engagements include clear acceptance criteria so progress is reviewable asynchronously.`,
    },
    {
      question: `What does a useful first ${serviceName.toLowerCase()} release look like for a ${cityName} buyer?`,
      answer: serviceOutcomes[0]
        ? `A first release should prove ${serviceOutcomes[0].charAt(0).toLowerCase()}${serviceOutcomes[0].slice(1)} Without that signal, more features rarely help.`
        : `A first release should prove one owned workflow end-to-end—not a collection of disconnected screens.`,
    },
    {
      question: `Can we start with a narrow scope and expand later?`,
      answer: `Yes. We prefer a thin vertical slice that can be operated, then expand once the operating model is clear. Expanding before ownership is defined usually creates rework.`,
    },
  ]
}

export default async function CityServicePage({ params }: PageProps) {
  const { city: citySlug, service: serviceSlug } = await params
  const city = getCityBySlug(citySlug)
  const service = getServiceBySlug(serviceSlug)
  const narrative = getLocationNarrative(citySlug)

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

  const faqs = buildCityServiceFaqs(city.name, service.name, narrative?.collaboration, service.outcomes)

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: city.name, path: `/locations/${city.slug}` },
    { name: service.name, path: `/locations/${city.slug}/${service.slug}` },
  ])

  const jsonLd = serviceJsonLd({
    name: `${service.name} in ${city.name}`,
    description: `${service.description} Serving product and operations teams in ${city.name}, ${city.country}.`,
    path: `/locations/${city.slug}/${service.slug}`,
    areaServed: city.name,
  })

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  const intro =
    narrative != null
      ? `${narrative.intro} For ${service.name.toLowerCase()}, we start from the workflow your ${city.name} team must own—not from a feature checklist.`
      : `${city.localAngle} ${service.description}`

  const ctaTitle = narrative
    ? `${narrative.ctaTitle.replace(/\?$/, "")} — specifically for ${service.shortName}?`
    : `Discuss ${service.shortName} for a ${city.name} team`
  const ctaText = narrative
    ? `${narrative.ctaText} Mention that you need ${service.name.toLowerCase()} so we can respond with the right constraints.`
    : `Share users, systems of record, and the first workflow that must work in production.`
  const ctaLabel = narrative?.ctaLabel ?? "Send a brief"

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
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
        eyebrow={`${city.name} · ${service.name}`}
        title={`${service.name} for teams in ${city.name}`}
        description={intro}
        level={1}
      />

      {narrative ? (
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-700">
          Regional context: {narrative.environment} See also our{" "}
          <Link href={`/services/${service.slug}`} className="font-medium text-blue-700 hover:text-blue-900">
            {service.shortName} service overview
          </Link>{" "}
          and{" "}
          <Link href="/process" className="font-medium text-blue-700 hover:text-blue-900">
            delivery process
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}&city=${encodeURIComponent(city.name)}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {ctaLabel}
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
            Outcomes that matter in {city.name}
          </h2>
          <ul className="mt-6 space-y-4">
            {service.outcomes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Typical delivery scope</h2>
          <ul className="mt-6 space-y-4">
            {service.deliverables.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {narrative?.useCases?.length ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">
            {city.name} use cases that fit this service
          </h2>
          <ul className="mt-5 space-y-3">
            {narrative.useCases.map((item) => (
              <li key={item} className="text-sm leading-7 text-slate-600">
                • {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
        <h2 className="text-2xl font-medium text-slate-950">Questions we hear for {city.name}</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-lg font-medium text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">
          More {service.shortName.toLowerCase()} markets
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
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">Other services in {city.name}</h2>
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
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-medium text-white">{ctaTitle}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{ctaText}</p>
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}&city=${encodeURIComponent(city.name)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
