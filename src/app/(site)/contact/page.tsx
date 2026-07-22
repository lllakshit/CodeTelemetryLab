import type { Metadata } from "next"
import { CheckCircle2, Mail, MapPin } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"
import { attributionFromSearchParams } from "@/lib/lead-capture"

export const metadata: Metadata = {
  title: "Contact | Send a Project Brief",
  description:
    "Contact CodeTelemetryLab with your name, email, and project message. Expect a real engineering response within one business day.",
  alternates: { canonical: "/contact" },
}

const responseNotes = [
  "Reply within one business day from someone who can discuss the work",
  "Clarifying questions or a proposed first slice—not a scripted pitch",
  "Optional details help scope; name, email, and message are enough to start",
]

const includeHints = [
  "The problem operators feel today",
  "Who uses the system and who owns decisions",
  "Deadline or launch window, even if approximate",
  "Tools that must connect (CRM, auth, payments, docs)",
]

const contactFaqs = [
  {
    q: "What happens after I submit?",
    a: "We read the brief, check fit, and reply by email. If the work is a match, we propose a discovery call or a written first-slice plan. If it is not a match, we say so.",
  },
  {
    q: "What should I expect on a discovery call?",
    a: "Thirty to forty-five minutes on users, constraints, and success criteria. We will not pressure you into a package. Notes and next steps follow in writing.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes for serious evaluations. Send the document with your brief or after the first reply.",
  },
]

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const sent = resolvedSearchParams?.sent === "1"
  const invalidSubmission = resolvedSearchParams?.error === "invalid"
  const attribution = attributionFromSearchParams(resolvedSearchParams)
  const serviceFromQuery =
    typeof resolvedSearchParams?.service === "string" ? resolvedSearchParams.service : ""
  const defaultProjectType = attribution.serviceInterestedIn || serviceFromQuery || ""
  const projectTypeOptions = [
    "AI Development",
    "AI Automation",
    "LLM Applications",
    "AI Agents",
    "Custom Software Development",
    "SaaS Development",
    "MVP Development",
    "Full Stack Development",
    "React Development",
    "Next.js Development",
    "Node.js Development",
    "Python Development",
    "Workflow Automation",
    "CRM Development",
    "API Development",
    "Business Automation",
    "Startup Product Development",
    "Website Development",
    "Enterprise Software",
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <SectionHeading
          eyebrow="Contact"
          title="Send a brief. Get a grounded reply."
          description="Name, email, and a short description of the problem are enough. We respond within one business day with questions or a proposed next step."
          level={1}
        />
        <BrandIllustration variant="contact" />
      </div>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Your inquiry was received. We will review it and reply in your inbox.
          </div>
        </div>
      ) : null}

      {invalidSubmission ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please add a valid email, your name, and a short message so we can route the inquiry correctly.
        </div>
      ) : null}

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">What to include</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {includeHints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <a href={`mailto:${CONTACT_DISPLAY_EMAIL}`} className="transition hover:text-slate-950">
                  {CONTACT_DISPLAY_EMAIL}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Jaipur-based · remote delivery across NA, Europe, UAE & Australia
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">Engagement expectations</p>
            <div className="mt-5 space-y-4">
              {responseNotes.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">Contact FAQs</p>
            <div className="mt-5 space-y-5">
              {contactFaqs.map((item) => (
                <div key={item.q}>
                  <p className="text-sm font-semibold text-slate-950">{item.q}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form
          action="/api/contact"
          method="post"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8"
        >
          <input type="hidden" name="source" value="contact-page" />
          {attribution.landingPageUrl ? (
            <input type="hidden" name="referrer" value={attribution.landingPageUrl} />
          ) : null}
          {attribution.utmSource ? <input type="hidden" name="utmSource" value={attribution.utmSource} /> : null}
          {attribution.utmMedium ? <input type="hidden" name="utmMedium" value={attribution.utmMedium} /> : null}
          {attribution.utmCampaign ? (
            <input type="hidden" name="utmCampaign" value={attribution.utmCampaign} />
          ) : null}
          {attribution.utmTerm ? <input type="hidden" name="utmTerm" value={attribution.utmTerm} /> : null}
          {attribution.utmContent ? <input type="hidden" name="utmContent" value={attribution.utmContent} /> : null}
          <label className="hidden">
            Leave this field blank
            <input name="fax" tabIndex={-1} autoComplete="off" />
          </label>

          <div className="grid gap-5">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">
                Name <span className="text-slate-400">(required)</span>
              </span>
              <input
                name="name"
                required
                autoComplete="name"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">
                Email <span className="text-slate-400">(required)</span>
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="you@company.com"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">
                Message <span className="text-slate-400">(required)</span>
              </span>
              <textarea
                name="message"
                required
                rows={6}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="Describe the problem, timeline, and what a successful first release looks like."
              />
            </label>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Optional project details
            </summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              These fields stay optional. If you leave them blank, we still create the lead and follow up.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Company</span>
                <input
                  name="company"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40"
                  placeholder="Company or startup name"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Phone</span>
                <input
                  name="phone"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40"
                  placeholder="Best number for follow-up"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Country</span>
                <input
                  name="country"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40"
                  placeholder="United States, Canada, or your region"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Service interested in</span>
                <select
                  name="projectType"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40"
                  defaultValue={
                    projectTypeOptions.includes(defaultProjectType) ? defaultProjectType : ""
                  }
                >
                  <option value="">General project inquiry</option>
                  {projectTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Budget</span>
                <select
                  name="budget"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40"
                  defaultValue=""
                >
                  <option value="">Prefer not to say yet</option>
                  <option>$5k - $10k</option>
                  <option>$10k - $25k</option>
                  <option>$25k - $50k</option>
                  <option>$50k+</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Timeline</span>
                <select
                  name="timeline"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40"
                  defaultValue=""
                >
                  <option value="">Select a launch window</option>
                  <option>As soon as possible</option>
                  <option>2-4 weeks</option>
                  <option>1-2 months</option>
                  <option>3+ months</option>
                  <option>Exploring options</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Preferred contact</span>
                <select
                  name="preferredContactMethod"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40"
                  defaultValue="Email"
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>Video call</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">Website URL</span>
                <input
                  name="websiteUrl"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40"
                  placeholder="https://company.com"
                />
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-slate-700">Subject</span>
                <input
                  name="subject"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40"
                  placeholder="Example: SaaS MVP rebuild with lead workflow"
                />
              </label>
            </div>
          </details>

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Send project brief
          </button>
        </form>
      </div>
    </div>
  )
}
