import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Briefcase, CheckCircle2, Clock, MapPin } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { MAX_RESUME_BYTES } from "@/lib/applications"
import { GENERAL_APPLICATION, getJobBySlug, jobOpenings } from "@/lib/careers"
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo"

export function generateStaticParams() {
  return [...jobOpenings, GENERAL_APPLICATION].map((job) => ({ slug: job.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const job = getJobBySlug(slug)
  if (!job) return {}
  return buildPageMetadata({
    title: `${job.title} | Careers`,
    description: `${job.summary} ${job.location}. ${job.employmentType}.`.slice(0, 200),
    path: `/careers/${job.slug}`,
  })
}

const errorMessages: Record<string, string> = {
  invalid: "Some details look incomplete. Please check your name, email, and location and try again.",
  resume: "Please attach your résumé as a PDF, DOC, or DOCX file.",
  too_large: `That file is too large. Please upload a résumé under ${MAX_RESUME_BYTES / 1024 / 1024} MB.`,
  type: "We could not read that file. Please upload a real PDF, DOC, or DOCX résumé.",
  consent: "Please confirm that we may store your application so we can review it.",
  ratelimit: "Too many applications from this connection. Please try again in a little while.",
  unavailable: "Applications are temporarily unavailable. Please email contact@codetelemetrylab.me instead.",
  failed: "Something went wrong saving your application. Please try again, or email contact@codetelemetrylab.me.",
}

const fieldClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"

export default async function CareerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ applied?: string; error?: string }>
}) {
  const { slug } = await params
  const job = getJobBySlug(slug)
  if (!job) notFound()

  const query = await searchParams
  const applied = query?.applied === "1"
  const error = query?.error ? errorMessages[query.error] : undefined
  const isGeneral = job.slug === GENERAL_APPLICATION.slug

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Careers", path: "/careers" },
              { name: job.title, path: `/careers/${job.slug}` },
            ]),
          ),
        }}
      />

      <Link
        href="/careers#openings"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All open roles
      </Link>

      <div className="mt-8">
        <SectionHeading eyebrow={isGeneral ? "General application" : job.team} title={job.title} description={job.summary} level={1} />
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <li className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {job.location}
          </li>
          <li className="inline-flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {job.employmentType} · {job.workMode}
          </li>
          <li className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {job.experience}
          </li>
        </ul>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          {job.responsibilities.length ? (
            <section>
              <h2 className="text-xl font-semibold text-slate-950">What you will do</h2>
              <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-7 text-slate-700">
                {job.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {job.requirements.length ? (
            <section>
              <h2 className="text-xl font-semibold text-slate-950">What we look for</h2>
              <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-7 text-slate-700">
                {job.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {job.niceToHave.length ? (
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Nice to have</h2>
              <ul className="mt-4 list-disc space-y-3 pl-6 text-sm leading-7 text-slate-700">
                {job.niceToHave.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <section id="apply" aria-labelledby="apply-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8">
          <h2 id="apply-heading" className="text-2xl font-medium tracking-[-0.02em] text-slate-950">
            Apply for this role
          </h2>

          {applied ? (
            <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-900">
              <p className="inline-flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Application received
              </p>
              <p className="mt-2">
                Thank you. The team reviews every application and replies by email, usually within a week. You can
                also browse{" "}
                <Link href="/careers#openings" className="font-semibold underline underline-offset-2">
                  other open roles
                </Link>
                .
              </p>
            </div>
          ) : (
            <form
              action="/api/careers/apply"
              method="post"
              encType="multipart/form-data"
              data-track-form="job-application"
              className="mt-6 grid gap-5"
            >
              {error ? (
                <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}

              <input type="hidden" name="jobSlug" value={job.slug} />
              <label className="hidden" aria-hidden="true">
                Leave this field empty
                <input name="fax" tabIndex={-1} autoComplete="off" />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Full name *
                  <input name="fullName" required minLength={2} maxLength={120} autoComplete="name" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Email *
                  <input name="email" type="email" required maxLength={160} autoComplete="email" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone
                  <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Current location *
                  <input name="location" required minLength={2} maxLength={120} placeholder="City, country" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  LinkedIn
                  <input name="linkedinUrl" inputMode="url" maxLength={300} placeholder="linkedin.com/in/…" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Portfolio or GitHub
                  <input name="portfolioUrl" inputMode="url" maxLength={300} placeholder="github.com/…" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Current company
                  <input name="currentCompany" maxLength={120} autoComplete="organization" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Years of experience
                  <select name="yearsExperience" defaultValue="" className={fieldClass}>
                    <option value="">Select</option>
                    <option>Student or fresher</option>
                    <option>0-2 years</option>
                    <option>2-4 years</option>
                    <option>4-7 years</option>
                    <option>7+ years</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Notice period
                  <input name="noticePeriod" maxLength={60} placeholder="e.g. 30 days, immediate" className={fieldClass} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Expected compensation
                  <input name="expectedCompensation" maxLength={80} placeholder="Optional" className={fieldClass} />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Résumé * <span className="text-xs font-normal text-slate-500">PDF, DOC, or DOCX, up to 5 MB</span>
                <input
                  name="resume"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Anything we should know?
                <textarea
                  name="coverNote"
                  rows={5}
                  maxLength={3000}
                  placeholder="A short note on what you have built and why this role."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10"
                />
              </label>

              <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <input name="privacyConsent" type="checkbox" required className="mt-1 h-4 w-4 accent-blue-600" />
                <span>
                  I agree that CodeTelemetryLab may store my application and résumé to evaluate me for this and future
                  roles. See the{" "}
                  <Link href="/privacy" className="font-medium text-blue-700 underline underline-offset-2">
                    privacy policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Submit application
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
