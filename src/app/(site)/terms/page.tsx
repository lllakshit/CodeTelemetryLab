import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { BRAND_EMAIL, BRAND_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing use of the ${BRAND_NAME} website and project inquiry process.`,
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Legal"
        title="Terms of Service"
        description={`These terms apply to your use of the ${BRAND_NAME} website and related inquiry channels.`}
        level={1}
      />

      <div className="mt-12 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Website use</h2>
          <p className="mt-3">
            Content on this site is provided for informational purposes about {BRAND_NAME} services. You may not
            scrape, misuse, or attempt to disrupt the site, admin tools, or APIs.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Project inquiries</h2>
          <p className="mt-3">
            Submitting a contact form does not create a binding engagement. Statements about timelines, budgets, or
            scope become contractual only when confirmed in a written agreement or statement of work.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Intellectual property</h2>
          <p className="mt-3">
            Brand marks, copy, case study materials, and site design belong to {BRAND_NAME} or respective owners
            unless otherwise noted.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Contact</h2>
          <p className="mt-3">
            Questions:{" "}
            <a className="font-medium text-blue-700 hover:text-blue-900" href={`mailto:${BRAND_EMAIL}`}>
              {BRAND_EMAIL}
            </a>{" "}
            or{" "}
            <Link href="/contact" className="font-medium text-blue-700 hover:text-blue-900">
              contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
