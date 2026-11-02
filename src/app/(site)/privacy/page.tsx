import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/section-heading"
import { BRAND_EMAIL, BRAND_NAME, buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: `How ${BRAND_NAME} collects, uses, and protects information submitted through the website and project inquiry forms.`,
  path: "/privacy",
})

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
          <p className="mt-3">2 November 2026</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Cookies and visitor journeys</h2>
          <p className="mt-3">
            We use essential cookies to remember your cookie choice and keep forms working. If you choose &ldquo;Accept
            all&rdquo; (or switch on analytics in Cookie settings), we also set two analytics cookies and record how
            you move through the site: the pages you view, links and buttons you click, form activity (not what you
            type), how far you scroll, how long you stay, the page you arrived from, the page where your visit ends,
            and your approximate country and city, browser, and device type. We store a daily-rotating hash instead of
            your IP address.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>ct_consent</strong> (12 months): stores your cookie choice.
            </li>
            <li>
              <strong>ct_vid</strong> (12 months): a random visitor ID, set only with analytics consent.
            </li>
            <li>
              <strong>ct_sid</strong> (30 minutes): a random visit ID, set only with analytics consent.
            </li>
          </ul>
          <p className="mt-3">
            If you choose &ldquo;Essential only&rdquo;, no analytics cookie is set and no journey is recorded. You can change
            your choice at any time with &ldquo;Cookie settings&rdquo; in the footer. Journey data is used to understand
            which content helps visitors and where the site needs work; it is visible only to authorized operators.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-950">Job applications</h2>
          <p className="mt-3">
            If you apply for a role, we store the details you submit and your résumé in a private location, visible only
            to authorized team members, to evaluate you for the role you chose and for future openings. Ask us to delete
            your application at any time using the email address below.
          </p>
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
