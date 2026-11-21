import { Fragment, type CSSProperties, type ReactNode } from "react"
import { Site3D } from "./site-3d"
import "./site-3d.css"

/**
 * Runs before first paint. Marks the page as script-enabled (so the reveal animation can start hidden; if the page
 * script has not started 4 s later the mark is removed again, so nothing stays hidden) and chooses the plain layout for
 * reduced motion, data saver, small-memory devices and browsers without WebGL.
 */
const layoutChoice = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;r.setAttribute("data-js","1");setTimeout(function(){if(!r.hasAttribute("data-enh"))r.removeAttribute("data-js")},4000);var c=navigator.connection;var m=navigator.deviceMemory;if(matchMedia("(prefers-reduced-motion: reduce)").matches||(c&&c.saveData)||(m&&m<=2)||!window.WebGLRenderingContext)r.setAttribute("data-s3d","static")}catch(e){}})()`

/**
 * Wrapper for every page built on the shared 3D design system. Server component: the page content is plain HTML.
 * `Site3D` (client) adds the background, the behaviours and, after the first interaction, the 3D scenes found inside.
 */
export function Site3DPage({ children }: { children: ReactNode }) {
  return (
    <div className="s3d" data-s3d="pending" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: layoutChoice }} />
      <Site3D />
      <div className="s3d-page">{children}</div>
    </div>
  )
}

/** A heading whose words flip in one after another. The text content stays exactly the same for search engines. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          {i > 0 ? " " : null}
          <span className="w" style={{ animationDelay: `${(0.1 + Math.min(i, 14) * 0.07).toFixed(2)}s` }}>
            {word}
          </span>
        </Fragment>
      ))}
    </>
  )
}

/** `style` helper for the reveal delay (`--d`) and other CSS variables used by the design system. */
export const vars = (v: Record<string, string>) => v as CSSProperties
