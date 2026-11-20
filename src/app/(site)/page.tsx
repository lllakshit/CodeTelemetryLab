import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ProcessFlowDiagram, processSteps } from "@/components/diagrams/engineering-diagrams"
import { HeroPulse } from "@/components/hero-pulse"
import { Home3D } from "@/components/home3d/home-3d"
import { serviceMeta, spotlightSlugs } from "@/components/home3d/home-data"
import { SceneNav } from "@/components/home3d/scene-nav"
import { getHomeContent, listBlogPosts, listProjects } from "@/lib/cms"
import { seoServices } from "@/lib/seo-markets"
import "@/components/home3d/home-3d.css"

export const metadata: Metadata = {
  title: {
    absolute: "CodeTelemetryLab | Custom Software, AI Systems & Product Delivery",
  },
  description:
    "CodeTelemetryLab helps founders and operators ship AI features, automation, SaaS products, and custom software with clear scope, durable architecture, and a handoff your team can run.",
  alternates: { canonical: "/" },
}

const audiences = [
  {
    title: "Founders launching a first product",
    text: "You need an MVP that real users can operate—not a prototype that collapses when permissions and edge cases arrive.",
  },
  {
    title: "Operators drowning in manual handoffs",
    text: "Status lives in chat. Spreadsheets became the database. You need a console or portal that matches how work actually moves.",
  },
  {
    title: "Product teams extending a working system",
    text: "The codebase must stay navigable. You want a partner who leaves boundaries, docs, and tests—not a mysterious patch.",
  },
]

const tech = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Supabase",
  "Docker",
  "OpenAI / Anthropic APIs",
  "Auth.js",
]

const homeFaqs = [
  {
    q: "What kinds of projects do you take?",
    a: "AI features inside products, automation and ops consoles, SaaS foundations, client portals, and custom internal tools. Pure one-page brochure sites without a data or workflow problem are usually a poor fit.",
  },
  {
    q: "How do engagements start?",
    a: "You send a brief. We reply within one business day with clarifying questions or a proposed first slice. Paid discovery is used when scope is large or ambiguous.",
  },
  {
    q: "Do you work with our in-house engineers?",
    a: "Yes. We collaborate in your repositories, write for the next reader, and prefer pair reviews over black-box deliveries.",
  },
  {
    q: "Where are you based?",
    a: "Jaipur, India, with remote delivery across North America, Europe, the UAE, and Australia. Time-zone overlap is planned into the cadence.",
  },
]

/**
 * Runs before the page is painted. Picks the plain layout for people who asked for less motion, turned on
 * data saver, or are on a very low-memory device, so they never see the 3D layout flash first.
 * Everything else starts in the 3D layout; the scene itself loads later, after the page is idle.
 */
