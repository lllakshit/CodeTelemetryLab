"use client"

import { useEffect, useRef } from "react"
import { enhanceContact } from "./contact-enhance"
import type { ContactSceneHandle } from "./contact-scene"

/**
 * Background layers, page behaviours and the loader for the contact page's 3D.
 *
 * The page text and the form are server-rendered and work on their own. This component adds the behaviours in
 * contact-enhance.ts straight away, and loads the 3D scene (a separate chunk with three.js) once the visitor first moves,
 * scrolls or taps (or after 7 s) and the browser is idle. In "static" mode the scene chunk is never downloaded.
 *
 * Wrapper attribute `data-c3d`:  pending (server default) -> on (scene running)  |  static (no 3D)
 */
export function Contact3D() {
  const bgRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const bg = bgRef.current
    const root = bg?.closest<HTMLElement>(".c3d")
    if (!bg || !root) return

    // The inline script in the page chooses "static" before first paint on a full page load. Client-side navigation
    // does not run it, so the same checks are repeated here.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    const stay =
      root.dataset.c3d === "static" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      nav.connection?.saveData ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      !window.WebGLRenderingContext
    if (stay) root.dataset.c3d = "static"
    root.dataset.js = "1"

    const stopEnhance = enhanceContact(root, { motion: !stay })
    if (stay) return stopEnhance

    root.dataset.c3dStage = "effect"
    let cancelled = false
    let handle: ContactSceneHandle | null = null
    let idleId: number | undefined
    let timer: number | undefined

    const fallBack = () => {
      handle?.destroy()
      handle = null
      root.dataset.c3d = "static"
    }

    const start = async () => {
      if (cancelled) return
      root.dataset.c3dStage = "start"
      try {
        const { mountContactScene } = await import("./contact-scene")
        root.dataset.c3dStage = "loaded"
        // Loading the scene code and creating the GL context are separate chunks of work.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
        if (cancelled) return
        handle = mountContactScene({
          root,
          bgCanvas: bg,
          fontFamily: getComputedStyle(document.body).fontFamily,
          onReady: () => {
            if (!cancelled) {
              root.dataset.c3d = "on"
              root.dataset.c3dStage = "ready"
            }
          },
          onFail: () => {
            if (!cancelled) fallBack()
          },
        })
      } catch {
        // No WebGL, or the scene failed to load: the plain layout still has every word of the page.
        if (!cancelled) fallBack()
      }
    }

    // The page is complete and interactive first. The scene starts when the visitor first moves, scrolls, taps or presses a
    // key (or 7 s after load if they do not), and then only when the browser is idle. Loading three.js and creating the GL
    // context therefore never competes with hydration, the cookie banner or the first paint.
    const events = ["pointermove", "scroll", "wheel", "touchstart", "pointerdown", "keydown"]
    let triggered = false
    let loadFallback: number | undefined
    const trigger = () => {
      if (triggered || cancelled) return
      triggered = true
      events.forEach((e) => window.removeEventListener(e, trigger))
      window.clearTimeout(loadFallback)
      root.dataset.c3dStage = "idle-wait"
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(() => void start(), { timeout: 2500 })
      else timer = window.setTimeout(() => void start(), 0)
    }
    root.dataset.c3dStage = "scheduled"
    events.forEach((e) => window.addEventListener(e, trigger, { passive: true }))
    const arm = () => {
      loadFallback = window.setTimeout(trigger, 7000)
    }
    if (document.readyState === "complete") arm()
    else window.addEventListener("load", arm, { once: true })
    // If the carousel has not drawn 15 s after the page loaded (a stalled chunk request, for example), give the visitor
    // the plain layout instead of leaving a blank stage.
    const watchdog = window.setTimeout(() => {
      if (!cancelled && root.dataset.c3d === "pending") fallBack()
    }, 15000)

    return () => {
      cancelled = true
      stopEnhance()
      events.forEach((e) => window.removeEventListener(e, trigger))
      window.removeEventListener("load", arm)
      window.clearTimeout(loadFallback)
      window.clearTimeout(watchdog)
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId)
      if (timer !== undefined) window.clearTimeout(timer)
      handle?.destroy()
    }
  }, [])

  return (
    <>
      <div className="c-fill" aria-hidden="true" />
      <canvas ref={bgRef} className="c-bg" aria-hidden="true" />
    </>
  )
}
