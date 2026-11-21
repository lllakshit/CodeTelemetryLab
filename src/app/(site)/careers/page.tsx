import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { Glyph, Rcube, SceneHero, revealDelay } from "@/components/site3d/site-3d-ui"
import { GENERAL_APPLICATION, careerBenefits, jobOpenings, jobTeams } from "@/lib/careers"
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Careers | Join the Team",
  description:
    "Open roles in engineering, AI and automation, design, delivery, growth, and content at CodeTelemetryLab. Remote-friendly, with real client work for US and Canadian teams.",
  path: "/careers",
})

/** Badge icon (24x24 line art) for each benefit card. Unknown titles fall back to a generic icon. */
const benefitIcons: Record<string, ReactNode> = {
  "Real client work": (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  "Flexible, remote-first": (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2 20h20" />
    </>
  ),
  "Senior mentorship": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M17.5 14.6c2.3.3 3.8 1.8 4.3 4.4" />
    </>
  ),
  "Learning budget": (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19V5M8 7h7" />
    </>
  ),
  "Clear ownership": (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  "Honest process": (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6z" />
      <path d="m8.5 12 2.5 2.5L16 9.5" />
    </>
  ),
}
const fallbackIcon = <path d="m8.5 12 2.5 2.5L16 9.5" />

/** Small inline icon inside a role's meta pill. */
const metaIcon = { size: 13, "aria-hidden": true, style: { display: "inline-block", verticalAlign: "-2px", marginRight: 6 } } as const

const openingsLabel = (n: number) => `${n} ${n === 1 ? "opening" : "openings"}`

export default async function CareersPage({ searchParams }: { searchParams?: Promise<{ team?: string }> }) {
  const params = await searchParams
  const team = jobTeams.find((item) => item === params?.team)
  const visibleCount = team ? jobOpenings.filter((job) => job.team === team).length : jobOpenings.length

  return (
    <Site3DPage>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Careers", path: "/careers" },
            ]),
          ),
        }}
      />

      <div className="wrap">
        <SceneHero
          id="h1-careers"
          eyebrow="Careers"
          title="Build software that has to survive contact with real operators."
          lead="We are a small, senior-leaning team shipping AI, automation, and SaaS products for clients in the US and Canada. Pick a role below, or tell us what you do best."
          scene="careers"
          label="Interactive 3D globe with the Jaipur team connected to clients in the United States and Canada"
          hint="Drag the globe"
          dots={["Jaipur", "United States", "Canada"]}
        />

        <section className="sec" style={{ paddingTop: 10 }} aria-label="Why work with us">
          <ul className="perks">
            {careerBenefits.map((benefit, i) => (
              <li key={benefit.title} className="card perk rv" data-tilt="6" style={vars({ "--d": revealDelay(i) })}>
                <div className="ibadge">
                  <Glyph>{benefitIcons[benefit.title] ?? fallbackIcon}</Glyph>
                </div>
                <strong>{benefit.title}</strong>
                <p>{benefit.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sec" id="openings" aria-labelledby="openCount">
          <div className="sec-head rv" style={{ marginBottom: 14 }}>
            <p className="eyebrow-s">Open roles</p>
            <h2 className="h2" id="openCount" data-orig={openingsLabel(jobOpenings.length)}>
              {openingsLabel(visibleCount)}
              {team ? ` in ${team}` : ""}
            </h2>
          </div>

          {/* Each link reloads the page with ?team=… (filtered on the server), so the filter works without script.
              With script, site-enhance filters the cards in place, so every role is always in the HTML and the
              server only marks the non-matching ones hidden. */}
          <nav className="teams rv" id="teams" aria-label="Filter roles by team">
            <Link href="/careers#openings" data-team="" aria-current={team ? "false" : "true"}>
              All teams
            </Link>
            {jobTeams.map((item) => (
              <Link
                key={item}
                href={`/careers?team=${encodeURIComponent(item)}#openings`}
                data-team={item}
                aria-current={item === team ? "true" : "false"}
              >
                {item}
              </Link>
            ))}
          </nav>

          {jobOpenings.length ? (
            <ul className="roles">
              {jobOpenings.map((job, i) => (
                <li
                  key={job.slug}
                  className={`card role rv${team && job.team !== team ? " hide" : ""}`}
                  data-tilt="5"
                  data-team={job.team}
                  style={vars({ "--d": revealDelay(i, 2) })}
                >
                  <p className="cat">{job.team}</p>
                  <h3 className="h3">
                    <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <p className="d">{job.summary}</p>
                  <div className="meta">
                    <span>
                      <MapPin {...metaIcon} />
                      {job.location}
                    </span>
                    <span>
                      <Briefcase {...metaIcon} />
                      {job.employmentType}
                    </span>
                    <span>
                      <Clock {...metaIcon} />
                      {job.experience}
                    </span>
                  </div>
                  <div className="foot z2">
                    <Link className="rc" href={`/careers/${job.slug}`} aria-label={`View role: ${job.title}`}>
                      View role
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty on">
              No open roles right now. Send a general application below and we will reach out when a matching role
              opens.
            </p>
          )}
        </section>

        <section className="sec" style={{ paddingBottom: 80 }}>
          <div className="card apply rv" data-tilt="3">
            <div className="z2">
              <p className="eyebrow-s">Not seeing your role?</p>
              <h2 className="h2">Send a general application.</h2>
              <p className="muted">{GENERAL_APPLICATION.summary}</p>
              <Link className="btn" href={`/careers/${GENERAL_APPLICATION.slug}#apply`}>
                Apply without a specific role
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="cta-art" aria-hidden="true">
              <Rcube />
            </div>
          </div>
        </section>
      </div>
    </Site3DPage>
  )
}