const layoutChoice = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var c=navigator.connection;var m=navigator.deviceMemory;if(matchMedia("(prefers-reduced-motion: reduce)").matches||(c&&c.saveData)||(m&&m<=2)||!window.WebGLRenderingContext)r.setAttribute("data-h3d","static")}catch(e){}})()`

export default async function HomePage() {
  const [home, projects, blogs] = await Promise.all([
    getHomeContent(),
    listProjects({ publishedOnly: true }),
    listBlogPosts({ publishedOnly: true }),
  ])

  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3)
  const spotlightServices = seoServices.filter((s) => (spotlightSlugs as readonly string[]).includes(s.slug))
  const recentPosts = blogs.slice(0, 3)

  return (
    <div className="h3d" data-h3d="pending" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: layoutChoice }} />
      <Home3D />
      <SceneNav hasNotes={recentPosts.length > 0} />

      {/* Scene 0 · hero and who we help */}
      <section className="sc sc-hero" id="hero" data-scene="0" data-label="Overview">
        <div className="stage">
          <div className="h3d-pulse" aria-hidden="true">
            <HeroPulse />
          </div>
          <div className="copy">
            <p className="eyebrow">Software engineering for product teams</p>
            <h1>Build systems your operators can run—AI, automation, SaaS, and custom software with clear ownership.</h1>
            <p className="lede">
              CodeTelemetryLab partners with founders, CTOs, and operations leads who need production workflows: validated
              data, role-aware access, documented handoffs, and releases that survive contact with real users.
            </p>
            <div className="row">
              <Link className="btn primary" href="/contact">
                Send a project brief <span aria-hidden="true">→</span>
              </Link>
              <Link className="btn ghost" href="/process">
                How we deliver
              </Link>
            </div>
            <ul className="checks">
              {[
                "Scoped first releases in weeks, not vague roadmaps",
                "Architecture that leaves room for the next phase",
                "Remote delivery with written decisions",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="facts">
              {home.stats.map((item) => (
                <div key={item.label} className="fact card">
                  <small>{item.label}</small>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
            {/* The product image stays on the page (alt text, crawlers). With 3D on it is drawn on the top slab; without 3D it is shown as a card. */}
            <figure className="h3d-shot">
              <Image
                src="/uploads/dashboard-image.png"
                alt="Product operations interface with workflows and status"
                width={1372}
                height={830}
                sizes="(max-width: 1024px) 92vw, 560px"
              />
            </figure>
          </div>
        </div>
      </section>
      <section className="flow" id="who" data-scene="0">
        <div className="copy">
          <p className="eyebrow">Who we help</p>
          <h2>Built for people accountable for shipping and running software.</h2>
          <p className="sub">If you own the outcome after launch, you are the reader we write for.</p>
          <div className="aud">
            {audiences.map((item) => (
              <article key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Scene 1 · capabilities */}
      <section className="sc sc-services" id="services" data-scene="1" data-label="Services">
        <div className="stage">
          <div className="copy">
            <p className="eyebrow">Capabilities</p>
            <h2>What we build when the workflow has to work on day one.</h2>
            <p className="sub">Each service page explains problems, approach, architecture, and FAQs—not a slogan list.</p>
            <div className="svc-list">
              {spotlightServices.map((service, index) => {
                const meta = serviceMeta[service.slug]
                return (
                  <article
                    key={service.slug}
                    className={index === 0 ? "svc on" : "svc"}
                    data-short={meta?.short ?? service.name}
                    data-glyph={meta?.glyph ?? index}
                  >
                    <div className="hd">
                      <span className="no">{String(index + 1).padStart(2, "0")}</span>
                      <h3>
                        <Link href={`/services/${service.slug}`}>{service.name}</Link>
                      </h3>
                    </div>
                    <div className="more">
                      <div>
                        <p>{service.description}</p>
                        <Link href={`/services/${service.slug}`}>Read the approach</Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <Link className="tlink" href="/services">
              View all services
            </Link>
            <p className="hintline" aria-hidden="true">
              Drag or tap a token to explore
            </p>
          </div>
        </div>
      </section>

      {/* Scene 2 · process and technologies */}
      <section className="sc sc-process" id="process" data-scene="2" data-label="Process">
        <div className="stage">
          <div className="copy">
            <p className="eyebrow">Engineering process</p>
            <h2>Discover, architect, build, harden, operate.</h2>
            <p className="sub">The same cadence appears on every engagement. Details live on the process page.</p>
            <ol className="steps" aria-label="Delivery process from discovery through maintenance">
              {processSteps.map((step, index) => (
                <li key={step.label} className={index === 0 ? "on" : undefined}>
                  <span className="no">{String(index + 1).padStart(2, "0")}</span>
                  <b>{step.label}</b>
                  <em>{step.sub}</em>
                </li>
              ))}
            </ol>
            <div className="h3d-diagram">
              <ProcessFlowDiagram className="h-auto w-full" />
            </div>
            <Link className="tlink" href="/process">
              Read the full process
            </Link>
          </div>
        </div>
      </section>
      <section className="flow" id="tech" data-scene="2">
        <div className="copy">
          <p className="eyebrow">Technologies</p>
          <h2>Tools chosen for the problem—not for a buzzword slide.</h2>
          <p className="sub">We work primarily in TypeScript product stacks, with Python where data and AI pipelines fit better.</p>
          <ul className="chips">
            {tech.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="body-p">
            Stack decisions are documented in the engagement so your next hire understands why something exists—not only
            that it compiles.
          </p>
        </div>
      </section>

      {/* Scene 3 · selected work */}
      <section className="sc sc-work" id="work" data-scene="3" data-label="Work">
        <div className="stage">
          <div className="work-body">
            <div id="projTop">
              <div className="l">
                <p className="eyebrow">Selected work</p>
                <h2>Case studies written as engineering narratives.</h2>
                <p className="sub" style={{ marginTop: 10 }}>
                  Problem, constraints, decisions, tradeoffs, and outcomes—without invented metrics.
                </p>
              </div>
              <Link className="tlink" href="/projects">
                Browse projects
              </Link>
            </div>
            <div className="cases">
              {featuredProjects.map((project, index) => (
                <article key={project.id} className={index === 0 ? "case card on" : "case card"}>
                  <span className="tag">{project.category}</span>
                  <h3>{project.title}</h3>
                  <div className="case-more">
                    <div>
                      <p>{project.problem}</p>
                      <Link className="tlink" href={`/projects/${project.slug}`}>
                        Read case study
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scene 4 · why us and questions */}
      <section className="flow" id="why" data-scene="4" data-label="Delivery">
        <div className="copy wide">
          <p className="eyebrow">Why teams work with us</p>
          <h2>Competence shown in the work, not claimed in adjectives.</h2>
          <p className="sub">Clients return when the first release was honest, operable, and documented.</p>
          <p className="body-p">
            We write down decisions. We separate marketing surfaces from product surfaces. We refuse to invent customer
            logos or vanity metrics. When we do not know something, we say so and propose how to learn it cheaply.
          </p>
          <p className="body-p">
            Success is measured by whether operators can run the system, whether the next engineer can change it safely,
            and whether the first release answered the business question you actually asked.
          </p>
          <Link className="tlink" href="/about">
            About the practice
          </Link>
        </div>
      </section>
      <section className="flow" id="faq" data-scene="4">
        <div className="copy wide">
          <h2>Questions before you write</h2>
          <div className="faq">
            {homeFaqs.map((item) => (
              <article key={item.q} className="card">
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Scene 5 · next step */}
      <section className="flow" id="contact" data-scene="5" data-label="Contact">
        <div className="copy">
          <p className="eyebrow">Next step</p>
          <h2>{home.ctaTitle}</h2>
          <p className="lede">{home.ctaDescription}</p>
          <div className="row">
            <Link className="btn primary" href="/contact">
              Send a brief <span aria-hidden="true">→</span>
            </Link>
            <Link className="btn ghost" href="/locations">
              Markets we serve
            </Link>
          </div>
        </div>
      </section>

      {/* Notes sit outside the 3D layer */}
      {recentPosts.length ? (
        <section className="plain notes" id="notes" data-scene="6">
          <p className="eyebrow">Notes</p>
          <h2>Recent writing from the practice.</h2>
          <p className="sub">Architecture and delivery notes for teams deciding what to build next.</p>
          <div className="posts">
            {recentPosts.map((blog) => (
              <article key={blog.id} className="post card">
                <span className="tag">{blog.category}</span>
                <h3>
                  <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h3>
                <p>{blog.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
