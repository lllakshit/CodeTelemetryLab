import type { Metadata } from "next"
import { CheckCircle2, Mail, MapPin } from "lucide-react"
import { BrandIllustration } from "@/components/brand-illustration"
import { SectionHeading } from "@/components/section-heading"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send CodeTelemetryLabs a project brief to discuss agency websites, admin systems, content workflows, or product engineering work.",
}

const responseNotes = [
  "A real response within one business day",
  "No generic intake script or outsourced sales flow",
  "A scoped follow-up based on the actual brief you send",
]

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const sent = resolvedSearchParams?.sent === "1"

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <SectionHeading
          eyebrow="Contact"
          title="Start with a project brief, not a vague request."
          description="The inquiry flow is intentionally structured so you can share the problem, constraints, and timeline before anyone wastes time in a generic sales call."
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

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-700">What to include</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              <li>Current problem or project goal</li>
              <li>Deadline or launch window</li>
              <li>Stack preference or existing systems</li>
              <li>Budget range and decision-maker context</li>
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
                Remote-first, working across North American time zones
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300">What happens next</p>
            <div className="mt-5 space-y-4">
              {responseNotes.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  <span>{item}</span>
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
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">Name</span>
              <input
                name="name"
                required
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                required
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="you@company.com"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">Company</span>
              <input
                name="company"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="Company or startup name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">Project type</span>
              <select
                name="projectType"
                required
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40 focus:bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a project type
                </option>
                <option>Web development</option>
                <option>SaaS platform</option>
                <option>AI automation</option>
                <option>API engineering</option>
                <option>Technical documentation</option>
                <option>Cloud infrastructure</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-700">Budget</span>
              <select
                name="budget"
                required
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400/40 focus:bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a budget range
                </option>
                <option>$5k - $10k</option>
                <option>$10k - $25k</option>
                <option>$25k - $50k</option>
                <option>$50k+</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className="text-slate-700">Message</span>
              <textarea
                name="message"
                required
                rows={7}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400/40 focus:bg-white"
                placeholder="Describe the problem, timeline, existing tools, and what needs to feel credible in the first release."
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Submit inquiry
          </button>
        </form>
      </div>
    </div>
  )
}
