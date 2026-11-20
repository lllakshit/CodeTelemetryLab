"use client"

import { useEffect, useRef } from "react"
import type { HomeSceneHandle } from "./home-scene"

/**
 * Background layers and the loader for the home page's 3D scenes.
 *
 * The page text is server-rendered and readable on its own. This component only adds the fixed
 * canvas behind it, and only after the page has loaded and the browser is idle. The scene module
 * (three.js and the scene code) is a separate chunk that is never downloaded in "static" mode.
 *
 * Wrapper attribute `data-h3d`:  pending (server default) -> on (scene running)  |  static (no 3D)
 */
export function Home3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const tip = tipRef.current
    const cursor = cursorRef.current
    const root = canvas?.closest<HTMLElement>(".h3d")
    if (!canvas || !tip || !cursor || !root) return
    // The inline script in the page chooses "static" before first paint on a full page load. Client-side navigation
    // does not run it, so the same checks are repeated here.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
    if (
      root.dataset.h3d === "static" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      nav.connection?.saveData ||
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
      !window.WebGLRenderingContext
    ) {
      root.dataset.h3d = "static"
      return
    }

    let cancelled = false
    let handle: HomeSceneHandle | null = null
    let idleId: number | undefined
    let timer: number | undefined

    const fallBack = () => {
      handle?.destroy()
      handle = null
      root.dataset.h3d = "static"
    }

    const start = async () => {
      if (cancelled) return
      try {
        const { mountHomeScene } = await import("./home-scene")
        if (cancelled) return
        handle = mountHomeScene({
          root,
          canvas,
          tip,
          cursor,
          fontFamily: getComputedStyle(document.body).fontFamily,
          onReady: () => {
            if (!cancelled) root.dataset.h3d = "on"
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

    const schedule = () => {
      if (cancelled) return
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(() => void start(), { timeout: 3000 })
      else timer = window.setTimeout(() => void start(), 1200)
    }

    if (document.readyState === "complete") schedule()
    else window.addEventListener("load", schedule, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener("load", schedule)
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId)
      if (timer !== undefined) window.clearTimeout(timer)
      handle?.destroy()
    }
  }, [])

  return (
    <>
      <div className="h3d-bg" aria-hidden="true" />
      <div className="h3d-glow" aria-hidden="true" />
      <canvas ref={canvasRef} className="h3d-gl" aria-hidden="true" />
      <div ref={tipRef} className="h3d-tip" aria-hidden="true" />
      <div ref={cursorRef} className="h3d-cursor" aria-hidden="true" />
    </>
  )
}
