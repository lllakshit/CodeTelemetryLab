import { CheckCircle2, Mail, MapPin } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { sent?: string }
}) {
  const sent = searchParams?.sent === "1"

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Contact"
        title="Start with a project brief, not a vague request."
        description="The inquiry form is intentionally structured so you can share the important constraints up front."
      />

      {sent ? (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Your inquiry was received. We will respond after reviewing the details.
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">What to include</p>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-400">
            <li>Current problem or project goal</li>
            <li>Deadline or launch window</li>
            <li>Stack preference or existing systems</li>
            <li>Budget range and decision-maker context</li>
          </ul>

          <div className="mt-8 space-y-4 border-t border-white/8 pt-6 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-300" />
              hello@codetelemetrylabs.com
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-300" />
              Remote-first, working across North American time zones
            </p>
          </div>
        </div>

        <form
          action="/api/contact"
          method="post"
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Name</span>
              <input
                name="name"
                required
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                type="email"
                name="email"
                required
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
                placeholder="you@company.com"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Company</span>
              <input
                name="company"
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
                placeholder="Company or startup name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Project type</span>
              <select
                name="projectType"
                required
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-blue-400/40"
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
              <span className="text-slate-300">Budget</span>
              <select
                name="budget"
                required
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-blue-400/40"
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
              <span className="text-slate-300">Message</span>
              <textarea
                name="message"
                required
                rows={7}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
                placeholder="Describe the problem, timeline, and any existing constraints."
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
          >
            Submit inquiry
          </button>
        </form>
      </div>
    </div>
  )
}
