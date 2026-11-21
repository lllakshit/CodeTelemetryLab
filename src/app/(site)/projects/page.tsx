import type { Metadata } from "next"
import Link from "next/link"
import { Site3DPage, vars } from "@/components/site3d/site-3d-page"
import { Rcube, SceneHero } from "@/components/site3d/site-3d-ui"
import { listProjects } from "@/lib/cms"

export const metadata: Metadata = {
  title: "Projects | Selected Engineering Case Studies",
  description:
    "Selected CodeTelemetryLab engagements covering portals, automation, and SaaS foundations—problem, approach, stack, and outcome.",
  alternates: { canonical: "/projects" },
}

/** One layer of the exploded isometric stack beside each case study: pattern class and gradient colours. */
type IsoLayer = { pattern: "d-grid" | "d-lines" | "d-bars" | "d-dots" | "d-ring"; c1: string; c2: string }

/** The prototype's three layer sets (blue, green, violet), cycled by case index to match the 3D scene's window colours. */
const ISO_SETS: IsoLayer[][] = [
  [
    { pattern: "d-grid", c1: "#dfe7ff", c2: "#a9bcff" },
    { pattern: "d-lines", c1: "#c9d6ff", c2: "#7f9bff" },
    { pattern: "d-bars", c1: "#b5c6ff", c2: "#5f7fff" },
    { pattern: "d-dots", c1: "#9db3ff", c2: "#2b4fe0" },
  ],
  [
    { pattern: "d-grid", c1: "#d8f4ea", c2: "#9be3d0" },
    { pattern: "d-lines", c1: "#c4efe0", c2: "#6ed3b6" },
    { pattern: "d-ring", c1: "#aee8d3", c2: "#3cc39b" },
    { pattern: "d-dots", c1: "#8fe0c4", c2: "#12a37f" },
  ],
  [
    { pattern: "d-lines", c1: "#ece4ff", c2: "#c9b6fb" },
    { pattern: "d-grid", c1: "#e0d4ff", c2: "#b19af5" },
    { pattern: "d-dots", c1: "#d2c1ff", c2: "#9677f0" },
    { pattern: "d-bars", c1: "#bfa8ff", c2: "#7a4fe0" },
  ],
]

export default async function ProjectsPage() {
  const projects = await listProjects({ publishedOnly: true })
  const sceneLabel = projects.length
    ? `Interactive 3D preview of the case studies: ${projects.map((project) => project.category.toLowerCase()).join(", ")}`
    : "Interactive 3D preview of the case studies"

  return (
    <Site3DPage>
      <div className="wrap">
        <SceneHero
          id="h1-projects"
          eyebrow="Projects"
          title="Selected work from recent product and operations engagements."
          lead="Each case study documents the operating problem, the system we built, the stack, and what changed after launch."
          scene="projects"
          label={sceneLabel}
          hint="Drag · tap a window · tap again to open"
          dots={projects.map((project) => `${project.category} case study`)}
        />

        {projects.length ? (
          <section className="cases" aria-label="Case studies">
            {projects.map((project, i) => {
              const layers = ISO_SETS[i % ISO_SETS.length]
              return (
                <article
                  key={project.id}
                  className="case card rv"
                  id={`case-${i}`}
                  data-label={project.category}
                  data-tilt="2"
                  style={vars({ "--i": String(i) })}
                >
                  <div className="case-vis z2">
                    <div className="iso" aria-hidden="true">
                      <div className="iso-stack">
                        {layers.map((layer, l) => (
                          <i
                            key={l}
                            className={`iso-l ${layer.pattern}`}
                            data-i={l}
                            style={vars({ "--i": String(l), "--c1": layer.c1, "--c2": layer.c2 })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="case-body">
                    <header>
                      <p className="eyebrow-s" style={{ margin: 0 }}>
                        {project.category}
                      </p>
                      <h2 className="h2" style={{ margin: 0 }}>
                        {project.title}
                      </h2>
                      <Link className="rc" href={`/projects/${project.slug}`}>
                        Read case study
                      </Link>
                    </header>
                    <div className="case-cols">
                      <div>
                        <div className="blk">
                          <p className="lab">Problem</p>
                          <p className="t">{project.problem}</p>
                        </div>
                        <div className="blk">
                          <p className="lab">Solution</p>
                          <p className="t">{project.solution}</p>
                        </div>
                      </div>
                      <div>
                        <div className="blk">
                          <p className="lab">Stack</p>
                          <div className="stackchips">
                            {project.stack.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        </div>
                        <div className="blk">
                          <p className="lab">Outcome</p>
                          <p className="t">{project.results}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <section className="sec" style={{ paddingBottom: 80 }}>
            <div className="card cta rv" data-tilt="3">
              <div className="z2">
                <h2 className="h2">Case studies coming soon</h2>
                <p className="muted">Meanwhile, send a brief and we can walk through relevant past work on a call.</p>
                <Link className="btn" href="/contact">
                  Send a brief
                </Link>
              </div>
              <div className="cta-art" aria-hidden="true">
                <Rcube />
              </div>
            </div>
          </section>
        )}
      </div>
    </Site3DPage>
  )
}
