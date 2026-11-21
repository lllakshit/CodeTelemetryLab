/**
 * WebGL scenes of the shared 3D design system: the drifting background and one interactive scene per page
 * (services coverflow, project windows, process helix, blog sheets, About block field, careers globe).
 *
 * Every word, link and card lives in the server-rendered HTML. The scenes read their labels from that markup
 * (`data-scene` boxes and the cards next to them) and never add or remove content. Loaded on demand by site-3d.tsx.
 *
 * Ported from the approved prototype ("codetelemetrylab-3d-prototype", window.CT engine), with:
 *  - a mount/destroy lifecycle (listeners, observers, renderers and GPU resources are released on unmount)
 *  - labels taken from the page (posts, services, case studies, process steps) instead of hard-coded copies
 *  - the page font for card textures, lower pixel ratio and fewer points on phones
 *  - one frame drawn straight away even when a scene is off screen, so the page leaves its "pending" state
 */
import * as THREE from "three"

export type SiteScenesOptions = {
  root: HTMLElement
  bgCanvas: HTMLCanvasElement
  fontFamily: string
  onReady?: () => void
  onFail?: (error: unknown) => void
}
export type SiteScenesHandle = { destroy: () => void }

type Loop = { on: boolean; fn: (t: number) => void }
type Stage = {
  r: THREE.WebGLRenderer
  scene: THREE.Scene
  cam: THREE.PerspectiveCamera
  canvas: HTMLCanvasElement
  onSize: ((w: number, h: number) => void) | null
}
type Ptr = { x: number; y: number; drag: boolean; moved: number; hover: boolean }
type Draw = (g: CanvasRenderingContext2D, W: number, H: number, i: number, N: number) => void
type CarouselItem = { color: string; draw: Draw }
type CarouselCfg = {
  items: CarouselItem[]
  tex: { w: number; h: number }
  geo: { w: number; h: number; r: number; depth: number }
  mode: "ring" | "helix" | "flow"
  step?: number
  R?: number
  rise?: number
  mid?: number
  start?: number
  flow?: { sp?: number; off?: number; depth?: number; ang?: number; act?: number; drop?: number }
  camera: { pos: [number, number, number]; look: [number, number, number] }
  fov?: number
  narrowK?: number
  lift?: number
  pop?: number
  auto?: number
  dragK?: number
  decorate?: (c: DecorCtx) => ((t: number, active: number) => void) | null
  onActive?: (i: number) => void
  onActivate?: (i: number) => void
}
type DecorCtx = { group: THREE.Group; scene: THREE.Scene; cards: Array<{ it: CarouselItem }>; mid: number; step: number; R: number; rise: number }

