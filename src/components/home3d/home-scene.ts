/**
 * 3D scenes for the home page.
 *
 * One fixed WebGL canvas sits behind the normal HTML page. Scroll position scrubs the 3D objects, and
 * every scene has a hover / click / drag interaction. The page text, headings and links live in the
 * server-rendered HTML; this module only reads them (service names, process steps, case titles) and
 * never adds or removes content. It is loaded on demand, after the page has painted.
 *
 * Ported from the approved prototype ("CodeTelemetryLab — 3D Home Page Prototype"), with:
 *  - a mount/destroy lifecycle (listeners, observers, GPU resources are released on unmount)
 *  - scroll positions measured from the document (the site header is in the normal flow)
 *  - generic counts (services, steps, case studies) instead of fixed 6 / 5 / 3
 *  - touch taps that select a 3D object, a lower pixel ratio and fewer particles on phones
 *  - rendering paused while no scene is on screen
 */
import * as THREE from "three"
import { LAND_B64 } from "./land-mask"

export type HomeSceneOptions = {
  root: HTMLElement
  canvas: HTMLCanvasElement
  tip: HTMLElement
  cursor: HTMLElement
  /** CSS font-family string of the page (the self-hosted Plus Jakarta Sans), used for canvas textures. */
  fontFamily: string
  /** Called once the first frame is drawn. */
  onReady?: () => void
  /** Called if scene setup fails after mounting; the page falls back to its static layout. */
  onFail?: (error: unknown) => void
}

export type HomeSceneHandle = { destroy: () => void }

const C = { ink: 0x020618, blue: 0x1447e6, tint: 0xdfe8ff }
const PI2 = Math.PI * 2

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const ease = (t: number) => t * t * (3 - 2 * t)
/** Give the main thread back so no single step of scene set-up becomes a long task. */
const idle = () =>
  new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 1200 })
    else setTimeout(resolve, 50)
  })
const mark = (name: string) => {
  try {
    performance.mark(name)
  } catch {
    /* marks are optional */
  }
}
const rng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

type Ctx = { t: number; dt: number; px: number; py: number; aspect: number; p: number; pf: number; pin: number }
type FadeItem = { m: any; u?: { value: number }; base: number }
type SceneObj = {
  g: THREE.Group
  anchor: number
  scale: number
  fade: FadeItem[]
  update: (c: Ctx) => void
  st?: any
  meshes?: THREE.Mesh[]
}
type Group = {
  i: number
  els: HTMLElement[]
  label: string
  first: HTMLElement
  last: HTMLElement
  win: number
  wout: number
  w: number
  p: number
  pf: number
  pin: number
  top: number
  bottom: number
  firstH: number
}

/** The dashboard image URL to use as a texture: the one the browser already chose, else the ~1200px candidate. */
function pickHeroImageUrl(img: HTMLImageElement | null): string {
  if (!img) return ""
  if (img.currentSrc) return img.currentSrc
  const candidates = (img.getAttribute("srcset") || "")
    .split(",")
    .map((part) => part.trim().split(/\s+/))
    .map(([url, w]) => ({ url, w: parseInt(w || "0", 10) }))
    .filter((c) => c.url && c.w)
    .sort((a, b) => a.w - b.w)
  const pick = candidates.find((c) => c.w >= 1080) || candidates[candidates.length - 1]
  return pick ? pick.url : img.src
}

