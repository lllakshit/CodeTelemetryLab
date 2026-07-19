import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl, serviceJsonLd } from "@/lib/seo"
import { getServiceBySlug, seoServices } from "@/lib/seo-markets"
import { seoCities, localServicePrioritySlugs } from "@/lib/seo-markets"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return seoServices.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  const title = `${service.name} Company | ${service.primaryKeyword}`
  const description = `${service.description} CodeTelemetryLabs delivers ${service.name.toLowerCase()} for startups, SaaS teams, and operators across the US, Canada, UK, UAE, Australia, and India.`

  return {
    title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/services/${service.slug}`),
      images: ["/brand/ct-labs-logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/ct-labs-logo.png"],
    },
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const related = service.relatedSlugs
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter(Boolean)
  const localCities = seoCities.filter((city) => city.priority === "primary").slice(0, 8)
  const showLocal =
    (localServicePrioritySlugs as readonly string[]).includes(service.slug)

  const jsonLd = serviceJsonLd({
    name: service.name,
    description: service.description,
    path: `/services/${service.slug}`,
  })

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
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
            <Link href="/services" className="hover:text-slate-900">
              Services
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-900">{service.name}</li>
        </ol>
      </nav>

      <SectionHeading
        eyebrow={service.primaryKeyword}
        title={`${service.name} built for buyers who need production systems, not demos.`}
        description={service.description}
        level={1}
      />

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Start a {service.shortName.toLowerCase()} project
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
        >
          View related work
        </Link>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Outcomes buyers care about</h2>
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
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">What the engagement includes</h2>
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

      <section className="mt-14 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 lg:p-8">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">FAQ</h2>
        <div className="mt-6 space-y-6">
          {service.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-lg font-medium text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Related services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) =>
              item ? (
                <Link
                  key={item.slug}
                  href={`/services/${item.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
                >
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </Link>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {showLocal ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">
            {service.name} by city
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Local landing pages for teams searching for a {service.name.toLowerCase()} partner in their metro market.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {localCities.map((city) => (
              <Link
                key={city.slug}
                href={`/locations/${city.slug}/${service.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                {service.shortName} in {city.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-16 rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-8">
        <h2 className="text-3xl font-medium tracking-tight text-slate-950">
          Ready to scope a {service.shortName.toLowerCase()} engagement?
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
          Send a brief with the problem, constraints, and timeline. You get a scoped response—not a generic sales script.
        </p>
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Request a proposal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
