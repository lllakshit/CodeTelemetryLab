"use client"

import { useEffect, useRef } from "react"
import { enhanceSite } from "./site-enhance"
import type { SiteScenesHandle } from "./site-scenes"

/**
 * Background layers, page behaviours and the 3D loader for pages built with `Site3DPage`.
 *
 * The behaviours in site-enhance.ts (reveal, tilt, FAQ, filters, timeline, CSS 3D pieces) start straight away. The
 * WebGL scenes (three.js, a separate chunk) load once the visitor first moves, scrolls, taps or presses a key (or 7 s
 * after load), inside an idle callback, so they never compete with the first paint or hydration. In "static" mode the
 * chunk is never downloaded.
 *
 * Wrapper attribute `data-s3d`:  pending (server default) -> on (3D running)  |  static (no 3D)
 */
export function Site3D() {
  const bgRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const bg = bgRef.current
    const root = bg?.closest<HTMLElement>(".s3d")
    if (!bg || !root) return

    // The inline script chooses "static" before first paint on a full page load; client-side navigation does not run
    // it, so the same checks are repeated here.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    const stay =
      root.dataset.s3d === "static" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      nav.connection?.saveData ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      !window.WebGLRenderingContext
    if (stay) root.dataset.s3d = "static"
    root.dataset.js = "1"

    const stopEnhance = enhanceSite(root, { motion: !stay })
    if (stay) return stopEnhance

    root.dataset.s3dStage = "scheduled"
    let cancelled = false
    let gaveUp = false
    let handle: SiteScenesHandle | null = null
    let idleId: number | undefined
    let timer: number | undefined
    let watchdog: number | undefined
    let loadFallback: number | undefined
    const events = ["pointermove", "scroll", "wheel", "touchstart", "pointerdown", "keydown"]

    const detach = () => {
      events.forEach((e) => window.removeEventListener(e, trigger))
      window.removeEventListener("load", arm)
      window.clearTimeout(loadFallback)
    }
    // Once the page has fallen back to the plain layout it stays there: a load that finishes later is thrown away.
    const fallBack = () => {
      gaveUp = true
      detach()
      window.clearTimeout(watchdog)
      handle?.destroy()
      handle = null
      root.dataset.s3d = "static"
    }

    const start = async () => {
      if (cancelled || gaveUp) return
      root.dataset.s3dStage = "start"
      // If nothing has drawn 15 s after loading started (a stalled chunk request, for example), use the plain layout.
      watchdog = window.setTimeout(() => {
        if (!cancelled && root.dataset.s3d === "pending") fallBack()
      }, 15000)
      try {
        const { mountSiteScenes } = await import("./site-scenes")
        root.dataset.s3dStage = "loaded"
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
        if (cancelled || gaveUp) return
        handle = mountSiteScenes({
          root,
          bgCanvas: bg,
          fontFamily: getComputedStyle(document.body).fontFamily,
          onReady: () => {
            if (!cancelled && !gaveUp) {
              window.clearTimeout(watchdog)
              root.dataset.s3d = "on"
              root.dataset.s3dStage = "ready"
            }
          },
          onFail: () => {
            if (!cancelled) fallBack()
          },
        })
      } catch {
        if (!cancelled) fallBack()
      }
    }

    let triggered = false
    function trigger() {
      if (triggered || cancelled) return
      triggered = true
      detach()
      root!.dataset.s3dStage = "idle-wait"
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(() => void start(), { timeout: 2500 })
      else timer = window.setTimeout(() => void start(), 0)
    }
    function arm() {
      loadFallback = window.setTimeout(trigger, 7000)
    }
    events.forEach((e) => window.addEventListener(e, trigger, { passive: true }))
    if (document.readyState === "complete") arm()
    else window.addEventListener("load", arm, { once: true })

    return () => {
      cancelled = true
      stopEnhance()
      detach()
      window.clearTimeout(watchdog)
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId)
      if (timer !== undefined) window.clearTimeout(timer)
      handle?.destroy()
    }
  }, [])

  return (
    <>
      <div className="s3d-fill" aria-hidden="true" />
      <canvas ref={bgRef} className="s3d-bg" aria-hidden="true" />
    </>
  )
}
