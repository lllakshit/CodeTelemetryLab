import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SystemLayersDiagram } from "@/components/diagrams/engineering-diagrams"
import { SectionHeading } from "@/components/section-heading"
import { absoluteUrl, serviceJsonLd } from "@/lib/seo"
import { getServiceNarrative } from "@/lib/service-narratives"
import {
  getServiceBySlug,
  localServicePrioritySlugs,
  seoCities,
  seoServices,
} from "@/lib/seo-markets"
import { listProjects } from "@/lib/cms"
import { getRelatedArticlesForService } from "@/lib/service-related-articles"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return seoServices.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  const narrative = getServiceNarrative(slug)
  if (!service) return {}

  const title = `${service.name} | CodeTelemetryLab`
  const description = narrative?.overview ?? service.description

  return {
    title: { absolute: title },
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

  const narrative = getServiceNarrative(slug)
  const related = service.relatedSlugs
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter(Boolean)
  const projects = (await listProjects({ publishedOnly: true })).slice(0, 3)
  const relatedArticles = getRelatedArticlesForService(service.slug)
  const localCities = seoCities.filter((city) => city.priority === "primary").slice(0, 6)
  const showLocal = (localServicePrioritySlugs as readonly string[]).includes(service.slug)

  const faqs = narrative?.faqs?.length
    ? narrative.faqs
    : service.faqs

  const jsonLd = serviceJsonLd({
    name: service.name,
    description: narrative?.overview ?? service.description,
    path: `/services/${service.slug}`,
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
        eyebrow="Service"
        title={service.name}
        description={narrative?.overview ?? service.description}
        level={1}
      />

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {narrative?.cta.label ?? `Discuss ${service.shortName.toLowerCase()}`}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/process"
          className="inline-flex items-center justify-center rounded-full border-2 border-slate-950 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
        >
          How delivery works
        </Link>
      </div>

      {narrative ? (
        <>
          <section className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
              <h2 className="text-2xl font-medium tracking-tight text-slate-950">Problems this work usually addresses</h2>
              <ul className="mt-6 space-y-4">
                {narrative.problems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
              <h2 className="text-2xl font-medium tracking-tight text-slate-950">Who benefits most</h2>
              <p className="mt-6 text-sm leading-7 text-slate-700">{narrative.whoBenefits}</p>
              <h3 className="mt-8 text-lg font-semibold text-slate-950">Typical outcomes</h3>
              <ul className="mt-4 space-y-3">
                {service.outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-3xl font-medium tracking-tight text-slate-950">Technical approach</h2>
            <div className="mt-8 divide-y divide-slate-200 border-t border-slate-200">
              {narrative.approach.map((step, index) => (
                <article key={step.title} className="grid gap-4 py-8 lg:grid-cols-[0.22fr_0.78fr]">
                  <p className="text-sm font-semibold text-blue-700">{String(index + 1).padStart(2, "0")}</p>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-slate-950">Architecture considerations</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{narrative.architecture}</p>
              <h3 className="mt-8 text-lg font-semibold text-slate-950">Security</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{narrative.security}</p>
              <h3 className="mt-8 text-lg font-semibold text-slate-950">Scaling</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{narrative.scaling}</p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4">
              <SystemLayersDiagram className="h-auto w-full" />
            </div>
          </section>

          <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <h2 className="text-2xl font-medium text-slate-950">Technology stack</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {narrative.stack.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  {item}
                </span>
              ))}
            </div>
            <h3 className="mt-10 text-lg font-semibold text-slate-950">Common challenges</h3>
            <ul className="mt-4 space-y-3">
              {narrative.challenges.map((item) => (
                <li key={item} className="text-sm leading-7 text-slate-600">
                  • {item}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
            <h2 className="text-2xl font-medium text-slate-950">Outcomes</h2>
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
            <h2 className="text-2xl font-medium text-slate-950">What the engagement includes</h2>
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
      )}

      <section className="mt-14 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 lg:p-8">
        <h2 className="text-2xl font-medium tracking-tight text-slate-950">Frequently asked questions</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="text-lg font-medium text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {relatedArticles.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Related reading</h2>
          <ul className="mt-6 space-y-3">
            {relatedArticles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/blog/${article.slug}`}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

      {projects.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">Relevant projects</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{project.category}</p>
                <p className="mt-3 text-sm font-semibold text-slate-950">{project.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {showLocal ? (
        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight text-slate-950">{service.name} by market</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {localCities.map((city) => (
              <Link
                key={city.slug}
                href={`/locations/${city.slug}/${service.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-16 rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f4f8ff,#edf5ff)] p-8">
        <h2 className="text-3xl font-medium tracking-tight text-slate-950">
          {narrative?.cta.title ?? `Ready to scope ${service.shortName.toLowerCase()}?`}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
          {narrative?.cta.text ??
            "Send a brief with the problem, constraints, and timeline. You get a scoped engineering response."}
        </p>
        <Link
          href={`/contact?service=${encodeURIComponent(service.name)}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {narrative?.cta.label ?? "Send a brief"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
