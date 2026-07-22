import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { BRAND_EMAIL, BRAND_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND_NAME} collects, uses, and protects information submitted through the website and project inquiry forms.`,
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Legal"
        title="Privacy Policy"
        description={`${BRAND_NAME} respects the information you share when requesting a consultation or exploring our services.`}
        level={1}
      />

      <div className="mt-12 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Last updated</h2>
          <p className="mt-3">22 July 2026</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Information we collect</h2>
          <p className="mt-3">
            When you submit the contact form, we may collect your name, email address, message, and any optional
            project details you choose to provide (company, phone, budget, timeline, website, and similar fields).
            We also capture technical metadata such as UTM parameters, referrer, IP address, and user agent to
            prevent spam and improve response quality.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">How we use it</h2>
          <p className="mt-3">
            We use inquiry data to respond to your request, qualify project fit, operate our CRM/lead tools, and
            improve site reliability. We do not sell personal information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Retention and security</h2>
          <p className="mt-3">
            Lead records are stored in our production systems with access limited to authorized operators.
            Retention follows business and legal needs for client communication and delivery.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Contact</h2>
          <p className="mt-3">
            Privacy questions:{" "}
            <a className="font-medium text-blue-700 hover:text-blue-900" href={`mailto:${BRAND_EMAIL}`}>
              {BRAND_EMAIL}
            </a>
            . You can also use our{" "}
            <Link href="/contact" className="font-medium text-blue-700 hover:text-blue-900">
              contact form
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
