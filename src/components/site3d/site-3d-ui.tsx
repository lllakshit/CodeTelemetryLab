import type { ReactNode } from "react"
import { Words, vars } from "./site-3d-page"

/** Gradient colour pairs used for card badges, in the order the prototype cycles them. */
export const BADGE_PAIRS: Array<[string, string]> = [
  ["#3b5bdb", "#6d8dff"],
  ["#12a37f", "#5fd6b8"],
  ["#7a4fe0", "#a98cf5"],
  ["#e8912d", "#f7b866"],
  ["#1fa65a", "#6fd69a"],
]

/** Reveal delay for the i-th card in a three-column grid (0, 0.07 s, 0.14 s, ...). */
export const revealDelay = (i: number, cols = 3) => `${((i % cols) * 0.07).toFixed(2)}s`

/** 24x24 line icon in the prototype's style. Pass the inner SVG elements as children. */
export function Glyph({ children, size = 22, color = "#fff", width = 1.9 }: { children: ReactNode; size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

/** The spinning glass cube used beside call-to-action panels. */
export function Rcube() {
  return (
    <div className="rcube">
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}

/**
 * Page hero: eyebrow, the one h1 (words flip in), lead paragraph and the page's 3D stage.
 * `scene` names the WebGL scene in site-scenes.ts; `dots` adds step buttons under the stage (one per label).
 */
export function SceneHero({
  id,
  eyebrow,
  title,
  lead,
  scene,
  label,
  hint,
  dots,
  steps,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  lead: string
  scene: "services" | "projects" | "process" | "blog" | "about" | "careers"
  /** Accessible description of what the 3D scene shows. */
  label: string
  hint?: string
  /** Labels for the step buttons under the stage (omit for none). */
  dots?: string[]
  /** Plain-text list shown instead of the stage when there is no 3D (omit to hide the figure in that case). */
  steps?: string[]
  /** Extra content under the lead (buttons, notes). */
  children?: ReactNode
}) {
  return (
    <section className="hero solo" aria-labelledby={id}>
      <div className="hero-copy">
        <p className="eyebrow">
          <i aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="h1" id={id}>
          <Words text={title} />
        </h1>
        <p className="lead">{lead}</p>
        {children}
      </div>
      <figure className={`flow card rv nocap${steps ? "" : " nolist"}`} data-scene={scene} data-tilt="4" style={vars({ "--d": ".15s" })}>
        <div className="flow-top dotsonly">
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="flow-stage">
          <canvas className="cv3d" role="img" aria-label={label} />
          {hint ? (
            <span className="hint" aria-hidden="true">
              {hint}
            </span>
          ) : null}
        </div>
        {dots?.length ? (
          <div className="flow-dots" role="group" aria-label={label}>
            {dots.map((d, i) => (
              <button key={`${i}-${d}`} type="button" aria-label={d} />
            ))}
          </div>
        ) : null}
        {steps?.length ? (
          <ol className="flow-steps">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        ) : null}
      </figure>
    </section>
  )
}
