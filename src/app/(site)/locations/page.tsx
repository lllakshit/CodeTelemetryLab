import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { seoCities } from "@/lib/seo-markets"

export const metadata: Metadata = {
  title: "Locations | AI & Software Development Markets",
  description:
    "CodeTelemetryLab serves buyers across Jaipur, Delhi, Mumbai, Bangalore, Pune, Hyderabad, Ahmedabad, and high-opportunity US and Canadian metros—plus London, Dubai, and Sydney.",
  alternates: { canonical: "/locations" },
}

export default function LocationsIndexPage() {
  const india = seoCities.filter((city) => city.countryCode === "IN")
  const northAmerica = seoCities.filter((city) => city.countryCode === "US" || city.countryCode === "CA")
  const international = seoCities.filter((city) => !["IN", "US", "CA"].includes(city.countryCode))

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Locations"
        title="City-focused software and AI delivery for markets where buyers actually search."
        description="These pages target commercial local intent—AI development, automation, SaaS, MVP, and custom software—without diluting the brand into thin country-level fluff."
        level={1}
      />

      <MarketGroup title="India" cities={india} />
      <MarketGroup title="United States & Canada" cities={northAmerica} />
      <MarketGroup title="UK, UAE & Australia" cities={international} />
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
            <p className="text-sm font-semibold text-slate-950">
              {city.name}
              <span className="ml-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-700">
                {city.priority}
              </span>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{city.localAngle}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