export function mountHomeScene(o: HomeSceneOptions): HomeSceneHandle {
  mark("h3d:mount")
  const { root, canvas, tip, cursor: cur } = o
  const $ = <T extends Element>(s: string, r: ParentNode = root) => r.querySelector<T>(s)
  const $$ = <T extends Element>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s))

  let destroyed = false
  const cleanups: Array<() => void> = []
  const on = (t: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn, opts)
    cleanups.push(() => t.removeEventListener(type, fn, opts))
  }

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches
  const touch = matchMedia("(pointer: coarse)").matches || matchMedia("(hover: none)").matches

  /* ---------- DOM-driven data (nothing is hard-coded: text comes from the page) ---------- */
  const SVC = $$<HTMLElement>(".svc")
  const SVC_NAMES = SVC.map((e) => $("h3", e)?.textContent?.trim() ?? "")
  const SVC_SHORT = SVC.map((e) => e.dataset.short || $("h3", e)?.textContent?.trim() || "")
  const SVC_GLYPH = SVC.map((e, i) => (e.dataset.glyph !== undefined ? Number(e.dataset.glyph) : i))
  const STEP_EL = $$<HTMLElement>(".steps li")
  const CASE_EL = $$<HTMLElement>(".cases .case")
  const CASE_NAMES = CASE_EL.map((e) => $("h3", e)?.textContent?.trim() ?? "")
  const N_SVC = SVC.length
  const N_STEP = STEP_EL.length
  const N_CASE = CASE_EL.length
  const SVC_STEP = N_SVC ? PI2 / N_SVC : Math.PI / 3
  const FONT = o.fontFamily

  /* ---------- renderer (throws when WebGL is unavailable; the caller falls back to the static layout) ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, alpha: true, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75))
  renderer.setClearColor(0, 0)
  mark("h3d:renderer")
  const scene = new THREE.Scene()
  const CAMZ = 16.5
  const FOV = 32
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 140)
  camera.position.set(0, 0, CAMZ)
  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const key = new THREE.DirectionalLight(0xffffff, 0.8)
  key.position.set(4, 7, 6)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x9db6ff, 0.45)
  rim.position.set(-6, 2, -4)
  scene.add(rim)
  const aniso = renderer.capabilities.getMaxAnisotropy()
  const disposables: Array<{ dispose: () => void }> = []
  const fresh: THREE.Texture[] = []
  const tex = (cv: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(cv)
    t.anisotropy = Math.min(8, aniso)
    disposables.push(t)
    fresh.push(t)
    return t
  }
  /** Upload the textures made since the last call, so the first frame a scene appears does not stall. */
  const uploadFresh = () => {
    for (const t of fresh.splice(0)) {
      try {
        renderer.initTexture(t)
      } catch {
        /* the texture uploads on first use instead */
      }
    }
  }
  const mkCanvas = (w: number, h: number) => {
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    return c
  }
  function rr(x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, R: number) {
    x.beginPath()
    x.moveTo(X + R, Y)
    x.arcTo(X + W, Y, X + W, Y + H, R)
    x.arcTo(X + W, Y + H, X, Y + H, R)
    x.arcTo(X, Y + H, X, Y, R)
    x.arcTo(X, Y, X + W, Y, R)
    x.closePath()
  }
  const edges = (geo: THREE.BufferGeometry, color: number, op: number) =>
    new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op }))
  const viewSize = () => {
    const h = 2 * CAMZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    return { h, w: h * camera.aspect }
  }

  /* ---------- textures (drawn in code) ---------- */
  function uiCard(kind: number, W = 1260, H = 810, margin = 0) {
    const cv = mkCanvas(W, H)
    const x = cv.getContext("2d")!
    const R = rng(kind * 77 + 3)
    const M = margin
    x.save()
    x.shadowColor = "rgba(2,6,24,.32)"
    x.shadowBlur = margin ? 38 : 0
    x.shadowOffsetY = margin ? 14 : 0
    rr(x, M, M, W - 2 * M, H - 2 * M, 26)
    x.fillStyle = "#fff"
    x.fill()
    x.restore()
    x.save()
    rr(x, M, M, W - 2 * M, H - 2 * M, 26)
    x.clip()
    const X0 = M
    const Y0 = M
    const w = W - 2 * M
    const h = H - 2 * M
    x.fillStyle = "#f3f6fd"
    x.fillRect(X0, Y0, w, 64)
    ;["#ff6b6b", "#ffc447", "#34d399"].forEach((c, i) => {
      x.fillStyle = c
      x.beginPath()
      x.arc(X0 + 34 + i * 24, Y0 + 32, 7, 0, 7)
      x.fill()
    })
    x.fillStyle = "#fff"
    rr(x, X0 + w / 2 - 190, Y0 + 16, 380, 32, 16)
    x.fill()
    x.fillStyle = "#64748b"
    x.font = `500 17px ${FONT}`
    x.textAlign = "left"
    x.fillText(["app.client.com / overview", "ops.client.com / queue", "portal.client.com / project"][kind], X0 + w / 2 - 166, Y0 + 38)
    const by = Y0 + 64
    x.fillStyle = "#fafbff"
    x.fillRect(X0, by, 190, h - 64)
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i === kind + 1 ? "#1447e6" : "#dbe3f5"
      rr(x, X0 + 24, by + 34 + i * 50, i === kind + 1 ? 142 : 100 + ((i * 37) % 50), 16, 8)
      x.fill()
    }
    const cx = X0 + 220
    const cw = w - 250
    x.fillStyle = "#020618"
    x.font = `700 26px ${FONT}`
    x.fillText(["Overview", "Operations queue", "Milestones"][kind], cx, by + 50)
    if (kind === 0) {
      ;[
        ["Revenue", "$452,340", "+12%"],
        ["Active tenants", "18,420", "+6%"],
        ["Uptime", "99.98%", "30d"],
        ["Open issues", "14", "-3"],
      ].forEach((k, i) => {
        const kx = cx + i * (cw / 4)
        const kw = cw / 4 - 14
        x.fillStyle = "#f6f8fe"
        rr(x, kx, by + 74, kw, 104, 14)
        x.fill()
        x.fillStyle = "#64748b"
        x.font = `500 15px ${FONT}`
        x.fillText(k[0], kx + 16, by + 104)
        x.fillStyle = "#020618"
        x.font = `700 27px ${FONT}`
        x.fillText(k[1], kx + 16, by + 142)
        x.fillStyle = i === 3 ? "#d97706" : "#12a150"
        x.font = `600 14px ${FONT}`
        x.fillText(k[2], kx + 16, by + 166)
      })
      const ax = cx
      const ay = by + 202
      const aw = cw * 0.62
      const ah = h - 64 - 202 - 34
      x.fillStyle = "#f6f8fe"
      rr(x, ax, ay, aw, ah, 16)
      x.fill()
      const pts: number[] = []
      let v = 0.3
      for (let i = 0; i <= 24; i++) {
        v = clamp(v + (R() - 0.38) * 0.14, 0.12, 0.95)
        pts.push(v)
      }
      const g = x.createLinearGradient(0, ay, 0, ay + ah)
      g.addColorStop(0, "rgba(20,71,230,.32)")
      g.addColorStop(1, "rgba(20,71,230,0)")
      const path = () =>
        pts.forEach((p, i) => {
          const px = ax + 24 + (i * (aw - 48)) / 24
          const py = ay + ah - 26 - p * (ah - 70)
          if (i) x.lineTo(px, py)
          else x.moveTo(px, py)
        })
      x.beginPath()
      path()
      x.lineTo(ax + aw - 24, ay + ah - 26)
      x.lineTo(ax + 24, ay + ah - 26)
      x.closePath()
      x.fillStyle = g
      x.fill()
      x.beginPath()
      path()
      x.strokeStyle = "#1447e6"
      x.lineWidth = 4
      x.lineJoin = "round"
      x.stroke()
      const bx = ax + aw + 16
      const bw = cw - aw - 16
      x.fillStyle = "#f6f8fe"
      rr(x, bx, ay, bw, ah, 16)
      x.fill()
      for (let i = 0; i < 10; i++) {
        const bh = (0.2 + R() * 0.7) * (ah - 70)
        x.fillStyle = i % 3 === 0 ? "#1447e6" : "#b9c9f7"
        rr(x, bx + 22 + i * ((bw - 44) / 10), ay + ah - 26 - bh, (bw - 44) / 10 - 8, bh, 5)
        x.fill()
      }
    } else if (kind === 1) {
      ;["All", "Needs review", "Failed", "Auto-approved"].forEach((t, i) => {
        const fx = cx + i * 150
        x.fillStyle = i === 1 ? "#020618" : "#eef2fb"
        rr(x, fx, by + 74, i === 3 ? 170 : 130, 38, 19)
        x.fill()
        x.fillStyle = i === 1 ? "#fff" : "#475569"
        x.font = `600 15px ${FONT}`
        x.textAlign = "center"
        x.fillText(t, fx + (i === 3 ? 85 : 65), by + 99)
        x.textAlign = "left"
      })
      const rows = 8
      const ty = by + 132
      for (let i = 0; i < rows; i++) {
        const ry = ty + i * 58
        x.fillStyle = i % 2 ? "#fff" : "#f8faff"
        x.fillRect(cx, ry, cw * 0.66, 58)
        x.fillStyle = "#94a3b8"
        x.font = `600 14px ${FONT}`
        x.fillText("#" + (4021 + i * 7), cx + 16, ry + 35)
        x.fillStyle = "#cbd5e1"
        rr(x, cx + 90, ry + 20, 120 + R() * 150, 14, 7)
        x.fill()
        const st = [
          ["#dcfce7", "#12a150", "Done"],
          ["#dbe6ff", "#1447e6", "Running"],
          ["#fef3c7", "#b45309", "Review"],
          ["#fee2e2", "#b91c1c", "Failed"],
        ][Math.floor(R() * 4)]
        x.fillStyle = st[0]
        rr(x, cx + cw * 0.66 - 130, ry + 14, 104, 30, 15)
        x.fill()
        x.fillStyle = st[1]
        x.font = `700 13px ${FONT}`
        x.textAlign = "center"
        x.fillText(st[2], cx + cw * 0.66 - 78, ry + 34)
        x.textAlign = "left"
      }
      const qx = cx + cw * 0.66 + 18
      const qw = cw * 0.34 - 18
      x.fillStyle = "#f6f8fe"
      rr(x, qx, by + 132, qw, rows * 58, 16)
      x.fill()
      x.fillStyle = "#020618"
      x.font = `700 18px ${FONT}`
      x.fillText("Queue depth", qx + 20, by + 168)
      x.beginPath()
      for (let i = 0; i <= 20; i++) {
        const px = qx + 20 + (i * (qw - 40)) / 20
        const py = by + 330 - (Math.sin(i * 0.5) * 0.5 + 0.5) * 90 - R() * 30
        if (i) x.lineTo(px, py)
        else x.moveTo(px, py)
      }
      x.strokeStyle = "#1447e6"
      x.lineWidth = 4
      x.stroke()
      x.fillStyle = "#1447e6"
      rr(x, qx + 20, by + 432, qw - 40, 44, 22)
      x.fill()
      x.fillStyle = "#fff"
      x.font = `700 16px ${FONT}`
      x.textAlign = "center"
      x.fillText("Run workflow", qx + qw / 2, by + 460)
      x.textAlign = "left"
    } else {
      ;["Discovery", "Design", "Build sprint 1", "Build sprint 2", "Client review", "Launch"].forEach((n, i) => {
        const ry = by + 84 + i * 62
        x.fillStyle = "#64748b"
        x.font = `600 15px ${FONT}`
        x.fillText(n, cx, ry + 28)
        x.fillStyle = "#eef2fb"
        rr(x, cx + 190, ry + 8, cw - 210, 28, 14)
        x.fill()
        const s = i * (cw - 210) * 0.13
        const l = (cw - 210) * (0.22 + R() * 0.2)
        x.fillStyle = i < 3 ? "#1447e6" : i === 3 ? "#7f9cff" : "#c9d6f7"
        rr(x, cx + 190 + s, ry + 8, Math.min(l, cw - 210 - s), 28, 14)
        x.fill()
      })
      const my = by + 84 + 6 * 62 + 10
      ;[
        [0, "Milestone 2 is ready for review."],
        [1, "Looks good — approved."],
        [0, "Deploying to production tonight."],
      ].forEach((m, i) => {
        const bw = 300 + i * 40
        const bx = m[0] ? cx + cw - bw : cx
        x.fillStyle = m[0] ? "#1447e6" : "#eef2fb"
        rr(x, bx, my + i * 56, bw, 42, 21)
        x.fill()
        x.fillStyle = m[0] ? "#fff" : "#334155"
        x.font = `500 16px ${FONT}`
        x.fillText(String(m[1]), bx + 20, my + i * 56 + 27)
      })
    }
    x.restore()
    return tex(cv)
  }

  function glyphTexture(i: number, name: string, num: number) {
    const S = 512
    const cv = mkCanvas(S, S)
    const x = cv.getContext("2d")!
    const ink = "#020618"
    const blue = "#1447e6"
    x.lineCap = "round"
    x.lineJoin = "round"
    x.textAlign = "center"
    x.fillStyle = "#64748b"
    x.font = `600 28px ${FONT}`
    x.fillText("0" + (num + 1), S / 2, 92)
    x.save()
    x.translate(156, 118)
    x.strokeStyle = ink
    x.fillStyle = ink
    x.lineWidth = 7
    const arrow = (px: number, py: number, dx: number, dy: number) => {
      const L = Math.hypot(dx, dy)
      dx /= L
      dy /= L
      x.beginPath()
      x.moveTo(px - dx * 16 - dy * 11, py - dy * 16 + dx * 11)
      x.lineTo(px, py)
      x.lineTo(px - dx * 16 + dy * 11, py - dy * 16 - dx * 11)
      x.stroke()
    }
    if (i === 0) {
      const Ls = [
        [[20, 40], [20, 100], [20, 160]],
        [[100, 20], [100, 75], [100, 125], [100, 180]],
        [[180, 70], [180, 130]],
      ]
      x.strokeStyle = "rgba(20,71,230,.45)"
      x.lineWidth = 3
      for (let l = 0; l < 2; l++)
        Ls[l].forEach((a) =>
          Ls[l + 1].forEach((b) => {
            x.beginPath()
            x.moveTo(a[0], a[1])
            x.lineTo(b[0], b[1])
            x.stroke()
          }),
        )
      Ls.forEach((L, li) =>
        L.forEach((p) => {
          x.fillStyle = li === 2 ? blue : ink
          x.beginPath()
          x.arc(p[0], p[1], 12, 0, 7)
          x.fill()
        }),
      )
    }
    if (i === 1) {
      const cx = 100
      const cy = 100
      const r = 64
      x.lineWidth = 11
      ;[
        [-0.1, 0.8],
        [0.9, 1.8],
      ].forEach(([a, b]) => {
        x.beginPath()
        x.arc(cx, cy, r, a * Math.PI, b * Math.PI)
        x.stroke()
        const e = b * Math.PI
        arrow(cx + r * Math.cos(e), cy + r * Math.sin(e), -Math.sin(e), Math.cos(e))
      })
      x.fillStyle = blue
      x.beginPath()
      x.arc(cx, cy, 15, 0, 7)
      x.fill()
    }
    if (i === 2) {
      x.lineWidth = 13
      x.beginPath()
      x.moveTo(62, 40)
      x.lineTo(8, 100)
      x.lineTo(62, 160)
      x.stroke()
      x.beginPath()
      x.moveTo(138, 40)
      x.lineTo(192, 100)
      x.lineTo(138, 160)
      x.stroke()
      x.strokeStyle = blue
      x.beginPath()
      x.moveTo(114, 30)
      x.lineTo(86, 170)
      x.stroke()
    }
    if (i === 3) {
      for (let k = 2; k >= 0; k--) {
        const cy = 48 + k * 44
        x.beginPath()
        x.moveTo(100, cy - 34)
        x.lineTo(184, cy)
        x.lineTo(100, cy + 34)
        x.lineTo(16, cy)
        x.closePath()
        x.fillStyle = k === 0 ? "rgba(20,71,230,.22)" : "#fff"
        x.fill()
        x.strokeStyle = k === 0 ? blue : ink
        x.lineWidth = 7
        x.stroke()
      }
    }
    if (i === 4) {
      ;[
        [20, 50],
        [66, 90],
        [112, 130],
      ].forEach(([bx, h], k) => {
        x.fillStyle = k === 2 ? blue : ink
        rr(x, bx, 180 - h, 34, h, 8)
        x.fill()
      })
      x.strokeStyle = blue
      x.lineWidth = 8
      x.beginPath()
      x.moveTo(24, 96)
      x.lineTo(176, 14)
      x.stroke()
      arrow(176, 14, 152, -82)
    }
    if (i === 5) {
      x.lineWidth = 6
      const P = [
        [10, 10],
        [154, 10],
        [10, 154],
        [154, 154],
      ]
      P.forEach(([px, py]) => {
        x.beginPath()
        x.moveTo(100, 100)
        x.lineTo(px + 18, py + 18)
        x.stroke()
      })
      P.forEach(([px, py]) => {
        x.fillStyle = "#fff"
        rr(x, px, py, 36, 36, 9)
        x.fill()
        x.strokeStyle = ink
        x.lineWidth = 7
        x.stroke()
      })
      x.fillStyle = blue
      x.beginPath()
      x.arc(100, 100, 27, 0, 7)
      x.fill()
      x.fillStyle = "#fff"
      x.beginPath()
      x.arc(100, 100, 9, 0, 7)
      x.fill()
    }
    x.restore()
    x.fillStyle = ink
    x.font = `700 37px ${FONT}`
    x.fillText(name, S / 2, 436)
    return tex(cv)
  }

  function plateTexture(k: number) {
    const S = 512
    const cv = mkCanvas(S, S)
    const x = cv.getContext("2d")!
    const R = rng(k * 31 + 9)
    x.lineCap = "round"
    x.lineJoin = "round"
    const W = "rgba(2,6,24,.78)"
    const B = "#1447e6"
    const D = "rgba(20,71,230,.2)"
    x.strokeStyle = D
    x.lineWidth = 2
    rr(x, 26, 26, S - 52, S - 52, 26)
    x.stroke()
    if (k === 0) {
      for (let i = 0; i < 13; i++)
        for (let j = 0; j < 13; j++) {
          const hl = (i * j) % 7 === 3
          x.fillStyle = hl ? B : "rgba(2,6,24,.22)"
          x.beginPath()
          x.arc(66 + i * 31.7, 66 + j * 31.7, hl ? 5 : 3, 0, 7)
          x.fill()
        }
      x.strokeStyle = W
      x.lineWidth = 7
      x.beginPath()
      x.arc(228, 232, 76, 0, 7)
      x.stroke()
      x.beginPath()
      x.moveTo(284, 288)
      x.lineTo(352, 356)
      x.stroke()
    } else if (k === 1) {
      x.strokeStyle = W
      x.lineWidth = 6
      ;[
        [70, 90, 130, 86],
        [312, 90, 130, 86],
        [190, 330, 130, 86],
      ].forEach(([a, b, w, h], i) => {
        rr(x, a, b, w, h, 14)
        x.stroke()
        if (i === 2) {
          x.fillStyle = "rgba(20,71,230,.18)"
          rr(x, a, b, w, h, 14)
          x.fill()
        }
      })
      x.strokeStyle = B
      x.beginPath()
      x.moveTo(135, 176)
      x.lineTo(135, 250)
      x.lineTo(255, 250)
      x.lineTo(255, 330)
      x.moveTo(377, 176)
      x.lineTo(377, 250)
      x.lineTo(255, 250)
      x.stroke()
      x.fillStyle = B
      ;[
        [135, 176],
        [377, 176],
        [255, 330],
      ].forEach(([a, b]) => {
        x.beginPath()
        x.arc(a, b, 9, 0, 7)
        x.fill()
      })
    } else if (k === 2) {
      let y = 84
      ;[0, 1, 1, 2, 2, 1, 0, 1, 2, 1, 0].forEach((ind, i) => {
        x.fillStyle = i % 4 === 2 ? B : "rgba(2,6,24,.7)"
        rr(x, 72 + ind * 40, y, 70 + R() * 190, 15, 7)
        x.fill()
        y += 33
      })
      x.fillStyle = B
      x.fillRect(360, 84 + 99, 14, 22)
    } else if (k === 3) {
      x.strokeStyle = W
      x.lineWidth = 9
      x.beginPath()
      x.moveTo(256, 90)
      x.bezierCurveTo(330, 120, 370, 122, 396, 124)
      x.bezierCurveTo(396, 260, 350, 350, 256, 420)
      x.bezierCurveTo(162, 350, 116, 260, 116, 124)
      x.bezierCurveTo(142, 122, 182, 120, 256, 90)
      x.closePath()
      x.stroke()
      x.strokeStyle = B
      x.lineWidth = 13
      x.beginPath()
      x.moveTo(198, 256)
      x.lineTo(244, 302)
      x.lineTo(324, 206)
      x.stroke()
    } else {
      x.strokeStyle = W
      x.lineWidth = 6
      x.beginPath()
      for (let i = 0; i <= 40; i++) {
        const px = 60 + (i * (S - 120)) / 40
        const v = Math.sin(i * 0.55) * 0.18 * (i % 9 < 4 ? 1 : 0.2) + (i % 13 === 6 ? -0.55 : 0) + (i % 13 === 7 ? 0.35 : 0)
        const py = 190 - v * 120
        if (i) x.lineTo(px, py)
        else x.moveTo(px, py)
      }
      x.stroke()
      for (let i = 0; i < 14; i++) {
        x.fillStyle = i > 9 ? B : "rgba(2,6,24,.35)"
        const bh = 20 + R() * 100
        rr(x, 70 + i * 28.5, 430 - bh, 16, bh, 5)
        x.fill()
      }
      x.fillStyle = "#12a150"
      x.beginPath()
      x.arc(88, 80, 9, 0, 7)
      x.fill()
      x.fillStyle = W
      x.font = `600 20px ${FONT}`
      x.textAlign = "left"
      x.fillText("LIVE", 108, 87)
    }
    return tex(cv)
  }

  function shadowTexture() {
    const cv = mkCanvas(256, 256)
    const x = cv.getContext("2d")!
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, "rgba(2,6,24,.26)")
    g.addColorStop(0.55, "rgba(2,6,24,.08)")
    g.addColorStop(1, "rgba(2,6,24,0)")
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    return tex(cv)
  }
  const shadowTex = () => shadowTexture()

  /* ---------- shared 3D pieces ---------- */
  const hexGeo = new THREE.CylinderGeometry(1, 1, 0.26, 6)
  hexGeo.rotateX(Math.PI / 2)
  hexGeo.rotateZ(Math.PI / 2)
  const hexEdges = new THREE.EdgesGeometry(hexGeo)
  disposables.push(hexGeo, hexEdges)
  let glyphTex: THREE.Texture[] = []

  function makeToken(i: number) {
    const group = new THREE.Group()
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      emissive: C.blue,
      emissiveIntensity: 0,
    })
    const body = new THREE.Mesh(hexGeo, bodyMat)
    body.userData.idx = i
    const eMat = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.8 })
    body.add(new THREE.LineSegments(hexEdges, eMat))
    const dMat = new THREE.MeshBasicMaterial({ map: glyphTex[i], transparent: true })
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), dMat)
    decal.position.z = 0.135
    body.add(decal)
    group.add(body)
    return { group, body, bodyMat, eMat, dMat, h: 0, s: 0 }
  }

  function collectFade(rootObj: THREE.Object3D): FadeItem[] {
    const list: FadeItem[] = []
    rootObj.traverse((obj: any) => {
      const ms = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []
      ms.forEach((m: any) => {
        if (m.userData.fadeReg) return
        m.userData.fadeReg = true
        if (m.isShaderMaterial && m.uniforms.uOpacity) list.push({ u: m.uniforms.uOpacity, base: m.uniforms.uOpacity.value, m })
        else {
          m.transparent = true
          list.push({ m, base: m.opacity })
        }
      })
    })
    return list
  }
  function applyFade(list: FadeItem[], a: number) {
    for (const f of list) {
      const k = f.m.userData.k === undefined ? 1 : f.m.userData.k
      if (f.u) f.u.value = f.base * k * a
      else f.m.opacity = f.base * k * a
    }
  }

  /* ===== SCENE 0 · SYSTEM STACK ===== */
  function buildHero(): SceneObj {
    const g = new THREE.Group()
    const inner = new THREE.Group()
    g.add(inner)
    const SZ = 4.4
    const slab = (h: number, color: number, ec: number, eo: number) => {
      const geo = new THREE.BoxGeometry(SZ, h, SZ)
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, transparent: true }))
      m.add(edges(geo, ec, eo))
      return m
    }
    const data = new THREE.Group()
    const logic = new THREE.Group()
    const ui = new THREE.Group()
    data.add(slab(0.34, 0xd3def9, C.blue, 0.75))
    ;[
      [-1.1, -1.1],
      [1.1, -1.1],
      [-1.1, 1.1],
      [1.1, 1.1],
    ].forEach(([px, pz]) => {
      for (let k = 0; k < 3; k++) {
        const c = new THREE.Mesh(
          new THREE.CylinderGeometry(0.52, 0.52, 0.15, 40),
          new THREE.MeshStandardMaterial({ color: k === 2 ? C.blue : 0x9db3ee, roughness: 0.35, metalness: 0.2, transparent: true }),
        )
        c.position.set(px, 0.26 + k * 0.19, pz)
        data.add(c)
      }
    })
    logic.add(slab(0.26, 0xe3ebff, C.ink, 0.75))
    const NG = 6
    const inst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.34, 0.34, 0.34),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2, transparent: true }),
      NG * NG,
    )
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    for (let i = 0; i < NG * NG; i++) {
      col.set((i * 7) % 5 === 0 ? C.ink : C.blue)
      inst.setColorAt(i, col)
    }
    inst.instanceColor!.needsUpdate = true
    logic.add(inst)
    ui.add(slab(0.22, 0xffffff, C.blue, 0.8))
    const uiMat = new THREE.MeshBasicMaterial({ map: uiCard(0, 800, 450, 0), transparent: true })
    const uiPlane = new THREE.Mesh(new THREE.PlaneGeometry(SZ * 0.92, (SZ * 0.92 * 450) / 800), uiMat)
    uiPlane.rotation.x = -Math.PI / 2
    uiPlane.position.y = 0.115
    ui.add(uiPlane)
    // Use the real dashboard image (the one the page already loads) as the texture. Same origin, so no CORS.
    const heroUrl = pickHeroImageUrl($<HTMLImageElement>(".h3d-shot img"))
    if (heroUrl) {
      const im = new Image()
      im.onload = () => {
        if (destroyed) return
        const t = new THREE.Texture(im)
        t.anisotropy = Math.min(8, aniso)
        t.needsUpdate = true
        disposables.push(t)
        uiMat.map = t
        uiMat.needsUpdate = true
        uiPlane.geometry.dispose()
        uiPlane.geometry = new THREE.PlaneGeometry(SZ * 0.92, (SZ * 0.92 * im.naturalHeight) / im.naturalWidth)
      }
      im.src = heroUrl
    }
    inner.add(data, logic, ui)
    const posts = new THREE.Group()
    const pm = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: 0.45 })
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([a, b]) => [a * SZ * 0.46, b * SZ * 0.46])
    corners.forEach(([px, pz]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6), pm)
      m.position.set(px, 0, pz)
      posts.add(m)
    })
    inner.add(posts)
    const pulses: THREE.Mesh[] = []
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), new THREE.MeshBasicMaterial({ color: i % 2 ? C.blue : C.ink, transparent: true }))
      m.userData = { c: i % 4, off: i / 10, sp: 0.18 + 0.05 * (i % 3) }
      pulses.push(m)
      inner.add(m)
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.012, 8, 200), new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.45 }))
    ring.rotation.x = Math.PI / 2
    inner.add(ring)
    const chips: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(hexGeo, new THREE.MeshStandardMaterial({ color: i === 0 ? C.blue : 0xffffff, roughness: 0.3, metalness: 0.15, transparent: true }))
      c.scale.setScalar(0.2)
      c.add(edges(hexGeo, C.ink, 0.7))
      chips.push(c)
      inner.add(c)
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    g.add(sh)
    const fade = collectFade(g)
    return {
      g,
      anchor: 0.2,
      scale: 0.95,
      fade,
      update(c) {
        const e = smooth(0.1, 0.7, c.p)
        const gap = 1.1 + e * 1.05
        inner.rotation.y = -0.75 + (RM ? 0 : c.t * 0.1) + c.p * 2.4 + c.px * 0.3
        inner.rotation.x = 0.44 - e * 0.1 + c.py * 0.1
        data.position.y = -gap
        ui.position.y = gap
        posts.scale.y = gap * 2
        posts.children.forEach((m: any) => (m.material.userData.k = 0.35 + 0.65 * e))
        for (let i = 0; i < NG; i++)
          for (let j = 0; j < NG; j++) {
            const s = 0.55 + 0.45 * Math.sin(c.t * 1.7 + (i + j) * 0.75) * 0.5 + 0.225
            dummy.position.set((i - (NG - 1) / 2) * 0.62, 0.13 + 0.17 * s, (j - (NG - 1) / 2) * 0.62)
            dummy.scale.set(1, 0.5 + s, 1)
            dummy.updateMatrix()
            inst.setMatrixAt(i * NG + j, dummy.matrix)
          }
        inst.instanceMatrix.needsUpdate = true
        pulses.forEach((m) => {
          const u = (m.userData.off + c.t * m.userData.sp) % 1
          const up = m.userData.c % 2 === 0 ? u : 1 - u
          const [px, pz] = corners[m.userData.c]
          m.position.set(px, -gap + up * gap * 2, pz)
        })
        ring.scale.setScalar(1 + e * 0.12)
        chips.forEach((ch, i) => {
          const a = c.t * 0.5 * (RM ? 0 : 1) + i * 2.094
          const r = 3.7 * (1 + e * 0.12)
          ch.position.set(Math.cos(a) * r, Math.sin(a * 2 + i) * 0.35, Math.sin(a) * r)
          ch.rotation.set(a, a * 0.5, 0)
        })
        sh.position.y = -gap - 1.55
        sh.scale.setScalar(1 + e * 0.25)
      },
    }
  }

  /* ===== SCENE 1 · SERVICE TOKENS ===== */
  function buildServices(): SceneObj {
    const g = new THREE.Group()
    const ring = new THREE.Group()
    g.add(ring)
    g.rotation.x = 0.17
    const R = 3.4
    const tokens = SVC.map((_, i) => {
      const t = makeToken(i)
      ring.add(t.group)
      return t
    })
    const rm = new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    const r1 = new THREE.Mesh(new THREE.RingGeometry(R - 0.012, R + 0.012, 180), rm)
    const r2 = new THREE.Mesh(new THREE.RingGeometry(R + 0.85 - 0.008, R + 0.85 + 0.008, 180), rm.clone())
    ;(r2.material as THREE.MeshBasicMaterial).opacity = 0.2
    ;[r1, r2].forEach((r) => {
      r.rotation.x = -Math.PI / 2
      r.position.set(0, -1.5, -R)
      g.add(r)
    })
    const tm = new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      const L = i % 6 === 0 ? 0.2 : 0.08
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.012, L), tm)
      m.position.set(Math.sin(a) * (R + 0.85 - L / 2 - 0.03), -1.5, -R + Math.cos(a) * (R + 0.85 - L / 2 - 0.03))
      m.rotation.set(-Math.PI / 2, 0, a)
      g.add(m)
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    sh.position.set(0, -1.52, -R)
    g.add(sh)
    const fade = collectFade(g)
    const st = { rot: 0, target: 0, hover: -1, drag: false }
    return {
      g,
      anchor: 0.18,
      scale: 0.95,
      fade,
      st,
      meshes: tokens.map((t) => t.body),
      update(c) {
        st.rot += (st.target - st.rot) * Math.min(1, c.dt * (st.drag ? 18 : 6))
        tokens.forEach((t, i) => {
          const a = i * SVC_STEP + st.rot
          const front = (Math.cos(a) + 1) / 2
          const sel = Math.abs((((a + Math.PI) % PI2) + PI2) % PI2 - Math.PI) < 0.3 ? 1 : 0
          t.h += ((st.hover === i ? 1 : 0) - t.h) * Math.min(1, c.dt * 10)
          t.s += (sel - t.s) * Math.min(1, c.dt * 8)
          t.group.position.set(Math.sin(a) * R, Math.sin(c.t * 1.1 + i * 1.3) * 0.07 * (RM ? 0 : 1), Math.cos(a) * R - R + t.h * 0.35 + t.s * 0.55)
          t.group.rotation.set(c.py * 0.12 * t.s, a + c.px * 0.18 * t.s, 0)
          t.group.scale.setScalar(1 + 0.09 * t.h + 0.15 * t.s)
          t.bodyMat.emissiveIntensity = 0.14 * t.s + 0.07 * t.h
          t.eMat.color.setHex(t.s > 0.5 || t.h > 0.5 ? C.blue : C.ink)
          const k = lerp(0.82, 1, front)
          ;[t.bodyMat, t.dMat].forEach((m) => (m.userData.k = k))
          t.eMat.userData.k = k
        })
      },
    }
  }

  /* ===== SCENE 2 · PROCESS PLATES ===== */
  function buildProcess(): SceneObj {
    const g = new THREE.Group()
    const inner = new THREE.Group()
    g.add(inner)
    const N = N_STEP
    const SZ = 4.3
    const plates: Array<{ grp: THREE.Group; bodyMat: THREE.MeshStandardMaterial; eMat: THREE.LineBasicMaterial; pMat: THREE.MeshBasicMaterial; a: number }> = []
    for (let i = 0; i < N; i++) {
      const grp = new THREE.Group()
      const geo = new THREE.BoxGeometry(SZ, 0.17, SZ)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.05, transparent: true, emissive: C.blue, emissiveIntensity: 0 })
      const body = new THREE.Mesh(geo, bodyMat)
      const eMat = new THREE.LineBasicMaterial({ color: C.blue, transparent: true, opacity: 0.7 })
      body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), eMat))
      const pMat = new THREE.MeshBasicMaterial({ map: plateTexture(i % 5), transparent: true })
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(SZ * 0.94, SZ * 0.94), pMat)
      pl.rotation.x = -Math.PI / 2
      pl.position.y = 0.09
      grp.add(body, pl)
      inner.add(grp)
      plates.push({ grp, bodyMat, eMat, pMat, a: 0 })
    }
    const grid = new THREE.GridHelper(20, 40, C.blue, C.blue)
    ;(grid.material as THREE.Material).opacity = 0.14
    ;(grid.material as THREE.Material).transparent = true
    g.add(grid)
    const posts = new THREE.Group()
    const pm = new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.55 })
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([a, b]) => [a * SZ * 0.5, b * SZ * 0.5])
    corners.forEach(([px, pz]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 6), pm)
      m.position.set(px, 0, pz)
      posts.add(m)
    })
    inner.add(posts)
    const pulses: THREE.Mesh[] = []
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: C.ink, transparent: true }))
      m.userData = { c: i % 4, off: i / 8 }
      pulses.push(m)
      inner.add(m)
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    g.add(sh)
    const fade = collectFade(g)
    const gapY = 0.78
    const cTint = new THREE.Color(0xcfdcff)
    const cWhite = new THREE.Color(0xffffff)
    return {
      g,
      anchor: 0.2,
      scale: 0.95,
      fade,
      update(c) {
        const p = c.pf
        const step = Math.min(N - 1, Math.floor(p * N + 0.0001))
        inner.rotation.y = -0.5 + p * 2.0 + (RM ? 0 : c.t * 0.04) + c.px * 0.25
        inner.rotation.x = 0.52 + c.py * 0.08
        plates.forEach((pl, i) => {
          const amt = i === 0 ? 1 : smooth(i / N - 0.05, i / N + 0.09, p)
          pl.a += ((i === step ? 1 : 0) - pl.a) * Math.min(1, c.dt * 8)
          pl.grp.position.y = (i - (N - 1) / 2) * gapY + (1 - amt) * 3.4 + pl.a * 0.3
          pl.bodyMat.color.copy(cWhite).lerp(cTint, pl.a)
          pl.bodyMat.emissiveIntensity = pl.a * 0.12
          pl.eMat.color.setHex(pl.a > 0.5 ? C.ink : C.blue)
          ;[pl.bodyMat, pl.pMat, pl.eMat].forEach((m) => (m.userData.k = amt * (i > step ? 0.8 : 1)))
        })
        const e = smooth(0.78, 0.95, p)
        posts.scale.y = (N - 1) * gapY + 0.6
        posts.children.forEach((m: any) => (m.material.userData.k = e * 0.8))
        pulses.forEach((m) => {
          const u = (m.userData.off + c.t * 0.3) % 1
          const [px, pz] = corners[m.userData.c]
          m.position.set(px, -((N - 1) / 2) * gapY - 0.2 + u * ((N - 1) * gapY + 0.4), pz)
          ;(m.material as any).userData.k = e
        })
        const by = -((N - 1) / 2) * gapY - 0.9
        grid.position.y = by
        sh.position.y = by + 0.05
      },
    }
  }

  /* ===== SCENE 3 · CASE-STUDY CARDS ===== */
  function buildProjects(): SceneObj {
    const g = new THREE.Group()
    function glowTex() {
      const cv = mkCanvas(128, 128)
      const x = cv.getContext("2d")!
      const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64)
      gr.addColorStop(0, "rgba(20,71,230,.16)")
      gr.addColorStop(1, "rgba(20,71,230,0)")
      x.fillStyle = gr
      x.fillRect(0, 0, 128, 128)
      return tex(cv)
    }
    const cards = CASE_EL.map((_, i) => {
      const grp = new THREE.Group()
      const mat = new THREE.MeshBasicMaterial({ map: uiCard(i % 3, touch ? 760 : 1100, touch ? 520 : 750, touch ? 40 : 60), transparent: true })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.18, 3.55), mat)
      mesh.userData.idx = i
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false }))
      glow.position.z = -0.3
      grp.add(glow, mesh)
      g.add(grp)
      return { grp, mesh, mat, glow, h: 0 }
    })
    const fade = collectFade(g)
    const st = { cur: 0, hover: -1, focus: 0 }
    const span = Math.max(1, N_CASE - 1)
    return {
      g,
      anchor: 0,
      scale: 0.92,
      fade,
      st,
      meshes: cards.map((c) => c.mesh),
      update(c) {
        const q = c.pf * span
        const i0 = Math.min(span - 1, Math.floor(q))
        const f = q - i0
        const cur = N_CASE <= 1 ? 0 : i0 + smooth(0.5, 1, f)
        st.cur = cur
        st.focus = Math.round(cur)
        const sp = c.aspect < 1 ? 3.2 : 5.6
        cards.forEach((cd, i) => {
          const d = i - cur
          const phi = d * 0.72
          const fa = 1 - clamp(Math.abs(d), 0, 1)
          cd.h += ((st.hover === i ? 1 : 0) - cd.h) * Math.min(1, c.dt * 10)
          cd.grp.position.set(Math.sin(phi) * sp, 0.55 - Math.abs(d) * 0.25 + Math.sin(c.t * 0.8 + i) * 0.04 * (RM ? 0 : 1), Math.cos(phi) * sp - sp + cd.h * 0.25)
          cd.grp.rotation.set(-c.py * 0.08 * fa - cd.h * c.py * 0.15, -phi * 0.9 + c.px * 0.1 * fa + cd.h * c.px * 0.2, 0)
          cd.grp.scale.setScalar((c.aspect < 1 ? 0.66 : 0.98) * (0.84 + 0.16 * fa))
          cd.mat.userData.k = lerp(0.6, 1, fa)
          ;(cd.glow.material as any).userData.k = fa
        })
      },
    }
  }

  /* ===== SCENE 4 · GLOBE ===== */
  const ll = (lat: number, lon: number, r = 1) => {
    const f = (lat * Math.PI) / 180
    const l = (lon * Math.PI) / 180
    return new THREE.Vector3(r * Math.cos(f) * Math.sin(l), r * Math.sin(f), r * Math.cos(f) * Math.cos(l))
  }
  function buildGlobe(): SceneObj {
    const g = new THREE.Group()
    const tilt = new THREE.Group()
    const globe = new THREE.Group()
    g.add(tilt)
    tilt.add(globe)
    const R = 2.35
    const bin = atob(LAND_B64)
    const mask = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) mask[i] = bin.charCodeAt(i)
    const isLand = (lat: number, lon: number) => {
      const row = Math.min(179, Math.max(0, Math.floor(90 - lat)))
      const col = Math.min(359, Math.max(0, Math.floor(lon + 180)))
      const i = row * 360 + col
      return (mask[i >> 3] >> (i & 7)) & 1
    }
    const pos: number[] = []
    const N = touch ? 6500 : 9000
    const ga = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N
      const r = Math.sqrt(1 - y * y)
      const th = ga * i
      const x = Math.cos(th) * r
      const z = Math.sin(th) * r
      if (isLand((Math.asin(y) * 180) / Math.PI, (Math.atan2(x, z) * 180) / Math.PI)) pos.push(x * R, y * R, z * R)
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    const pmat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(C.blue) }, uOpacity: { value: 1 }, uSize: { value: 2.7 }, uPR: { value: renderer.getPixelRatio() } },
      vertexShader: `uniform float uSize;uniform float uPR;varying float vF;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normalize(position));vF=dot(n,normalize(-mv.xyz));gl_PointSize=uSize*uPR*(16.5/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 uColor;uniform float uOpacity;varying float vF;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float a=smoothstep(.5,.3,d);float f=smoothstep(-.05,.35,vF);gl_FragColor=vec4(uColor,a*uOpacity*(.12+.88*f));}`,
    })
    const points = new THREE.Points(pg, pmat)
    points.renderOrder = 2
    globe.add(points)
    const body = new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 64, 48), new THREE.MeshBasicMaterial({ color: 0xeef3ff, transparent: true }))
    body.renderOrder = 0
    globe.add(body)
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.14, 64, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uOpacity: { value: 1 } },
        vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `uniform float uOpacity;varying vec3 vN;void main(){float i=pow(clamp(.56-dot(vN,vec3(0.,0.,1.)),0.,1.),3.);gl_FragColor=vec4(.22,.42,1.,i*.32*uOpacity);}`,
      }),
    )
    g.add(atm)
    const gm = new THREE.LineBasicMaterial({ color: C.blue, transparent: true, opacity: 0.16 })
    ;[-60, -30, 0, 30, 60].forEach((lat) => {
      const p: THREE.Vector3[] = []
      for (let i = 0; i <= 120; i++) p.push(ll(lat, i * 3 - 180, R * 1.001))
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gm))
    })
    for (let lon = -180; lon < 180; lon += 30) {
      const p: THREE.Vector3[] = []
      for (let i = 0; i <= 60; i++) p.push(ll(i * 3 - 90, lon, R * 1.001))
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gm))
    }
    const hubs: Record<string, [number, number]> = { asia: [26.9, 75.8], ne: [40.7, -74], nw: [37.8, -122.4], sa: [-23.5, -46.6] }
    const hubObjs: Array<{ rg: THREE.Mesh; off: number }> = []
    Object.entries(hubs).forEach(([k, [la, lo]], idx) => {
      const p = ll(la, lo, R * 1.005)
      const dot = new THREE.Mesh(new THREE.SphereGeometry(k === "asia" ? 0.085 : 0.06, 20, 20), new THREE.MeshBasicMaterial({ color: k === "asia" ? C.ink : C.blue, transparent: true }))
      dot.position.copy(p)
      globe.add(dot)
      const rg = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.105, 48), new THREE.MeshBasicMaterial({ color: k === "asia" ? C.ink : C.blue, transparent: true, side: THREE.DoubleSide, depthWrite: false }))
      rg.position.copy(p)
      rg.lookAt(p.clone().multiplyScalar(2))
      globe.add(rg)
      hubObjs.push({ rg, off: idx * 0.27 })
    })
    const arcs: Array<{ pts: THREE.Vector3[]; pm: THREE.Mesh; off: number }> = []
    ;["ne", "nw", "sa"].forEach((k, i) => {
      const a = ll(hubs.asia[0], hubs.asia[1], 1)
      const b = ll(hubs[k][0], hubs[k][1], 1)
      const ang = a.angleTo(b)
      const lift = 0.12 + ang * 0.09
      const pts: THREE.Vector3[] = []
      for (let u = 0; u <= 64; u++) {
        const t = u / 64
        const v = a
          .clone()
          .multiplyScalar(Math.sin((1 - t) * ang))
          .add(b.clone().multiplyScalar(Math.sin(t * ang)))
          .divideScalar(Math.sin(ang))
          .normalize()
        pts.push(v.multiplyScalar(R * (1.005 + lift * Math.sin(Math.PI * t) * 0.55)))
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: C.blue, transparent: true, opacity: 0.8 }))
      globe.add(line)
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: C.ink, transparent: true }))
      globe.add(pm)
      arcs.push({ pts, pm, off: i * 0.33 })
    })
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    sh.position.y = -3.1
    g.add(sh)
    const fade = collectFade(g)
    const st = { drag: 0, vel: 0, down: false }
    return {
      g,
      anchor: 0.2,
      scale: 0.95,
      fade,
      st,
      update(c) {
        const lon = lerp(80, -90, smooth(0.05, 0.95, c.p))
        st.drag += st.vel
        st.vel *= 0.94
        if (!st.down) st.drag *= 0.985
        globe.rotation.y = (-lon * Math.PI) / 180 + st.drag + (RM ? 0 : Math.sin(c.t * 0.2) * 0.03)
        tilt.rotation.x = 0.38 + c.py * 0.08
        tilt.rotation.y = c.px * 0.12
        hubObjs.forEach((h) => {
          const u = (c.t * 0.5 + h.off) % 1
          h.rg.scale.setScalar(1 + u * 2.6)
          ;(h.rg.material as any).userData.k = 1 - u
        })
        arcs.forEach((a) => {
          const u = (c.t * 0.22 + a.off) % 1
          a.pm.position.copy(a.pts[Math.min(64, Math.floor(u * 64))])
          ;(a.pm.material as any).userData.k = Math.sin(u * Math.PI)
        })
      },
    }
  }

  /* ===== SCENE 5 · RELEASE CUBE ===== */
  function buildCta(): SceneObj {
    const g = new THREE.Group()
    const coreMat = new THREE.MeshStandardMaterial({ color: C.blue, roughness: 0.25, metalness: 0.25, emissive: C.blue, emissiveIntensity: 0.2, transparent: true })
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), coreMat)
    core.add(edges(new THREE.BoxGeometry(1.3, 1.3, 1.3), 0xffffff, 0.55))
    g.add(core)
    const shell = new THREE.Group()
    shell.add(edges(new THREE.BoxGeometry(2.1, 2.1, 2.1), C.ink, 0.5))
    g.add(shell)
    const shell2 = edges(new THREE.BoxGeometry(2.9, 2.9, 2.9), C.blue, 0.3)
    g.add(shell2)
    const rings = [0, 1, 2].map(() => {
      const r = new THREE.Mesh(new THREE.RingGeometry(1, 1.012, 120), new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, side: THREE.DoubleSide, depthWrite: false }))
      r.rotation.x = -Math.PI / 2
      r.position.y = -1.9
      g.add(r)
      return r
    })
    const toks = SVC.map((_, i) => {
      const t = makeToken(i)
      g.add(t.group)
      return t
    })
    const nTok = Math.max(1, toks.length)
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }))
    sh.rotation.x = -Math.PI / 2
    sh.position.y = -2.4
    g.add(sh)
    const fade = collectFade(g)
    return {
      g,
      anchor: 0.2,
      scale: 0.95,
      fade,
      update(c) {
        const e = smooth(0.1, 0.75, c.pin)
        const rad = lerp(5.4, 3.0, e)
        core.rotation.set(c.t * 0.25 * (RM ? 0 : 1) + 0.4, c.t * 0.35 * (RM ? 0 : 1) + c.px * 0.3, 0)
        shell.rotation.set(-c.t * 0.12, c.t * 0.18, 0)
        shell2.rotation.set(c.t * 0.07, -c.t * 0.1, 0)
        coreMat.emissiveIntensity = 0.15 + e * 0.5
        core.scale.setScalar(0.7 + e * 0.4)
        toks.forEach((t, i) => {
          const a = c.t * 0.35 * (RM ? 0 : 1) + (i * PI2) / nTok + (1 - e) * 4
          const inc = (i % 3 - 1) * 0.55
          t.group.position.set(Math.cos(a) * rad, Math.sin(a + i) * 0.5 + inc * rad * 0.35, Math.sin(a) * rad * 0.8)
          t.group.lookAt(camera.position)
          t.group.scale.setScalar(0.42 + e * 0.12)
          t.bodyMat.userData.k = 0.55 + 0.45 * e
          t.dMat.userData.k = 0.55 + 0.45 * e
          t.eMat.userData.k = 0.8
        })
        rings.forEach((r, i) => {
          const u = (c.t * 0.35 + i / 3) % 1
          r.scale.setScalar(0.8 + u * 3.4)
          ;(r.material as any).userData.k = (1 - u) * e * 0.8
        })
        sh.scale.setScalar(0.8 + e * 0.3)
      },
    }
  }

  /* ---------- ambient dust ---------- */
  const dust = (() => {
    const n = touch ? 420 : 900
    const p = new Float32Array(n * 3)
    const R = rng(5)
    for (let i = 0; i < n; i++) {
      p[i * 3] = (R() - 0.5) * 38
      p[i * 3 + 1] = R() * 58 - 48
      p[i * 3 + 2] = -16 + R() * 22
    }
    const gm = new THREE.BufferGeometry()
    gm.setAttribute("position", new THREE.BufferAttribute(p, 3))
    const m = new THREE.PointsMaterial({ color: C.blue, size: 0.06, transparent: true, opacity: 0.32, depthWrite: false })
    const pts = new THREE.Points(gm, m)
    scene.add(pts)
    return pts
  })()

  /* ---------- scene groups from the DOM (data-scene) ---------- */
  const S: Array<SceneObj | null> = []
  let VH = window.innerHeight
  const groups: Group[] = []
  $$<HTMLElement>("[data-scene]").forEach((el) => {
    const i = Number(el.dataset.scene)
    const g = (groups[i] = groups[i] || ({ i, els: [], label: "" } as unknown as Group))
    g.els.push(el)
    if (el.dataset.label) g.label = el.dataset.label
  })
  groups.forEach((g) => {
    if (!g) return
    g.first = g.els[0]
    g.last = g.els[g.els.length - 1]
    g.win = g.i === 0 ? 1 : 0
    g.wout = 0
    g.w = 0
    g.p = g.pf = g.pin = 0
    g.top = g.bottom = g.firstH = 0
  })
  function measure() {
    VH = window.innerHeight
    groups.forEach((g) => {
      if (!g) return
      // Absolute document positions: the site header is in the normal flow above the page content.
      g.top = g.first.getBoundingClientRect().top + window.scrollY
      g.bottom = g.last.getBoundingClientRect().bottom + window.scrollY
      g.firstH = g.first.offsetHeight
    })
  }
  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    measure()
  }
  function scrollToScene(i: number, p = 0) {
    const g = groups[i]
    if (!g) return
    window.scrollTo({ top: g.top + p * Math.max(0, g.firstH - VH) + (p === 0 ? 1 : 0), behavior: RM ? "auto" : "smooth" })
  }

  /* ---------- pointer / interaction ---------- */
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, down: false, moved: 0, lastX: 0, target: null as EventTarget | null }
  const ray = new THREE.Raycaster()
  const mv = new THREE.Vector2()
  const hovered = { scene: -1, idx: -1 }
  const activeScene = () => {
    let b = -1
    let bw = 0.5
    groups.forEach((g, i) => {
      if (g && S[i] && g.w > bw) {
        bw = g.w
        b = i
      }
    })
    return b
  }
  const updatePointer = (e: PointerEvent) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1
    ptr.y = -((e.clientY / window.innerHeight) * 2 - 1)
    ptr.target = e.target
  }
  on(
    window,
    "pointermove",
    (e: PointerEvent) => {
      updatePointer(e)
      cur.classList.add("show")
      cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`
      tip.style.left = e.clientX + "px"
      tip.style.top = e.clientY + "px"
      if (ptr.down) {
        ptr.moved += Math.abs(e.clientX - ptr.lastX)
        dragMove(e.clientX - ptr.lastX)
        ptr.lastX = e.clientX
      }
    },
    { passive: true },
  )
  on(document, "pointerleave", () => cur.classList.remove("show"))
  on(canvas, "pointerdown", (e: PointerEvent) => {
    updatePointer(e)
    ptr.down = true
    ptr.moved = 0
    ptr.lastX = e.clientX
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* not all browsers allow capture here */
    }
    updateHover() // a tap with no movement still selects the object under the finger
    dragStart()
  })
  on(window, "pointerup", () => {
    if (!ptr.down) return
    ptr.down = false
    dragEnd(ptr.moved < 6)
  })
  on(window, "pointercancel", () => {
    if (ptr.down) {
      ptr.down = false
      dragEnd(false)
    }
  })
  function dragStart() {
    const a = activeScene()
    if (a === 1 && S[1]) S[1].st.drag = true
    if (a === 4 && S[4]) {
      S[4].st.down = true
      S[4].st.vel = 0
    }
  }
  function dragMove(dx: number) {
    const a = activeScene()
    if (a === 1 && S[1]) S[1].st.target += dx * 0.0065
    if (a === 4 && S[4]) {
      S[4].st.vel = dx * 0.0016
      S[4].st.drag += dx * 0.0045
    }
  }
  function dragEnd(click: boolean) {
    const a = activeScene()
    if (a === 1 && S[1]) {
      const st = S[1].st
      st.drag = false
      if (click && hovered.idx >= 0 && hovered.scene === 1) selectService(hovered.idx, true)
      else {
        const k = Math.round(-st.target / SVC_STEP)
        st.target = -k * SVC_STEP
        if (N_SVC) setService((((k % N_SVC) + N_SVC) % N_SVC))
      }
    }
    if (a === 3 && click && hovered.idx >= 0 && hovered.scene === 3) focusCase(hovered.idx)
    if (a === 4 && S[4]) S[4].st.down = false
  }
  function updateHover() {
    const a = activeScene()
    hovered.scene = a
    hovered.idx = -1
    if (ptr.target !== canvas) {
      if (S[1]) S[1].st.hover = -1
      if (S[3]) S[3].st.hover = -1
      tip.style.opacity = "0"
      return
    }
    mv.set(ptr.x, ptr.y)
    const sc = S[a]
    if ((a === 1 || a === 3) && sc && sc.meshes) {
      ray.setFromCamera(mv, camera)
      const hit = ray.intersectObjects(sc.meshes, false)[0]
      if (hit) hovered.idx = hit.object.userData.idx
      sc.st.hover = hovered.idx
      canvas.style.cursor = hovered.idx >= 0 ? "pointer" : a === 1 ? "grab" : "default"
      cur.classList.toggle("big", hovered.idx >= 0)
      if (hovered.idx >= 0) {
        tip.textContent = a === 1 ? SVC_NAMES[hovered.idx] + " — tap to select" : CASE_NAMES[hovered.idx].split(" for ")[0] + " — tap to focus"
        tip.style.opacity = touch ? "0" : "1"
      } else tip.style.opacity = "0"
    } else {
      canvas.style.cursor = a === 4 ? "grab" : "default"
      tip.style.opacity = "0"
      cur.classList.remove("big")
    }
  }
  $$("a,button").forEach((el) => {
    on(el, "pointerenter", () => cur.classList.add("big"))
    on(el, "pointerleave", () => cur.classList.remove("big"))
  })

  /* ---------- HTML wiring (state lives on the existing DOM; no content is added or removed) ---------- */
  let svcIdx = 0
  function setService(i: number) {
    if (i === svcIdx) return
    svcIdx = i
    SVC.forEach((e, k) => e.classList.toggle("on", k === i))
  }
  function selectService(i: number, rotate: boolean) {
    if (rotate && S[1]) {
      const st = S[1].st
      const c = -st.target / SVC_STEP
      const k = i + N_SVC * Math.round((c - i) / N_SVC)
      st.target = -k * SVC_STEP
    }
    setService(i)
  }
  SVC.forEach((e, i) => {
    on(e, "click", (ev: Event) => {
      if ((ev.target as Element).closest("a")) return
      selectService(i, true)
    })
    on(e, "mouseenter", () => {
      if (S[1] && !S[1].st.drag) S[1].st.hover = i
    })
    on(e, "mouseleave", () => {
      if (S[1]) S[1].st.hover = -1
    })
    on(e, "focusin", () => selectService(i, true))
  })
  let stepIdx = 0
  STEP_EL.forEach((e, i) => on(e, "click", () => scrollToScene(2, (i + 0.5) / N_STEP)))
  function renderStep(i: number) {
    if (i === stepIdx) return
    stepIdx = i
    STEP_EL.forEach((e, k) => {
      e.classList.toggle("on", k === i)
      e.classList.toggle("done", k < i)
    })
  }
  let caseIdx = 0
  function focusCase(i: number) {
    scrollToScene(3, N_CASE > 1 ? i / (N_CASE - 1) : 0)
  }
  CASE_EL.forEach((e, i) =>
    on(e, "click", (ev: Event) => {
      if ((ev.target as Element).closest("a")) return
      focusCase(i)
    }),
  )
  function renderCase(i: number) {
    if (i === caseIdx) return
    caseIdx = i
    CASE_EL.forEach((e, k) => e.classList.toggle("on", k === i))
  }

  /* ---------- frame loop ---------- */
  let sy = window.scrollY
  let last = performance.now() / 1000
  let intro = 0
  let prevScene = -2
  let raf = 0
  let wasDrawing = true
  let announcedReady = false
  function frame(now: number) {
    if (destroyed) return
    if (!announcedReady) mark("h3d:frame1-start")
    raf = requestAnimationFrame(frame)
    const t = now / 1000
    const dt = Math.min(0.05, t - last)
    last = t
    sy = RM ? window.scrollY : sy + (window.scrollY - sy) * Math.min(1, dt * 7)
    ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 4)
    ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 4)
    intro = Math.min(1, intro + dt * 0.7)
    groups.forEach((g) => {
      if (g) g.win = g.i === 0 ? 1 : smooth(g.top - VH * 0.85, g.top - VH * 0.05, sy)
    })
    groups.forEach((g, i) => {
      if (!g) return
      const n = groups[i + 1]
      g.wout = n ? n.win : 0
      g.w = g.win * (1 - g.wout)
      g.p = clamp((sy - g.top) / Math.max(1, g.bottom - g.top - VH))
      g.pf = clamp((sy - g.top) / Math.max(1, g.firstH - VH))
      g.pin = clamp((sy - g.top + VH) / Math.max(1, VH + g.firstH))
    })
    dust.position.y = sy * 0.0016
    dust.position.x = ptr.sx * -0.4
    dust.rotation.y = t * 0.01 * (RM ? 0 : 1)
    const mobile = camera.aspect < 0.9
    const V = viewSize()
    const ctx: Ctx = { t, dt, px: ptr.sx, py: ptr.sy, aspect: camera.aspect, p: 0, pf: 0, pin: 0 }
    let anyVisible = false
    S.forEach((sc, i) => {
      const g = groups[i]
      if (!sc || !g) return
      const vis = g.w > 0.003
      sc.g.visible = vis
      if (!vis) return
      anyVisible = true
      ctx.p = g.p
      ctx.pf = g.pf
      ctx.pin = g.pin
      sc.update(ctx)
      const ein = ease(g.win)
      const eout = ease(g.wout)
      let sx = sc.anchor * V.w
      if (camera.aspect < 1.25) sx *= 0.45
      let yy = 0
      let scl = sc.scale
      if (mobile) {
        sx = 0
        yy = V.h * 0.27
        scl *= 0.6
      }
      const ik = i === 0 ? ease(intro) : 1
      sc.g.position.set(sx, yy + (1 - ein) * -0.9 + eout * 0.6 + (1 - ik) * -1.2, (1 - ein) * -3 + eout * 3.2)
      sc.g.scale.setScalar(scl * lerp(0.9, 1, ein) * lerp(1, 1.12, eout) * lerp(0.85, 1, ik))
      applyFade(sc.fade, g.w * (i === 0 ? ik : 1) * (mobile ? 0.6 : 1))
    })
    if (groups[2] && N_STEP) renderStep(Math.min(N_STEP - 1, Math.floor(groups[2].pf * N_STEP + 0.0001)))
    renderCase(S[3] ? S[3].st.focus || 0 : 0)
    const a = activeScene()
    if (a !== prevScene) {
      prevScene = a
      root.dataset.h3dScene = String(a)
    }
    updateHover()
    // While no scene is on screen (notes + footer), draw one empty frame and then stop rendering.
    if (anyVisible || wasDrawing) {
      renderer.render(scene, camera)
      wasDrawing = anyVisible
    }
    if (!announcedReady) {
      mark("h3d:frame1-end")
      announcedReady = true
      o.onReady?.()
    }
  }

  /* ---------- init ---------- */
  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null
  type Builder = (() => SceneObj) | null
  const builders: Builder[] = [buildHero, N_SVC ? buildServices : null, N_STEP ? buildProcess : null, N_CASE ? buildProjects : null, buildGlobe, N_SVC ? buildCta : null]
  function addScene(i: number) {
    const build = builders[i]
    if (!build || S[i]) return
    const sc = build()
    sc.g.visible = false
    scene.add(sc.g)
    S[i] = sc
    uploadFresh()
    mark("h3d:scene-" + i)
  }
  async function init() {
    try {
      await Promise.race([document.fonts.load(`700 37px ${FONT}`), new Promise((r) => setTimeout(r, 2500))])
      await document.fonts.load(`600 28px ${FONT}`).catch(() => undefined)
    } catch {
      /* fonts are optional for the textures */
    }
    if (destroyed) return
    mark("h3d:fonts")
    // One texture per service, in list order: the icon is chosen by glyph index, the number by list position.
    glyphTex = SVC_SHORT.map((n, i) => glyphTexture(SVC_GLYPH[i] ?? i, n, i))
    builders.forEach((_, i) => {
      S[i] = null
    })
    await idle()
    if (destroyed) return
    mark("h3d:hero-start")
    addScene(0)
    mark("h3d:hero-end")
    resize()
    mark("h3d:resized")
    on(window, "resize", resize)
    on(window, "load", measure)
    resizeObserver?.observe(document.body)
    mark("h3d:observed")
    raf = requestAnimationFrame(frame)
    // The other scenes are built one at a time while the browser is idle, in page order; a scene that is not
    // ready yet simply does not draw until it is.
    for (let i = 1; i < builders.length; i++) {
      await idle()
      if (destroyed) return
      addScene(i)
    }
    mark("h3d:ready")
  }
  init().catch((error) => {
    if (!destroyed) o.onFail?.(error)
  })

  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      cancelAnimationFrame(raf)
      cleanups.splice(0).forEach((fn) => fn())
      resizeObserver?.disconnect()
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        const ms = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []
        ms.forEach((m: any) => m.dispose())
      })
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      tip.style.opacity = "0"
      cur.classList.remove("show", "big")
    },
  }
}