const PAL: Array<[string, string]> = [
  ["#3b5bdb", "#e4eaff"],
  ["#12a37f", "#dcf6ee"],
  ["#7a4fe0", "#ece4ff"],
  ["#e8912d", "#fdebd6"],
  ["#1fa65a", "#dcf5e6"],
]
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function mountSiteScenes(o: SiteScenesOptions): SiteScenesHandle {
  const { root, bgCanvas } = o
  const FONT = o.fontFamily
  const $$ = <T extends Element>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s))
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches

  let destroyed = false
  let readySent = false
  const cleanups: Array<() => void> = []
  const renderers: THREE.WebGLRenderer[] = []
  const scenes: THREE.Scene[] = []
  const loose: Array<{ dispose: () => void }> = []
  const on = (t: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn, opts)
    cleanups.push(() => t.removeEventListener(type, fn, opts))
  }
  const ready = () => {
    if (readySent || destroyed) return
    readySent = true
    try {
      performance.mark("s3d:first-frame")
    } catch {
      /* optional */
    }
    o.onReady?.()
  }

  /* ---------------- shared render loop ---------------- */
  const loops: Loop[] = []
  let raf = 0
  const tick = (t: number) => {
    if (destroyed) return
    raf = requestAnimationFrame(tick)
    for (const l of loops) if (l.on) l.fn(t)
  }
  raf = requestAnimationFrame(tick)
  /** Runs `loop` only while `el` is near the viewport and the tab is visible; draws one frame straight away. */
  const watch = (el: Element, loop: Loop) => {
    loops.push(loop)
    if (typeof IntersectionObserver === "undefined") {
      loop.on = true
    } else {
      const io = new IntersectionObserver((es) => (loop.on = es[0].isIntersecting && !document.hidden), { rootMargin: "120px" })
      io.observe(el)
      cleanups.push(() => io.disconnect())
    }
    loop.fn(performance.now())
    ready()
  }
  on(document, "visibilitychange", () => {
    if (document.hidden) loops.forEach((l) => (l.on = false))
  })

  /* ---------------- canvas drawing helpers ---------------- */
  const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number) => {
    g.beginPath()
    g.moveTo(x + rad, y)
    g.arcTo(x + w, y, x + w, y + h, rad)
    g.arcTo(x + w, y + h, x, y + h, rad)
    g.arcTo(x, y + h, x, y, rad)
    g.arcTo(x, y, x + w, y, rad)
    g.closePath()
  }
  const rrf = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) => {
    rr(g, x, y, w, h, r)
    g.fillStyle = fill
    g.fill()
  }
  const line = (g: CanvasRenderingContext2D, x: number, y: number, w: number, col: string, h = 10) => rrf(g, x, y, w, h, h / 2, col)
  const wrapText = (g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines?: number) => {
    const words = text.split(" ")
    let ln = ""
    let lines: string[] = []
    words.forEach((w) => {
      const t = ln ? ln + " " + w : w
      if (g.measureText(t).width > maxW && ln) {
        lines.push(ln)
        ln = w
      } else ln = t
    })
    if (ln) lines.push(ln)
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
      lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"
    }
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh))
    return y + lines.length * lh
  }
  const shape = (w: number, h: number, rad: number) => {
    const s = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    s.moveTo(x + rad, y)
    s.lineTo(x + w - rad, y)
    s.quadraticCurveTo(x + w, y, x + w, y + rad)
    s.lineTo(x + w, y + h - rad)
    s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    s.lineTo(x + rad, y + h)
    s.quadraticCurveTo(x, y + h, x, y + h - rad)
    s.lineTo(x, y + rad)
    s.quadraticCurveTo(x, y, x + rad, y)
    return s
  }
  const canvasTex = (c: HTMLCanvasElement, srgb = true) => {
    const tx = new THREE.CanvasTexture(c)
    tx.anisotropy = 8
    if (srgb) tx.encoding = THREE.sRGBEncoding
    loose.push(tx)
    return tx
  }

  function icon(g: CanvasRenderingContext2D, k: string, cx: number, cy: number, col: string) {
    g.strokeStyle = col
    g.fillStyle = col
    g.lineWidth = 9
    g.lineCap = "round"
    g.lineJoin = "round"
    const P = () => g.beginPath()
    if (k === "doc") {
      rr(g, cx - 38, cy - 50, 76, 100, 12)
      g.stroke()
      P()
      g.moveTo(cx - 20, cy - 18)
      g.lineTo(cx + 20, cy - 18)
      g.moveTo(cx - 20, cy + 4)
      g.lineTo(cx + 20, cy + 4)
      g.moveTo(cx - 20, cy + 26)
      g.lineTo(cx + 4, cy + 26)
      g.stroke()
    } else if (k === "check") {
      rr(g, cx - 40, cy - 48, 80, 100, 12)
      g.stroke()
      P()
      g.moveTo(cx - 20, cy - 4)
      g.lineTo(cx - 8, cy + 10)
      g.lineTo(cx + 20, cy - 20)
      g.stroke()
      P()
      g.moveTo(cx - 20, cy + 30)
      g.lineTo(cx + 20, cy + 30)
      g.stroke()
    } else if (k === "chat") {
      rr(g, cx - 52, cy - 46, 70, 52, 14)
      g.stroke()
      rr(g, cx - 8, cy - 6, 62, 46, 13)
      g.globalAlpha = 0.9
      g.fill()
      g.globalAlpha = 1
    } else if (k === "dollar") {
      rr(g, cx - 38, cy - 50, 76, 100, 12)
      g.stroke()
      g.font = `800 62px ${FONT}`
      g.textAlign = "center"
      g.textBaseline = "middle"
      g.fillText("$", cx, cy + 4)
      g.textBaseline = "alphabetic"
    } else if (k === "rocket") {
      g.save()
      g.translate(cx, cy)
      g.rotate(Math.PI / 4)
      P()
      g.moveTo(0, -56)
      g.quadraticCurveTo(30, -26, 24, 22)
      g.lineTo(-24, 22)
      g.quadraticCurveTo(-30, -26, 0, -56)
      g.closePath()
      g.stroke()
      P()
      g.arc(0, -14, 9, 0, 7)
      g.stroke()
      P()
      g.moveTo(-24, 12)
      g.lineTo(-42, 34)
      g.lineTo(-24, 28)
      g.moveTo(24, 12)
      g.lineTo(42, 34)
      g.lineTo(24, 28)
      g.stroke()
      P()
      g.moveTo(0, 34)
      g.lineTo(0, 52)
      g.stroke()
      g.restore()
    } else if (k === "search") {
      P()
      g.arc(cx - 8, cy - 8, 34, 0, 7)
      g.stroke()
      P()
      g.moveTo(cx + 17, cy + 17)
      g.lineTo(cx + 46, cy + 46)
      g.stroke()
    } else if (k === "blueprint") {
      rr(g, cx - 48, cy - 42, 96, 84, 10)
      g.stroke()
      g.lineWidth = 6
      P()
      g.moveTo(cx - 48, cy - 8)
      g.lineTo(cx + 48, cy - 8)
      g.moveTo(cx - 6, cy - 42)
      g.lineTo(cx - 6, cy + 42)
      g.stroke()
      P()
      g.moveTo(cx + 14, cy + 8)
      g.lineTo(cx + 34, cy + 28)
      g.stroke()
    } else if (k === "blocks") {
      rr(g, cx - 52, cy + 4, 48, 44, 8)
      g.stroke()
      rr(g, cx + 4, cy + 4, 48, 44, 8)
      g.stroke()
      rr(g, cx - 24, cy - 48, 48, 44, 8)
      g.stroke()
    } else if (k === "shield") {
      P()
      g.moveTo(cx, cy - 52)
      g.lineTo(cx + 44, cy - 34)
      g.lineTo(cx + 40, cy + 12)
      g.quadraticCurveTo(cx + 30, cy + 40, cx, cy + 54)
      g.quadraticCurveTo(cx - 30, cy + 40, cx - 40, cy + 12)
      g.lineTo(cx - 44, cy - 34)
      g.closePath()
      g.stroke()
      P()
      g.moveTo(cx - 18, cy)
      g.lineTo(cx - 4, cy + 14)
      g.lineTo(cx + 20, cy - 14)
      g.stroke()
    } else if (k === "pulse") {
      P()
      g.moveTo(cx - 54, cy + 4)
      g.lineTo(cx - 26, cy + 4)
      g.lineTo(cx - 12, cy - 36)
      g.lineTo(cx + 8, cy + 40)
      g.lineTo(cx + 22, cy - 4)
      g.lineTo(cx + 54, cy - 4)
      g.stroke()
    }
  }

  /* ---------------- stage, pointer, carousel ---------------- */
  function stage(canvas: HTMLCanvasElement, fov = 36): Stage {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderers.push(r)
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2))
    r.outputEncoding = THREE.sRGBEncoding
    const scene = new THREE.Scene()
    scenes.push(scene)
    const cam = new THREE.PerspectiveCamera(fov, 1.3, 0.1, 80)
    scene.add(new THREE.AmbientLight(0xffffff, 0.95))
    const dl = new THREE.DirectionalLight(0xffffff, 0.8)
    dl.position.set(3, 6, 7)
    scene.add(dl)
    const st: Stage = { r, scene, cam, canvas, onSize: null }
    const size = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      r.setSize(w, h, false)
      cam.aspect = w / h
      st.onSize?.(w, h)
      cam.updateProjectionMatrix()
    }
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(size)
      ro.observe(canvas)
      cleanups.push(() => ro.disconnect())
    } else on(window, "resize", size)
    // First size now, so the first frame (drawn straight away) has the right proportions.
    queueMicrotask(size)
    ;(st as Stage & { size: () => void }).size = size
    return st
  }
  const sizeNow = (st: Stage) => (st as Stage & { size?: () => void }).size?.()

  function pointer(
    canvas: HTMLCanvasElement,
    h: {
      onDown?: (e: PointerEvent) => void
      onDrag?: (dx: number, dy: number, b: DOMRect, e: PointerEvent) => void
      onMove?: (e: PointerEvent, b: DOMRect) => void
      onEnd?: (e: PointerEvent, moved: number) => void
      onClick?: (e: PointerEvent) => void
      onLeave?: () => void
    },
  ): Ptr {
    const s: Ptr = { x: 0, y: 0, drag: false, moved: 0, hover: false }
    let lastX = 0
    let lastY = 0
    on(canvas, "pointerdown", (e: PointerEvent) => {
      s.drag = true
      s.moved = 0
      lastX = e.clientX
      lastY = e.clientY
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* not capturable */
      }
      h.onDown?.(e)
    })
    on(canvas, "pointermove", (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      s.x = ((e.clientX - b.left) / b.width) * 2 - 1
      s.y = ((e.clientY - b.top) / b.height) * 2 - 1
      if (s.drag) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        lastX = e.clientX
        lastY = e.clientY
        s.moved += Math.abs(dx) + Math.abs(dy)
        if (s.moved > 4) canvas.classList.add("drag")
        h.onDrag?.(dx, dy, b, e)
      } else h.onMove?.(e, b)
    })
    on(canvas, "pointerup", (e: PointerEvent) => {
      if (!s.drag) return
      s.drag = false
      canvas.classList.remove("drag")
      h.onEnd?.(e, s.moved)
      if (s.moved < 6) h.onClick?.(e)
    })
    on(canvas, "pointercancel", (e: PointerEvent) => {
      if (!s.drag) return
      s.drag = false
      canvas.classList.remove("drag")
      h.onEnd?.(e, 99)
    })
    on(canvas, "pointerenter", () => (s.hover = true))
    on(canvas, "pointerleave", () => {
      s.hover = false
      s.x = s.y = 0
      h.onLeave?.()
    })
    return s
  }

  function carousel(box: HTMLElement, cfg: CarouselCfg) {
    const canvas = box.querySelector<HTMLCanvasElement>(".cv3d")
    if (!canvas || !cfg.items.length) return null
    const st = stage(canvas, cfg.fov)
    box.classList.add("gl")
    const { scene, cam, r } = st
    const N = cfg.items.length
    const mid = cfg.mid !== undefined ? Math.min(cfg.mid, N - 1) : Math.floor(N / 2)
    let cur = cfg.start !== undefined ? Math.min(cfg.start, N - 1) : mid
    let target = cur
    let active = Math.round(cur)
    let hover = -1
    let idle = 0
    let vel = 0
    let hoverOn = false
    const group = new THREE.Group()
    scene.add(group)
    const G = cfg.geo
    const bodyGeo = new THREE.ExtrudeGeometry(shape(G.w, G.h, G.r), {
      depth: G.depth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 10,
    })
    bodyGeo.translate(0, 0, -G.depth / 2)
    const planeGeo = new THREE.PlaneGeometry(G.w - 0.05, G.h - 0.06)
    const cards: Array<{ g: THREE.Group; wrap: THREE.Group; it: CarouselItem }> = []
    const fronts: THREE.Mesh[] = []
    cfg.items.forEach((it, i) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: it.color, roughness: 0.45, metalness: 0.12 }))
      const c = document.createElement("canvas")
      c.width = cfg.tex.w
      c.height = cfg.tex.h
      it.draw(c.getContext("2d") as CanvasRenderingContext2D, c.width, c.height, i, N)
      const front = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: canvasTex(c), transparent: true }))
      front.position.z = G.depth / 2 + 0.028
      front.userData.i = i
      g.add(body)
      g.add(front)
      const wrap = new THREE.Group()
      wrap.add(g)
      group.add(wrap)
      cards.push({ g, wrap, it })
      fronts.push(front)
    })
    const step = cfg.step ?? 0.6
    const R = cfg.R ?? 3.3
    const rise = cfg.rise ?? 0
    const F = cfg.flow ?? {}
    if (cfg.mode !== "flow")
      cards.forEach((c, i) => {
        const th = (i - mid) * step
        c.wrap.position.set(Math.sin(th) * R, (i - mid) * rise, Math.cos(th) * R)
        c.wrap.rotation.y = th
      })
    const decor = cfg.decorate ? cfg.decorate({ group, scene, cards, mid, step, R, rise }) : null
    const dots = Array.from(box.querySelectorAll<HTMLButtonElement>(".flow-dots button"))
    const setActive = (i: number) => {
      active = i
      dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"))
      cfg.onActive?.(i)
    }
    const go = (i: number, user = false) => {
      target = clamp(i, 0, N - 1)
      setActive(Math.round(target))
      if (user) {
        idle = 0
        box.classList.add("touched")
      }
    }
    dots.forEach((d, i) => on(d, "click", () => go(i, true)))
    setActive(Math.round(cur))
    st.onSize = (w, h) => {
      const k = w / h < 1.1 ? (cfg.narrowK ?? 1.22) : 1
      const p = cfg.camera.pos
      const l = cfg.camera.look
      cam.position.set(p[0], p[1] * k, p[2] * k)
      cam.lookAt(l[0], l[1], l[2])
    }
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const pick = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, cam)
      const h = ray.intersectObjects(fronts)
      return h.length ? (h[0].object.userData.i as number) : -1
    }
    const ps = pointer(canvas, {
      onDown: () => {
        vel = 0
        idle = 0
      },
      onDrag: (dx, _dy, b) => {
        box.classList.add("touched")
        const d = (-dx / b.width) * (cfg.dragK ?? 3.4)
        vel = d
        cur = clamp(cur + d * (cur < 0 || cur > N - 1 ? 0.35 : 1), -0.4, N - 1 + 0.4)
        target = cur
      },
      onMove: (e) => {
        if (e.pointerType === "mouse") {
          hover = pick(e)
          canvas.style.cursor = hover >= 0 ? "pointer" : "grab"
        }
      },
      onEnd: (_e, moved) => {
        if (moved >= 6) go(Math.round(clamp(cur + vel * 6, 0, N - 1)), true)
      },
      onClick: (e) => {
        const i = pick(e)
        if (i < 0) return
        if (i === active && cfg.onActivate) cfg.onActivate(i)
        else go(i, true)
      },
      onLeave: () => {
        hover = -1
        hoverOn = false
      },
    })
    on(canvas, "pointerenter", () => (hoverOn = true))
    canvas.tabIndex = 0
    on(canvas, "keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(Math.min(N - 1, active + 1), true)
      else if (e.key === "ArrowLeft") go(Math.max(0, active - 1), true)
      else if (e.key === "Enter" && cfg.onActivate) cfg.onActivate(active)
      else return
      e.preventDefault()
    })
    let t0 = 0
    sizeNow(st)
    watch(canvas, {
      on: false,
      fn(t) {
        const dt = Math.min(0.05, (t - t0) / 1000 || 0.016)
        t0 = t
        if (!ps.drag) cur += (target - cur) * Math.min(1, dt * 7)
        if (cfg.auto && !reduce && !ps.drag && !hoverOn) {
          idle += dt
          if (idle > cfg.auto) {
            idle = 0
            go((active + 1) % N)
          }
        }
        if (cfg.mode === "flow") {
          cards.forEach((c, i) => {
            const d = i - cur
            const ad = Math.abs(d)
            const sg = d < 0 ? -1 : 1
            const cl = clamp(d, -1.2, 1.2)
            c.wrap.position.set(d * (F.sp ?? 1.1) + sg * Math.min(ad, 1) * (F.off ?? 0.9), -Math.min(ad, 2) * (F.drop ?? 0), -Math.min(ad, 2.6) * (F.depth ?? 1.1))
            c.wrap.rotation.y = -cl * (F.ang ?? 0.7)
          })
          group.rotation.x += (ps.y * 0.05 - group.rotation.x) * 0.08
        } else {
          group.rotation.y = -(cur - mid) * step
          group.position.y = -(cur - mid) * rise
          group.rotation.x += (ps.y * 0.07 - group.rotation.x) * 0.08
          group.position.x += (ps.x * -0.18 - group.position.x) * 0.06
        }
        for (let i = 0; i < cards.length; i++) {
          const c = cards[i]
          const a = i === active
          const s = a ? (F.act ?? 1.1) : i === hover ? 1.04 : 0.95
          c.g.scale.x += (s - c.g.scale.x) * 0.12
          c.g.scale.y = c.g.scale.z = c.g.scale.x
          c.g.position.y += ((a ? (cfg.lift ?? 0.12) : 0) + Math.sin(t * 0.0014 + i * 1.3) * 0.04 - c.g.position.y) * 0.1
          c.g.position.z += ((a ? (cfg.pop ?? 0.35) : 0) - c.g.position.z) * 0.1
        }
        decor?.(t, active)
        r.render(scene, cam)
      },
    })
    return { go }
  }

  /* ---------------- decorations ---------------- */
  const ringDecor =
    (opt: { y: number; grid: boolean }) =>
    (c: DecorCtx) => {
      const pts: THREE.Vector3[] = []
      const peds: Array<{ ped: THREE.Mesh; ring: THREE.Mesh }> = []
      const packets: THREE.Mesh[] = []
      c.cards.forEach((cd, i) => {
        const th = (i - c.mid) * c.step
        const x = Math.sin(th) * c.R
        const z = Math.cos(th) * c.R
        const y = opt.y + (i - c.mid) * c.rise
        const col = new THREE.Color(cd.it.color)
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.06, 56), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: col, emissiveIntensity: 0.08 }))
        ped.position.set(x, y, z)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.018, 8, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45 }))
        ring.rotation.x = Math.PI / 2
        ring.position.set(x, y + 0.035, z)
        c.group.add(ped)
        c.group.add(ring)
        peds.push({ ped, ring })
        pts.push(new THREE.Vector3(x, y + 0.04, z))
      })
      if (pts.length < 2) return null
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5)
      c.group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 140, 0.03, 8, false), new THREE.MeshBasicMaterial({ color: 0x6d8dff, transparent: true, opacity: 0.75 })))
      if (opt.grid) {
        const grid = new THREE.PolarGridHelper(4.6, 16, 6, 64, 0x9fb4ff, 0xd2dcff)
        grid.position.y = opt.y - 0.03
        const gm = grid.material as THREE.Material
        gm.transparent = true
        gm.opacity = 0.5
        c.group.add(grid)
      }
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0x2b4fe0 }))
        p.userData.o = k / 3
        c.group.add(p)
        packets.push(p)
      }
      return (t: number, active: number) => {
        peds.forEach((p, i) => {
          const a = i === active
          const rm = p.ring.material as THREE.MeshBasicMaterial
          rm.opacity += ((a ? 1 : 0.35) - rm.opacity) * 0.12
          const s = 1 + (a && !reduce ? 0.07 * Math.sin(t * 0.004) : 0)
          p.ring.scale.set(s, s, s)
          const pm = p.ped.material as THREE.MeshStandardMaterial
          pm.emissiveIntensity += ((a ? 0.55 : 0.08) - pm.emissiveIntensity) * 0.12
        })
        packets.forEach((p) => {
          p.position.copy(curve.getPointAt((t * 0.00007 + (p.userData.o as number)) % 1))
          p.position.y += 0.05
        })
      }
    }
  const floorGlow = (c: DecorCtx) => {
    const cv = document.createElement("canvas")
    cv.width = 256
    cv.height = 128
    const g = cv.getContext("2d") as CanvasRenderingContext2D
    const gr = g.createRadialGradient(128, 64, 4, 128, 64, 120)
    gr.addColorStop(0, "rgba(80,110,240,.35)")
    gr.addColorStop(1, "rgba(80,110,240,0)")
    g.fillStyle = gr
    g.fillRect(0, 0, 256, 128)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshBasicMaterial({ map: canvasTex(cv, false), transparent: true, depthWrite: false }))
    m.rotation.x = -Math.PI / 2
    m.position.set(0, -1.12, -0.6)
    c.scene.add(m)
    const grid = new THREE.GridHelper(14, 28, 0xb7c6f5, 0xdfe6fb)
    grid.position.y = -1.13
    grid.position.z = -0.6
    const gm = grid.material as THREE.Material
    gm.transparent = true
    gm.opacity = 0.45
    c.scene.add(grid)
    return null
  }
  const scrollToEl = (el: Element | undefined) => el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
  const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim()

  /* =========================================================
     SERVICES — coverflow of the service areas
     ========================================================= */
  const SVC_ICONS = ["blocks", "pulse", "chat", "search", "blueprint", "dollar", "rocket", "blocks", "blueprint", "doc", "pulse", "doc", "check", "chat", "blocks", "pulse", "rocket", "blueprint", "shield"]
  function servicesScene(box: HTMLElement) {
    const cards = $$<HTMLElement>(".svc")
    carousel(box, {
      mode: "flow",
      mid: 2,
      start: 2,
      auto: 3.2,
      dragK: 3.4,
      fov: 34,
      lift: 0.1,
      pop: 0.45,
      tex: { w: 512, h: 600 },
      geo: { w: 1.7, h: 2, r: 0.14, depth: 0.06 },
      flow: { sp: 0.8, off: 1.1, depth: 0.6, ang: 0.5, act: 1.1, drop: 0.05 },
      camera: { pos: [0, 0.5, 8.6], look: [0, -0.1, 0] },
      narrowK: 1.2,
      items: cards.map((card, i) => {
        const p = PAL[i % 5]
        const name = card.dataset.name || text(card.querySelector("h2"))
        const ico = card.dataset.icon || SVC_ICONS[i % SVC_ICONS.length]
        const n = String(i + 1).padStart(2, "0")
        return {
          color: p[0],
          draw: (g, W, H) => {
            rr(g, 4, 4, W - 8, H - 8, 44)
            const gr = g.createLinearGradient(0, 0, W, H)
            gr.addColorStop(0, "#fff")
            gr.addColorStop(1, p[1])
            g.fillStyle = gr
            g.fill()
            g.font = `800 190px ${FONT}`
            g.textAlign = "right"
            g.fillStyle = "rgba(20,40,90,.06)"
            g.fillText(n, W - 30, 210)
            g.font = `800 30px ${FONT}`
            g.textAlign = "left"
            g.fillStyle = p[0]
            g.fillText(n, 44, 84)
            g.beginPath()
            g.arc(W / 2, 214, 86, 0, 7)
            g.fillStyle = p[1]
            g.fill()
            icon(g, ico, W / 2, 214, p[0])
            g.textAlign = "center"
            g.fillStyle = "#0a1317"
            g.font = `800 40px ${FONT}`
            wrapText(g, name, W / 2, 376, W - 80, 50, 3)
            g.fillStyle = p[0]
            g.font = `700 24px ${FONT}`
            g.fillText("Read the approach →", W / 2, H - 46)
          },
        }
      }),
      decorate: floorGlow,
      onActive: (i) => cards.forEach((c, k) => c.classList.toggle("spot", k === i)),
      onActivate: (i) => scrollToEl(cards[i]),
    })
  }

  /* =========================================================
     PROJECTS — product windows, one per case study
     ========================================================= */
  function chromeBar(g: CanvasRenderingContext2D, W: number, H: number, tint: string) {
    rr(g, 4, 4, W - 8, H - 8, 44)
    g.fillStyle = "#ffffff"
    g.fill()
    g.lineWidth = 2
    g.strokeStyle = "rgba(20,40,90,.12)"
    g.stroke()
    g.save()
    rr(g, 4, 4, W - 8, H - 8, 44)
    g.clip()
    g.fillStyle = tint
    g.fillRect(0, 0, W, 70)
    g.restore()
    ;["#ff6b6b", "#ffc13d", "#34c77b"].forEach((c, i) => {
      g.beginPath()
      g.arc(42 + i * 28, 38, 8, 0, 7)
      g.fillStyle = c
      g.fill()
    })
    rrf(g, W / 2 - 190, 20, 380, 36, 18, "rgba(255,255,255,.9)")
    line(g, W / 2 - 160, 33, 150, "#c8d2f0", 10)
  }
  function mockPlatform(g: CanvasRenderingContext2D, W: number, H: number) {
    chromeBar(g, W, H, "#e9eeff")
    rrf(g, 26, 92, 170, H - 120, 22, "#f2f5ff")
    for (let i = 0; i < 6; i++) {
      rrf(g, 46, 120 + i * 54, 28, 28, 9, i === 1 ? "#3b5bdb" : "#c9d3f2")
      line(g, 86, 128 + i * 54, i === 1 ? 82 : 70, i === 1 ? "#3b5bdb" : "#d3dbf4", 12)
    }
    line(g, 226, 100, 260, "#0e1b2c", 20)
    line(g, 226, 134, 180, "#c8d2f0", 10)
    rrf(g, W - 250, 96, 224, 40, 20, "#eef2ff")
    const cols = ["#3b5bdb", "#12a37f", "#e8912d"]
    for (let k = 0; k < 3; k++) {
      const x = 226 + k * 262
      rrf(g, x, 168, 244, 118, 22, "#f6f8ff")
      line(g, x + 20, 190, 90, "#c8d2f0", 10)
      line(g, x + 20, 214, 130, cols[k], 24)
      g.strokeStyle = cols[k]
      g.lineWidth = 5
      g.beginPath()
      g.moveTo(x + 20, 268)
      for (let j = 1; j < 9; j++) g.lineTo(x + 20 + j * 25, 268 - Math.sin(j * 0.9 + k) * 10 - j * 2)
      g.stroke()
    }
    rrf(g, 226, 306, 430, H - 334, 24, "#f6f8ff")
    ;[0.4, 0.62, 0.5, 0.8, 0.66, 0.9, 0.74, 0.95].forEach((h, i) => {
      const bh = h * (H - 420)
      const gr = g.createLinearGradient(0, H - 50 - bh, 0, H - 50)
      gr.addColorStop(0, "#6d8dff")
      gr.addColorStop(1, "#3b5bdb")
      rrf(g, 252 + i * 48, H - 50 - bh, 28, bh, 9, gr)
    })
    rrf(g, 676, 306, W - 702, H - 334, 24, "#f6f8ff")
    g.lineWidth = 26
    ;([["#3b5bdb", 0, 0.55], ["#12a37f", 0.55, 0.82], ["#e8912d", 0.82, 1]] as Array<[string, number, number]>).forEach((a) => {
      g.strokeStyle = a[0]
      g.beginPath()
      g.arc(780, H - 150, 62, a[1] * 6.283 - 1.57, a[2] * 6.283 - 1.57)
      g.stroke()
    })
    for (let r = 0; r < 3; r++) line(g, 872, H - 210 + r * 40, 100 - r * 18, "#c8d2f0", 12)
  }
  function mockAutomation(g: CanvasRenderingContext2D, W: number, H: number) {
    chromeBar(g, W, H, "#dff6ee")
    rrf(g, 26, 92, 420, H - 120, 24, "#f2fbf7")
    for (let i = 0; i < 6; i++) {
      const y = 114 + i * 74
      rrf(g, 46, y, 380, 58, 16, "#fff")
      line(g, 66, y + 14, 150, "#0e1b2c", 14)
      line(g, 66, y + 36, 100, "#c8d2f0", 10)
      rrf(g, 330, y + 14, 76, 30, 15, i % 3 === 1 ? "#ffe2bd" : "#c9f1de")
      rrf(g, i % 2 ? 340 : 362, y + 19, 20, 20, 10, i % 3 === 1 ? "#e8912d" : "#12a37f")
    }
    rr(g, 466, 92, W - 492, H - 120, 24)
    g.fillStyle = "#0e1b2c"
    g.fill()
    for (let j = 0; j < 11; j++) {
      const yy = 128 + j * 42
      g.fillStyle = ["#12a37f", "#6d8dff", "#e8912d", "#8da2c0"][j % 4]
      g.beginPath()
      g.arc(498, yy + 5, 6, 0, 7)
      g.fill()
      line(g, 516, yy, 120 + ((j * 83) % 220), "rgba(200,215,240,.7)", 10)
      line(g, 516 + 140 + ((j * 83) % 220), yy, 80 + ((j * 37) % 100), "rgba(120,150,200,.45)", 10)
    }
    rrf(g, W - 300, H - 96, 236, 50, 25, "#12a37f")
    line(g, W - 270, H - 76, 130, "#fff", 12)
  }
  function mockPortal(g: CanvasRenderingContext2D, W: number, H: number) {
    chromeBar(g, W, H, "#efe8ff")
    rrf(g, 26, 92, W - 52, 86, 24, "#f6f1ff")
    ;[0, 1, 2].forEach((i) => {
      g.beginPath()
      g.arc(76 + i * 46, 135, 24, 0, 7)
      g.fillStyle = ["#7a4fe0", "#a98bf5", "#c9b6fb"][i]
      g.fill()
      g.lineWidth = 4
      g.strokeStyle = "#fff"
      g.stroke()
    })
    line(g, 230, 118, 200, "#0e1b2c", 18)
    line(g, 230, 148, 140, "#c8d2f0", 12)
    rrf(g, W - 230, 112, 180, 44, 22, "#7a4fe0")
    rrf(g, 26, 198, 420, H - 226, 24, "#f9f7ff")
    for (let i = 0; i < 5; i++) {
      const y = 224 + i * 70
      rr(g, 50, y, 36, 36, 10)
      g.fillStyle = i < 3 ? "#7a4fe0" : "#fff"
      g.fill()
      g.lineWidth = 3
      g.strokeStyle = "#7a4fe0"
      g.stroke()
      if (i < 3) {
        g.strokeStyle = "#fff"
        g.lineWidth = 5
        g.beginPath()
        g.moveTo(58, y + 19)
        g.lineTo(66, y + 27)
        g.lineTo(79, y + 11)
        g.stroke()
      }
      line(g, 106, y + 6, 230 - (i % 3) * 30, "#0e1b2c", 14)
      line(g, 106, y + 26, 150, "#c8d2f0", 10)
    }
    for (let k = 0; k < 3; k++) {
      const x = 472 + k * 174
      rrf(g, x, 198, 160, 190, 22, "#f9f7ff")
      rrf(g, x + 46, 222, 68, 86, 10, "#fff")
      g.strokeStyle = "#a98bf5"
      g.lineWidth = 4
      g.stroke()
      line(g, x + 52, 246, 56, "#c9b6fb", 8)
      line(g, x + 52, 264, 40, "#c9b6fb", 8)
      line(g, x + 20, 336, 110, "#0e1b2c", 12)
      line(g, x + 20, 358, 70, "#c8d2f0", 10)
    }
    rrf(g, 472, H - 220, W - 498, 6, 3, "#e3dbf8")
    rrf(g, 472, H - 220, (W - 498) * 0.62, 6, 3, "#7a4fe0")
    for (let s = 0; s < 4; s++) {
      g.beginPath()
      g.arc(472 + (s * (W - 498)) / 3, H - 217, 12, 0, 7)
      g.fillStyle = s < 3 ? "#7a4fe0" : "#e3dbf8"
      g.fill()
    }
    rrf(g, 472, H - 170, W - 498, 120, 22, "#f9f7ff")
    line(g, 496, H - 146, 260, "#0e1b2c", 14)
    line(g, 496, H - 120, 380, "#c8d2f0", 10)
    line(g, 496, H - 98, 320, "#c8d2f0", 10)
  }
  function projectsScene(box: HTMLElement) {
    const cases = $$<HTMLElement>(".case")
    const kinds = [
      { c: "#3b5bdb", draw: mockPlatform },
      { c: "#12a37f", draw: mockAutomation },
      { c: "#7a4fe0", draw: mockPortal },
    ]
    const n = Math.max(1, cases.length)
    carousel(box, {
      mode: "flow",
      mid: Math.min(1, n - 1),
      start: Math.min(1, n - 1),
      auto: 4.2,
      dragK: 2.6,
      fov: 34,
      lift: 0.08,
      pop: 0.5,
      tex: { w: 1024, h: 682 },
      geo: { w: 2.2, h: 1.46, r: 0.16, depth: 0.09 },
      flow: { sp: 0.9, off: 1.65, depth: 1.25, ang: 0.7, act: 1.08, drop: 0 },
      camera: { pos: [0, 0.7, 8.4], look: [0, -0.1, 0] },
      narrowK: 1.3,
      items: cases.map((c, i) => {
        const k = kinds[i % 3]
        const label = (c.dataset.label || text(c.querySelector(".eyebrow-s"))).toUpperCase()
        return {
          color: k.c,
          draw: (g, W, H) => {
            k.draw(g, W, H)
            g.font = `800 26px ${FONT}`
            g.textAlign = "right"
            g.fillStyle = k.c
            g.fillText(label, W - 44, H - 26)
          },
        }
      }),
      decorate: floorGlow,
      onActive: (i) => cases.forEach((c, k) => c.classList.toggle("spot", k === i)),
      onActivate: (i) => scrollToEl(cases[i]),
    })
  }

  /* =========================================================
     PROCESS — helix of the delivery stages
     ========================================================= */
  const STAGE_ICONS = ["search", "blueprint", "blocks", "shield", "pulse"]
  function processScene(box: HTMLElement) {
    const keys = $$<HTMLElement>(".key")
    const N = keys.length
    const api = carousel(box, {
      mode: "helix",
      step: 0.95,
      R: 2.7,
      rise: 0.62,
      mid: Math.floor(N / 2),
      start: 0,
      auto: 3.6,
      tex: { w: 640, h: 640 },
      geo: { w: 1.7, h: 1.7, r: 0.26, depth: 0.12 },
      fov: 34,
      narrowK: 1.25,
      camera: { pos: [0, 1.7, 11.6], look: [0, 0.35, 0] },
      items: keys.map((k, i) => {
        const p = PAL[i % 5]
        const n = text(k.querySelector("b")) || String(i + 1).padStart(2, "0")
        const t = text(k.querySelector("strong"))
        const s = text(k.querySelector("span"))
        return {
          color: p[0],
          draw: (g, W, H) => {
            rr(g, 4, 4, W - 8, H - 8, 76)
            const gr = g.createLinearGradient(0, 0, W, H)
            gr.addColorStop(0, "#fff")
            gr.addColorStop(1, p[1])
            g.fillStyle = gr
            g.fill()
            g.font = `800 190px ${FONT}`
            g.textAlign = "right"
            g.fillStyle = "rgba(20,40,90,.06)"
            g.fillText(n, W - 40, 230)
            g.font = `800 34px ${FONT}`
            g.textAlign = "left"
            g.fillStyle = p[0]
            g.fillText(n, 56, 98)
            g.beginPath()
            g.arc(W / 2, 250, 92, 0, 7)
            g.fillStyle = p[1]
            g.fill()
            icon(g, STAGE_ICONS[i % 5], W / 2, 250, p[0])
            g.textAlign = "center"
            g.fillStyle = "#0a1317"
            g.font = `800 62px ${FONT}`
            g.fillText(t, W / 2, 452)
            g.fillStyle = "#536270"
            g.font = `600 32px ${FONT}`
            g.fillText(s, W / 2, 508)
            g.fillStyle = p[0]
            rr(g, W / 2 - 40, 548, 80, 9, 5)
            g.fill()
          },
        }
      }),
      decorate: ringDecor({ y: -1.12, grid: false }),
      onActive: (i) => keys.forEach((k, j) => k.setAttribute("aria-current", j === i ? "true" : "false")),
    })
    keys.forEach((k, i) => on(k, "click", () => api?.go(i, true)))
  }

  /* =========================================================
     BLOG — fanned article sheets (the latest posts on the page)
     ========================================================= */
  function blogScene(box: HTMLElement) {
    const arts = $$<HTMLElement>("[data-sheet-title]").slice(0, 5)
    if (!arts.length) {
      box.classList.add("noitems") // a search with no results: no empty glass box
      return
    }
    const n = arts.length
    carousel(box, {
      mode: "flow",
      mid: Math.floor(n / 2),
      start: Math.floor(n / 2),
      auto: 3.8,
      dragK: 3.2,
      fov: 34,
      lift: 0.1,
      pop: 0.45,
      tex: { w: 512, h: 688 },
      geo: { w: 1.6, h: 2.15, r: 0.12, depth: 0.05 },
      flow: { sp: 0.78, off: 1.05, depth: 0.55, ang: 0.5, act: 1.1, drop: 0.05 },
      camera: { pos: [0, 0.5, 8.4], look: [0, -0.1, 0] },
      narrowK: 1.2,
      items: arts.map((a, i) => {
        const p = PAL[i % 5]
        const cat = (a.dataset.sheetCat || "").toUpperCase()
        const title = a.dataset.sheetTitle || ""
        const date = a.dataset.sheetDate || ""
        return {
          color: p[0],
          draw: (g, W, H) => {
            rr(g, 4, 4, W - 8, H - 8, 40)
            g.fillStyle = "#fff"
            g.fill()
            g.save()
            rr(g, 4, 4, W - 8, H - 8, 40)
            g.clip()
            g.fillStyle = p[1]
            g.fillRect(0, 0, W, 210)
            g.restore()
            g.font = `800 22px ${FONT}`
            g.textAlign = "left"
            if (cat) {
              const tw = Math.min(W - 80, g.measureText(cat).width + 36)
              rrf(g, 36, 36, tw, 44, 22, p[0])
              g.fillStyle = "#fff"
              g.fillText(cat, 54, 66, W - 116)
            }
            g.font = `800 15px ${FONT}`
            g.fillStyle = p[0]
            g.fillText("CODETELEMETRYLAB", 40, 128)
            g.font = `800 38px ${FONT}`
            g.fillStyle = "#0a1317"
            const y = wrapText(g, title, 40, 176, W - 80, 48, 5)
            for (let k = 0; k < 4; k++) line(g, 40, y + 30 + k * 28, k === 3 ? 190 : W - 80 - (k % 2) * 30, "#e1e7f7", 12)
            g.font = `600 22px ${FONT}`
            g.fillStyle = "#6a7a8a"
            g.fillText(date, 40, H - 44)
            g.fillStyle = p[0]
            g.textAlign = "right"
            g.fillText("Read article →", W - 40, H - 44)
          },
        }
      }),
      decorate: floorGlow,
      onActivate: (i) => scrollToEl(arts[i]),
    })
  }

  /* =========================================================
     ABOUT — reactive block field: hover lifts the blocks, a tap sends a wave
     ========================================================= */
  function aboutScene(box: HTMLElement) {
    const canvas = box.querySelector<HTMLCanvasElement>(".cv3d")
    if (!canvas) return
    const st = stage(canvas, 38)
    box.classList.add("gl")
    const { scene, cam } = st
    const G = new THREE.Group()
    scene.add(G)
    st.onSize = (w, h) => {
      const k = w / h < 1.1 ? 1.3 : 1
      cam.position.set(0, 6 * k, 9.4 * k)
      cam.lookAt(0, 0.15, 0)
    }
    const n = 9
    const sp = 0.62
    const geo = new THREE.BoxGeometry(0.5, 1, 0.5)
    geo.translate(0, 0.5, 0)
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.08 }), n * n)
    G.add(im)
    const plate = new THREE.Mesh(new THREE.BoxGeometry(n * sp + 0.5, 0.14, n * sp + 0.5), new THREE.MeshStandardMaterial({ color: 0xd5defa, roughness: 0.7 }))
    plate.position.y = -0.09
    G.add(plate)
    const orbs = [0x2b4fe0, 0x12a37f, 0xe8912d, 0x7a4fe0].map((c) => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.2, flatShading: true }))
      G.add(m)
      return m
    })
    const dummy = new THREE.Object3D()
    const c1 = new THREE.Color(0x9fb3f5)
    const c2 = new THREE.Color(0x2b4fe0)
    const c3 = new THREE.Color(0x12a37f)
    const tmp = new THREE.Color()
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3(9, 0, 9)
    const waves: Array<{ x: number; z: number; t: number }> = []
    let yaw = 0.5
    let vy = 0
    let hasHit = false
    const aim = () => {
      ndc.set(ps.x, -ps.y)
      ray.setFromCamera(ndc, cam)
      hasHit = !!ray.ray.intersectPlane(plane, hit)
      if (hasHit) G.worldToLocal(hit)
    }
    const ps: Ptr = pointer(canvas, {
      onDrag: (dx) => {
        yaw += dx * 0.009
        vy = dx * 0.009
      },
      onClick: () => {
        aim()
        waves.push({ x: hit.x, z: hit.z, t: performance.now() })
      },
    })
    sizeNow(st)
    watch(canvas, {
      on: false,
      fn(t) {
        if (!ps.drag) {
          if (Math.abs(vy) > 0.0004) {
            yaw += vy
            vy *= 0.95
          } else if (!reduce) yaw += 0.0028
        }
        G.rotation.y = yaw
        aim()
        const hv = ps.hover && hasHit
        for (let ix = 0; ix < n; ix++)
          for (let iz = 0; iz < n; iz++) {
            const x = (ix - (n - 1) / 2) * sp
            const z = (iz - (n - 1) / 2) * sp
            const d = Math.hypot(x - hit.x, z - hit.z)
            let h = 0.22 + 0.11 * (1 + Math.sin(t * 0.0011 + ix * 0.6 + iz * 0.45)) + (hv ? Math.exp(-d * d * 1.5) * 1.15 : 0)
            for (const w of waves) {
              const a = (t - w.t) / 1000
              const dd = Math.hypot(x - w.x, z - w.z) - a * 2.6
              h += Math.exp(-dd * dd * 5) * 0.95 * Math.max(0, 1 - a / 2.2)
            }
            dummy.position.set(x, 0, z)
            dummy.scale.set(1, h, 1)
            dummy.updateMatrix()
            const k = ix * n + iz
            im.setMatrixAt(k, dummy.matrix)
            tmp.copy(c1).lerp(c2, clamp((h - 0.25) / 1.1, 0, 1))
            if ((ix * 7 + iz * 3) % 11 === 0) tmp.lerp(c3, 0.55)
            im.setColorAt(k, tmp)
          }
        im.instanceMatrix.needsUpdate = true
        if (im.instanceColor) im.instanceColor.needsUpdate = true
        while (waves.length && t - waves[0].t > 2400) waves.shift()
        orbs.forEach((orb, i) => {
          const a = t * 0.0006 + (i * Math.PI) / 2
          orb.position.set(Math.cos(a) * 3.5, 1.5 + Math.sin(t * 0.002 + i) * 0.25, Math.sin(a) * 3.5)
          orb.rotation.x = t * 0.001
          orb.rotation.y = t * 0.0013
        })
        st.r.render(scene, cam)
      },
    })
  }

  /* =========================================================
     CAREERS — globe: the team in Jaipur, clients in the US and Canada
     ========================================================= */
  const LAND: Array<Array<[number, number]>> = [
    [[-168, 66], [-140, 70], [-95, 72], [-80, 68], [-62, 60], [-55, 50], [-67, 44], [-76, 35], [-81, 25], [-97, 26], [-105, 22], [-117, 32], [-125, 42], [-130, 55], [-150, 60]],
    [[-97, 26], [-88, 21], [-80, 9], [-77, 8], [-80, 0], [-81, -6], [-71, -18], [-72, -40], [-74, -52], [-66, -55], [-58, -38], [-48, -26], [-35, -8], [-50, 2], [-62, 10], [-77, 12], [-87, 15]],
    [[-10, 36], [-9, 44], [-5, 48], [3, 51], [8, 55], [10, 58], [22, 66], [30, 70], [40, 68], [40, 56], [30, 46], [28, 41], [22, 37], [12, 38], [5, 43]],
    [[-17, 21], [-10, 35], [10, 37], [33, 31], [43, 12], [51, 12], [40, -2], [40, -15], [33, -26], [20, -35], [12, -18], [9, -1], [-9, 5], [-17, 14]],
    [[28, 41], [40, 56], [40, 68], [70, 73], [110, 77], [140, 72], [180, 68], [165, 60], [142, 50], [130, 42], [122, 30], [110, 20], [106, 10], [100, 2], [98, 15], [90, 22], [80, 10], [77, 8], [72, 20], [67, 25], [57, 25], [51, 26], [44, 12], [35, 30]],
    [[114, -22], [122, -18], [136, -12], [142, -11], [146, -19], [153, -27], [150, -37], [140, -38], [130, -32], [115, -34]],
  ]
  const inPoly = (lon: number, lat: number, p: Array<[number, number]>) => {
    let c = false
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i]
      const [xj, yj] = p[j]
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c
    }
    return c
  }
  function careersScene(box: HTMLElement) {
    const canvas = box.querySelector<HTMLCanvasElement>(".cv3d")
    if (!canvas) return
    const st = stage(canvas, 34)
    box.classList.add("gl")
    const { scene, cam } = st
    const R = 2.2
    const G = new THREE.Group()
    scene.add(G)
    st.onSize = (w, h) => {
      const k = w / h < 1.1 ? 1.25 : 1
      cam.position.set(0, 0.2, 8.4 * k)
      cam.lookAt(0, 0, 0)
    }
    G.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 48, 32), new THREE.MeshStandardMaterial({ color: 0xeef2ff, roughness: 0.9 })))
    G.add(new THREE.Mesh(new THREE.SphereGeometry(R, 30, 20), new THREE.MeshBasicMaterial({ color: 0x9fb4ff, wireframe: true, transparent: true, opacity: 0.13 })))
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 32, 24), new THREE.MeshBasicMaterial({ color: 0x9db6ff, transparent: true, opacity: 0.11, side: THREE.BackSide })))
    const ll = (lat: number, lon: number, r: number) => {
      const ph = ((90 - lat) * Math.PI) / 180
      const th = ((lon + 180) * Math.PI) / 180
      return new THREE.Vector3(-r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th))
    }
    const dot = document.createElement("canvas")
    dot.width = dot.height = 32
    const dg = dot.getContext("2d") as CanvasRenderingContext2D
    dg.beginPath()
    dg.arc(16, 16, 14, 0, 7)
    dg.fillStyle = "#fff"
    dg.fill()
    const pos: number[] = []
    const M = coarse ? 3800 : 6200
    const ga = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < M; i++) {
      const y = 1 - (2 * (i + 0.5)) / M
      const rad = Math.sqrt(1 - y * y)
      const th = ga * i
      const lat = (Math.asin(y) * 180) / Math.PI
      const lon = ((((Math.atan2(Math.sin(th) * rad, Math.cos(th) * rad) * 180) / Math.PI + 180) % 360) - 180)
      for (const poly of LAND)
        if (inPoly(lon, lat, poly)) {
          const v = ll(lat, lon, R * 1.004)
          pos.push(v.x, v.y, v.z)
          break
        }
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
    G.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.052, color: 0x2b4fe0, map: canvasTex(dot, false), transparent: true, alphaTest: 0.3, depthWrite: false })))
    const label = (txt: string) => {
      const c = document.createElement("canvas")
      c.width = 300
      c.height = 80
      const g = c.getContext("2d") as CanvasRenderingContext2D
      rr(g, 6, 10, 288, 60, 30)
      g.fillStyle = "rgba(255,255,255,.94)"
      g.fill()
      g.lineWidth = 2
      g.strokeStyle = "rgba(20,40,90,.14)"
      g.stroke()
      g.font = `800 30px ${FONT}`
      g.fillStyle = "#0a1317"
      g.textAlign = "center"
      g.textBaseline = "middle"
      g.fillText(txt, 150, 41)
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(c), transparent: true }))
      s.scale.set(1.0, 0.27, 1)
      return s
    }
    const places = [
      { n: "Jaipur", lat: 26.9, lon: 75.8, c: 0xe8912d, big: true },
      { n: "United States", lat: 39, lon: -98, c: 0x2b4fe0, big: false },
      { n: "Canada", lat: 52, lon: -96, c: 0x2b4fe0, big: false },
    ]
    const pins: THREE.Mesh[] = []
    places.forEach((pl) => {
      const p = ll(pl.lat, pl.lon, R)
      const m = new THREE.Mesh(new THREE.SphereGeometry(pl.big ? 0.075 : 0.055, 16, 16), new THREE.MeshBasicMaterial({ color: pl.c }))
      m.position.copy(p).multiplyScalar(1.01)
      G.add(m)
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.115, 40), new THREE.MeshBasicMaterial({ color: pl.c, transparent: true, opacity: 0.7, side: THREE.DoubleSide }))
      ring.position.copy(p).multiplyScalar(1.012)
      ring.lookAt(p.clone().multiplyScalar(3))
      G.add(ring)
      const lb = label(pl.n)
      lb.position.copy(p).multiplyScalar(1.17)
      G.add(lb)
      pins.push(ring)
    })
    const jp = ll(26.9, 75.8, R)
    const packets: Array<{ m: THREE.Mesh; cv: THREE.CatmullRomCurve3; o: number }> = []
    ;[[37.8, -122.4], [40.7, -74], [43.7, -79.4]].forEach((d, k) => {
      const b = ll(d[0], d[1], R)
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 40; i++) {
        const u = i / 40
        pts.push(jp.clone().normalize().lerp(b.clone().normalize(), u).normalize().multiplyScalar(R * (1.004 + 0.3 * Math.sin(Math.PI * u))))
      }
      const cv = new THREE.CatmullRomCurve3(pts)
      G.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 60, 0.013, 6, false), new THREE.MeshBasicMaterial({ color: 0x2b4fe0, transparent: true, opacity: 0.7 })))
      const pk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0xe8912d }))
      G.add(pk)
      packets.push({ m: pk, cv, o: k / 3 })
    })
    const FOCI = places.map((p) => ({ lat: p.lat, lon: p.lon }))
    let foc = 0
    let rotY = 0
    let rotX = 0.2
    let vy = 0
    let idle = 0
    let free = false
    const dots = Array.from(box.querySelectorAll<HTMLButtonElement>(".flow-dots button"))
    const tgtY = (f: { lon: number }) => Math.PI / 2 - ((f.lon + 180) * Math.PI) / 180
    const setFoc = (i: number, user = false) => {
      foc = i
      free = false
      idle = 0
      if (user) box.classList.add("touched")
      dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"))
    }
    dots.forEach((d, i) => on(d, "click", () => setFoc(i, true)))
    setFoc(0)
    rotY = tgtY(FOCI[0]) + 0.9
    const ps = pointer(canvas, {
      onDrag: (dx, dy) => {
        box.classList.add("touched")
        free = true
        idle = 0
        rotY += dx * 0.008
        vy = dx * 0.008
        rotX = clamp(rotX + dy * 0.006, -0.8, 0.9)
      },
    })
    let t0 = 0
    sizeNow(st)
    watch(canvas, {
      on: false,
      fn(t) {
        const dt = Math.min(0.05, (t - t0) / 1000 || 0.016)
        t0 = t
        if (!ps.drag) {
          if (free) {
            rotY += vy + 0.0016
            vy *= 0.94
            idle += dt
            if (idle > 4) setFoc((foc + 1) % 3)
          } else {
            const f = FOCI[foc]
            const ty = tgtY(f)
            const d = ((((ty - rotY + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
            rotY += d * Math.min(1, dt * 3)
            rotX += (((f.lat * Math.PI) / 180) * 0.55 - rotX) * Math.min(1, dt * 3)
            if (!reduce) {
              idle += dt
              if (idle > 3.8) setFoc((foc + 1) % 3)
            }
          }
        }
        G.rotation.y = rotY
        G.rotation.x = rotX
        pins.forEach((r, i) => {
          const ph = (t * 0.0018 + i * 0.8) % 1.6
          const s = 1 + ph
          r.scale.set(s, s, s)
          ;(r.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - ph / 1.6))
        })
        packets.forEach((p) => p.m.position.copy(p.cv.getPointAt((t * 0.00016 + p.o) % 1)))
        st.r.render(scene, cam)
      },
    })
  }

  /* =========================================================
     Background: soft shapes that drift and turn with the scroll position
     ========================================================= */
  function background() {
    let r: THREE.WebGLRenderer
    try {
      r = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: !coarse, alpha: true, powerPreference: "low-power" })
    } catch {
      return // decoration only
    }
    renderers.push(r)
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2))
    const scene = new THREE.Scene()
    scenes.push(scene)
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    cam.position.z = 14
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const dl = new THREE.DirectionalLight(0xffffff, 0.9)
    dl.position.set(4, 8, 6)
    scene.add(dl)
    const pl = new THREE.PointLight(0x5b7cff, 1.1, 50)
    pl.position.set(-6, 2, 6)
    scene.add(pl)
    const geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.8, 0.28, 16, 40),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      new THREE.TorusKnotGeometry(0.6, 0.2, 90, 12),
      new THREE.SphereGeometry(0.75, 24, 16),
      new THREE.ConeGeometry(0.9, 1.6, 5),
    ]
    const cols = [0x7f9bff, 0xa9c1ff, 0x9be3d0, 0xffd2a8, 0xc7b8ff, 0x8fd0ff]
    const N = coarse ? 10 : 18
    const H = 40
    const items: Array<{ m: THREE.Mesh; sp: number; ph: number; y: number }> = []
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.35, metalness: 0.12, transparent: true, opacity: 0.34, flatShading: true }))
      const side = i % 2 ? 1 : -1
      m.position.set(side * (5.2 + Math.random() * 5.5), -(i / N) * H - Math.random() * 2, -2 - Math.random() * 9)
      m.scale.setScalar(0.55 + Math.random() * 1.1)
      m.rotation.set(Math.random() * 6, Math.random() * 6, 0)
      scene.add(m)
      items.push({ m, sp: 0.12 + Math.random() * 0.3, ph: Math.random() * 6, y: m.position.y })
    }
    let px = 0
    let last = window.scrollY
    let spin = 0
    let W = 0
    let Hh = 0
    on(window, "pointermove", (e: PointerEvent) => (px = (e.clientX / window.innerWidth) * 2 - 1), { passive: true })
    const size = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w === W && Math.abs(h - Hh) < 160) return
      W = w
      Hh = h
      r.setSize(w, h, false)
      cam.aspect = w / h
      cam.updateProjectionMatrix()
    }
    size()
    on(window, "resize", size)
    const loop: Loop = {
      on: !document.hidden,
      fn(t) {
        const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const prog = Math.min(1, window.scrollY / maxS)
        const dS = window.scrollY - last
        last = window.scrollY
        spin += (Math.abs(dS) * 0.0009 - spin) * 0.1
        cam.position.y += (-(prog * (H - 8)) - cam.position.y) * 0.08
        cam.position.x += (px * 1.4 - cam.position.x) * 0.05
        cam.lookAt(cam.position.x * 0.3, cam.position.y, 0)
        for (const it of items) {
          it.m.rotation.x += 0.0022 * it.sp * 10 + spin
          it.m.rotation.y += 0.0031 * it.sp * 10 + spin * 0.7
          it.m.position.y = it.y + Math.sin(t * 0.0006 * it.sp * 4 + it.ph) * 0.35
        }
        r.render(scene, cam)
      },
    }
    loops.push(loop)
    on(document, "visibilitychange", () => (loop.on = !document.hidden))
    bgCanvas.dataset.live = "1"
  }

  /* ---------------- boot ---------------- */
  const SCENES: Record<string, (box: HTMLElement) => void> = {
    services: servicesScene,
    projects: projectsScene,
    process: processScene,
    blog: blogScene,
    about: aboutScene,
    careers: careersScene,
  }
  const idle = () =>
    new Promise<void>((resolve) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 600 })
      else window.setTimeout(resolve, 0)
    })
  const fontReady =
    document.fonts && document.fonts.load
      ? Promise.race([document.fonts.load(`800 46px ${FONT}`), new Promise((res) => setTimeout(res, 1800))]).catch(() => undefined)
      : Promise.resolve()

  void (async () => {
    try {
      await fontReady
      if (destroyed) return
      const boxes = $$<HTMLElement>("[data-scene]")
      for (const box of boxes) {
        const fn = SCENES[box.dataset.scene || ""]
        if (!fn) continue
        fn(box)
        if (destroyed) return
        await idle()
        if (destroyed) return
      }
      ready() // pages without a scene box still get the background
      await idle()
      if (destroyed) return
      background()
      try {
        performance.mark("s3d:ready")
      } catch {
        /* optional */
      }
    } catch (error) {
      if (!destroyed) o.onFail?.(error)
    }
  })()

  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      cancelAnimationFrame(raf)
      cleanups.splice(0).forEach((fn) => fn())
      scenes.forEach((s) =>
        s.traverse((obj: any) => {
          obj.geometry?.dispose?.()
          const ms = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []
          ms.forEach((m: any) => {
            m.map?.dispose?.()
            m.dispose?.()
          })
        }),
      )
      loose.splice(0).forEach((d) => d.dispose())
      renderers.splice(0).forEach((r) => {
        r.dispose()
        r.forceContextLoss()
      })
    },
  }
}
