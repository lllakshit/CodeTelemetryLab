import type { CSSProperties } from "react"
import { Fragment } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDown, Check, Clock, Mail, MapPin, MessageCircle, Send } from "lucide-react"
import { Contact3D } from "@/components/contact3d/contact-3d"
import {
  budgetOptions,
  contactFaqs,
  contactHeading,
  contactLead,
  contactLocation,
  contactMethodOptions,
  includeHints,
  inquiryCaption,
  inquirySteps,
  invalidMessage,
  projectTypeOptions,
  responseNotes,
  sentMessage,
  timelineOptions,
} from "@/components/contact3d/contact-data"
import "@/components/contact3d/contact-3d.css"
import { CONTACT_DISPLAY_EMAIL } from "@/lib/contact"
import { attributionFromSearchParams } from "@/lib/lead-capture"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Contact | Send a Project Brief",
  description:
    "Contact CodeTelemetryLab with your name, email, and project message. Expect a real engineering response within one business day.",
  path: "/contact",
})

/**
 * Runs before first paint. Marks the page as script-enabled (so the reveal animation can start hidden; if the page
 * script has not started 4 s later the mark is removed again, so nothing stays hidden) and chooses the plain layout for reduced motion, data saver, small-memory devices and browsers without WebGL.
 */
const layoutChoice = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;r.setAttribute("data-js","1");setTimeout(function(){if(!r.hasAttribute("data-enh"))r.removeAttribute("data-js")},4000);var c=navigator.connection;var m=navigator.deviceMemory;if(matchMedia("(prefers-reduced-motion: reduce)").matches||(c&&c.saveData)||(m&&m<=2)||!window.WebGLRenderingContext)r.setAttribute("data-c3d","static")}catch(e){}})()`

const delay = (value: string) => ({ "--d": value }) as CSSProperties

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const sent = resolvedSearchParams?.sent === "1"
  const invalidSubmission = resolvedSearchParams?.error === "invalid"
  const state = sent ? "sent" : invalidSubmission ? "error" : undefined
  const attribution = attributionFromSearchParams(resolvedSearchParams)
  const serviceFromQuery = typeof resolvedSearchParams?.service === "string" ? resolvedSearchParams.service : ""
  const defaultProjectType = attribution.serviceInterestedIn || serviceFromQuery || ""
  const flowLabel = `Interactive 3D inquiry flow: ${inquirySteps.map((s) => s.replace(/&/g, "and")).join(", ")}`

  return (
    <div className="c3d" data-c3d="pending" data-state={state} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: layoutChoice }} />
      <Contact3D />

      <div className="c-page">
        <div className="c-wrap">
          {/* ---- hero: heading and the 3D inquiry flow ---- */}
          <section className="c-hero" aria-labelledby="c-h1">
            <div className="c-copy">
              <p className="c-eyebrow">
                <i aria-hidden="true" />
                Contact
              </p>
              <h1 className="c-h1" id="c-h1">
                {contactHeading.split(" ").map((word, i) => (
                  <Fragment key={`${word}-${i}`}>
                    {i > 0 ? " " : null}
                    <span className="c-w" style={{ animationDelay: `${(0.1 + i * 0.07).toFixed(2)}s` }}>
                      {word}
                    </span>
                  </Fragment>
                ))}
              </h1>
              <p className="c-lead">{contactLead}</p>
              {sent ? (
                <p className="c-top-note ok" role="status">
                  {sentMessage}
                </p>
              ) : null}
              {invalidSubmission ? (
                <p className="c-top-note err" role="alert">
                  {invalidMessage}
                </p>
              ) : null}
            </div>

            <figure className="c-flow c-card c-rv" id="c-flow" data-tilt="4" style={delay(".15s")}>
              <div className="c-flow-top">
                <p className="c-eyebrow sm">Inquiry flow</p>
                <span className="c-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="c-stage">
                <canvas id="c-flow-canvas" className="c-gl" role="img" aria-label={flowLabel} />
                <span className="c-hint" aria-hidden="true">
                  Drag · tap a step
                </span>
                <ol className="c-flow-steps">
                  {inquirySteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="c-flow-dots" role="group" aria-label="Inquiry steps">
                {inquirySteps.map((step, i) => (
                  <button key={step} type="button" aria-label={`Step ${i + 1}: ${step}`} aria-current={i === 2 ? "true" : "false"} />
                ))}
              </div>
              <figcaption className="c-cap">{inquiryCaption}</figcaption>
            </figure>
          </section>

          <div className="c-grid">
            <div className="c-left">
              {/* ---- what to include ---- */}
              <section className="c-card c-inc-card c-rv" data-tilt="5">
                <p className="c-eyebrow-s c-z1">What to include</p>
                <ul className="c-inc c-z1">
                  {includeHints.map((item, i) => (
                    <li key={item}>
                      <span className="n" aria-hidden="true">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* ---- email and location ---- */}
              <section className="c-card c-contact-card c-rv" data-tilt="6" style={delay(".08s")}>
                <div className="c-line">
                  <span className="c-ico" aria-hidden="true">
                    <Mail size={22} strokeWidth={1.9} color="#2b4fe0" />
                  </span>
                  <div className="c-z2">
                    <a href={`mailto:${CONTACT_DISPLAY_EMAIL}`}>{CONTACT_DISPLAY_EMAIL}</a>
                  </div>
                </div>
                <div className="c-line">
                  <span className="c-ico" aria-hidden="true">
                    <MapPin size={22} strokeWidth={1.9} color="#2b4fe0" />
                  </span>
                  <p className="c-z2">{contactLocation}</p>
                </div>
              </section>

              {/* ---- engagement expectations ---- */}
              <section className="c-card c-exp-card c-rv" data-tilt="3">
                <p className="c-eyebrow-s c-z1">Engagement expectations</p>
                <div className="c-cover" id="c-cover" tabIndex={0} role="group" aria-label="Engagement expectations">
                  {[Clock, MessageCircle, Check].map((Icon, i) => (
                    <div className="c-cov" key={responseNotes[i]}>
                      <span className="k" aria-hidden="true">
                        <Icon size={20} strokeWidth={2} color="#fff" />
                      </span>
                      {responseNotes[i]}
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- FAQ ---- */}
              <section className="c-card c-faq-card c-rv" data-tilt="3">
                <p className="c-eyebrow-s c-z1">Contact FAQs</p>
                <div className="c-z1">
                  {contactFaqs.map((item, i) => (
                    <div className={`c-faq-item${i === 0 ? " open" : ""}`} key={item.q}>
                      <button type="button" className="c-q" id={`c-q${i}`} aria-expanded={i === 0} aria-controls={`c-a${i}`}>
                        <span>{item.q}</span>
                        <i className="c-chev" aria-hidden="true" />
                      </button>
                      <div className="c-a" id={`c-a${i}`} role="region" aria-labelledby={`c-q${i}`}>
                        <div>
                          <p>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ---- the form: a normal POST to /api/contact ---- */}
            <div className="c-right">
              <section className="c-card c-form-card c-rv" data-tilt="2.5" id="brief" style={delay(".1s")}>
                <div className="c-progress c-z3" aria-hidden="true">
                  {["name", "email", "message"].map((field) => (
                    <span className="c-cube" data-cube={field} key={field}>
                      <i className="f" />
                      <i className="b" />
                      <i className="l" />
                      <i className="r" />
                    </span>
                  ))}
                </div>

                {invalidSubmission ? (
                  <p className="c-alert" role="alert">
                    {invalidMessage}
                  </p>
                ) : null}

                <form id="c-form" className="c-form" action="/api/contact" method="post" inert={sent}>
                  <input type="hidden" name="source" value="contact-page" />
                  {attribution.landingPageUrl ? <input type="hidden" name="referrer" value={attribution.landingPageUrl} /> : null}
                  {attribution.utmSource ? <input type="hidden" name="utmSource" value={attribution.utmSource} /> : null}
                  {attribution.utmMedium ? <input type="hidden" name="utmMedium" value={attribution.utmMedium} /> : null}
                  {attribution.utmCampaign ? <input type="hidden" name="utmCampaign" value={attribution.utmCampaign} /> : null}
                  {attribution.utmTerm ? <input type="hidden" name="utmTerm" value={attribution.utmTerm} /> : null}
                  {attribution.utmContent ? <input type="hidden" name="utmContent" value={attribution.utmContent} /> : null}
                  <div className="c-hp" aria-hidden="true">
                    <label>
                      Leave this field blank
                      <input name="fax" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>

                  <div className="c-field">
                    <label htmlFor="c-name">
                      Name <span>(required)</span>
                    </label>
                    <input className="c-inp" id="c-name" name="name" type="text" required autoComplete="name" placeholder="Your name" />
                  </div>
                  <div className="c-field">
                    <label htmlFor="c-email">
                      Email <span>(required)</span>
                    </label>
                    <input className="c-inp" id="c-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
                  </div>
                  <div className="c-field">
                    <label htmlFor="c-message">
                      Message <span>(required)</span>
                    </label>
                    <textarea
                      className="c-inp"
                      id="c-message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Describe the problem, timeline, and what a successful first release looks like."
                    />
                  </div>

                  <details className="c-opt">
                    <summary>Optional project details</summary>
                    <p className="c-opt-note">
                      These fields stay optional. If you leave them blank, we still create the lead and follow up.
                    </p>
                    <div className="c-opt-grid">
                      <div className="c-field">
                        <label htmlFor="c-company">Company</label>
                        <input className="c-inp" id="c-company" name="company" type="text" autoComplete="organization" placeholder="Company or startup name" />
                      </div>
                      <div className="c-field">
                        <label htmlFor="c-phone">Phone</label>
                        <input className="c-inp" id="c-phone" name="phone" type="tel" autoComplete="tel" placeholder="Best number for follow-up" />
                      </div>
                      <div className="c-field full">
                        <label htmlFor="c-country">Country</label>
                        <input className="c-inp" id="c-country" name="country" type="text" autoComplete="country-name" placeholder="United States, Canada, or your region" />
                      </div>
                      <div className="c-field full">
                        <label htmlFor="c-projectType">Service interested in</label>
                        <select
                          className="c-inp"
                          id="c-projectType"
                          name="projectType"
                          defaultValue={(projectTypeOptions as readonly string[]).includes(defaultProjectType) ? defaultProjectType : ""}
                        >
                          <option value="">General project inquiry</option>
                          {projectTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="c-field">
                        <label htmlFor="c-budget">Budget</label>
                        <select className="c-inp" id="c-budget" name="budget" defaultValue="">
                          <option value="">Prefer not to say yet</option>
                          {budgetOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="c-field">
                        <label htmlFor="c-timeline">Timeline</label>
                        <select className="c-inp" id="c-timeline" name="timeline" defaultValue="">
                          <option value="">Select a launch window</option>
                          {timelineOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="c-field full">
                        <label htmlFor="c-pcm">Preferred contact</label>
                        <select className="c-inp" id="c-pcm" name="preferredContactMethod" defaultValue="Email">
                          {contactMethodOptions.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="c-field full">
                        <label htmlFor="c-websiteUrl">Website URL</label>
                        <input
                          className="c-inp"
                          id="c-websiteUrl"
                          name="websiteUrl"
                          type="text"
                          inputMode="url"
                          autoCapitalize="none"
                          autoComplete="url"
                          placeholder="https://company.com"
                        />
                      </div>
                      <div className="c-field full">
                        <label htmlFor="c-subject">Subject</label>
                        <input className="c-inp" id="c-subject" name="subject" type="text" placeholder="Example: SaaS MVP rebuild with lead workflow" />
                      </div>
                    </div>
                  </details>

                  <button className="c-btn c-submit" type="submit">
                    <span className="c-submit-label">Send project brief</span>
                    <Send size={18} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </form>

                {sent ? (
                  <div className="c-sent" role="status">
                    <svg className="c-plane" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                      <path d="M58 6 6 28l18 7 7 18z" fill="#eaf0ff" stroke="#2b4fe0" strokeWidth="3" strokeLinejoin="round" />
                      <path d="M58 6 24 35" stroke="#2b4fe0" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <p>{sentMessage}</p>
                    <Link className="c-btn sm" href="/contact" scroll={false}>
                      Send another brief
                    </Link>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Phones and tablets: a button that jumps to the form while it is off screen. */}
      <a className="c-btn c-fab" href="#brief" data-go-form>
        Send a brief
        <ArrowDown size={18} strokeWidth={2.4} aria-hidden="true" />
      </a>
    </div>
  )
}
