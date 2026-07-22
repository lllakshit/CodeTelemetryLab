import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { getLocationNarrative } from "@/lib/location-narratives"
import { buildPageMetadata } from "@/lib/seo"
import { seoCities } from "@/lib/seo-markets"

export const metadata: Metadata = buildPageMetadata({
  title: "Locations | Markets We Serve",
  description:
    "CodeTelemetryLab works with teams in India, the United States, Canada, the UK, UAE, and Australia—remote-first with clear delivery ownership.",
  path: "/locations",
})

function cardBlurb(citySlug: string, fallback: string) {
  const narrative = getLocationNarrative(citySlug)
  if (!narrative?.intro) return fallback
  const [firstSentence] = narrative.intro.split(/(?<=[.!?])\s+/)
  return firstSentence || fallback
}

export default function LocationsIndexPage() {
  const india = seoCities.filter((city) => city.countryCode === "IN")
  const northAmerica = seoCities.filter((city) => city.countryCode === "US" || city.countryCode === "CA")
  const international = seoCities.filter((city) => !["IN", "US", "CA"].includes(city.countryCode))

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Locations"
        title="Markets where we deliver software and AI systems."
        description="Remote-first engagements for product and operations teams. Each city page lists the services we commonly run for that market."
        level={1}
      />

      <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
        We are based in Jaipur and work across time zones daily, so these pages describe the market context we plan
        around—collaboration hours, common stack decisions, and the workflows teams in each city usually bring us.
        Read the{" "}
        <Link href="/process" className="font-medium text-blue-700 underline decoration-slate-300 underline-offset-2 hover:text-blue-900">
          delivery process
        </Link>{" "}
        for how an engagement runs, or{" "}
        <Link href="/contact" className="font-medium text-blue-700 underline decoration-slate-300 underline-offset-2 hover:text-blue-900">
          send a brief
        </Link>{" "}
        if your city isn&rsquo;t listed—remote delivery is not limited to this list.
      </p>

      <MarketGroup title="India" cities={india} />
      <MarketGroup title="United States & Canada" cities={northAmerica} />
      <MarketGroup title="UK, UAE & Australia" cities={international} />

      <div className="mt-16 rounded-[2rem] bg-slate-950 px-6 py-10 sm:px-10">
        <h2 className="text-3xl font-medium text-white">Don&rsquo;t see your market listed?</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          We take on remote engagements outside these cities regularly. Share the problem, timezone, and timeline.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
        >
          Send a brief
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function MarketGroup({
  title,
  cities,
}: {
  title: string
  cities: typeof seoCities
}) {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-medium tracking-tight text-slate-950">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/locations/${city.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <p className="text-sm font-semibold text-slate-950">{city.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {city.region} · {city.country}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{cardBlurb(city.slug, city.localAngle)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
