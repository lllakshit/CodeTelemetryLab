/**
 * 3D for the contact page: a slow drifting background and the interactive "inquiry flow" carousel.
 *
 * The page text, the form and every link live in the server-rendered HTML. This module only draws on two canvases
 * and reads the five step names from the markup; it never adds or removes content. It is loaded on demand after the
 * page has painted (see contact-3d.tsx).
 *
 * Ported from the approved prototype ("CodeTelemetryLab — 3D Contact Page Prototype"), with:
 *  - a mount/destroy lifecycle (listeners, observers and GPU resources are released on unmount)
 *  - the page font used for the card textures instead of a hard-coded one
 *  - the background started only once the carousel has drawn and the browser is idle (the carousel is what the visitor sees first)
 *  - touch drags that rotate the carousel while vertical swipes still scroll the page
 */
import * as THREE from "three"

export type ContactSceneOptions = {
  /** The page wrapper (`.c3d`). The carousel markup is looked up inside it. */
  root: HTMLElement
  /** Fixed full-screen canvas behind the page. */
  bgCanvas: HTMLCanvasElement
  /** CSS font-family string of the page, used for the card textures. */
  fontFamily: string
  /** Called once the carousel has drawn its first frame. */
  onReady?: () => void
  /** Called if setup fails; the page falls back to its plain layout. */
  onFail?: (error: unknown) => void
}

export type ContactSceneHandle = { destroy: () => void }

type Loop = { on: boolean; fn: (t: number) => void }
type Disposable = { dispose: () => void }

const STEPS = [
  { n: "01", c: "#3b5bdb", tint: "#e4eaff", ico: "doc" },
  { n: "02", c: "#12a37f", tint: "#dcf6ee", ico: "check" },
  { n: "03", c: "#e8912d", tint: "#fdebd6", ico: "chat" },
  { n: "04", c: "#7a4fe0", tint: "#ece4ff", ico: "dollar" },
  { n: "05", c: "#1fa65a", tint: "#dcf5e6", ico: "rocket" },
] as const

/** Two-line titles drawn on each card. Taken from the markup when it has five steps, so the text stays in one place. */
const FALLBACK_TITLES: Array<[string, string]> = [
  ["Submit", "Inquiry"],
  ["We Review", "& Understand"],
  ["Discovery", "Call"],
  ["Proposal", "& Timeline"],
  ["Kickoff &", "Execution"],
]

function splitTitle(text: string, fallback: [string, string]): [string, string] {
  const words = text.trim().split(/\s+/)
  if (words.length < 2) return fallback
  // Break after the first word, or after "&" when the title starts with it ("Kickoff & Execution" -> "Kickoff &" / "Execution").
  let cut = 1
  if (words.length > 2 && words[1] === "&" && words[0].toLowerCase() === "kickoff") cut = 2
  else if (words.length > 3) cut = 2
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")]
}

export function mountContactScene(o: ContactSceneOptions): ContactSceneHandle {
  const { root, bgCanvas, fontFamily } = o
  const flowBox = root.querySelector<HTMLElement>("#c-flow")
  const flowCanvas = root.querySelector<HTMLCanvasElement>("#c-flow-canvas")
  if (!flowBox || !flowCanvas) throw new Error("contact flow markup is missing")

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches

  let destroyed = false
  const cleanups: Array<() => void> = []
  const disposables: Disposable[] = []
  const track = <T extends Disposable>(d: T): T => {
    disposables.push(d)
    return d
  }
  const on = (t: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn, opts)
    cleanups.push(() => t.removeEventListener(type, fn, opts))
  }
  const mark = (name: string) => {
    try {
      performance.mark(name)
    } catch {
      /* optional */
    }
  }

  /* ---------- shared render loop ---------- */
  const loops: Loop[] = []
  let raf = 0
  const tick = (t: number) => {
    if (destroyed) return
    raf = requestAnimationFrame(tick)
    for (const l of loops) if (l.on) l.fn(t)
  }
  raf = requestAnimationFrame(tick)
  const watch = (el: Element, loop: Loop) => {
    if (typeof IntersectionObserver === "undefined") {
      loop.on = true
      return
    }
    const io = new IntersectionObserver((es) => {
      loop.on = es[0].isIntersecting && !document.hidden
    }, { rootMargin: "120px" })
    io.observe(el)
    cleanups.push(() => io.disconnect())
  }

  let drawnResolve: () => void = () => {}
  const carouselDrawn = new Promise<void>((resolve) => {
    drawnResolve = resolve
  })
  cleanups.push(() => drawnResolve())

  /* ====================================================================================================
     Inquiry flow: five cards on a ring, drag or tap to turn
     ==================================================================================================== */
  function mountFlow(): void {
    const canvas = flowCanvas as HTMLCanvasElement
    const box = flowBox as HTMLElement
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    track({ dispose: () => { renderer.dispose(); renderer.forceContextLoss() } })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 2 : 2))
    renderer.outputEncoding = THREE.sRGBEncoding

    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(36, 1.3, 0.1, 60)
    scene.add(new THREE.AmbientLight(0xffffff, 0.95))
    const dl = new THREE.DirectionalLight(0xffffff, 0.8)
    dl.position.set(3, 6, 7)
    scene.add(dl)

    const stepEls = Array.from(box.querySelectorAll<HTMLElement>(".c-flow-steps li"))
    const titles = STEPS.map((_, i) => splitTitle(stepEls[i]?.textContent ?? "", FALLBACK_TITLES[i]))

    const STEP = 0.62
    const R = 3.3
    const Y = -1.28
    const group = new THREE.Group()
    scene.add(group)

    const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number) => {
      g.beginPath()
      g.moveTo(x + rad, y)
      g.arcTo(x + w, y, x + w, y + h, rad)
      g.arcTo(x + w, y + h, x, y + h, rad)
      g.arcTo(x, y + h, x, y, rad)
      g.arcTo(x, y, x + w, y, rad)
      g.closePath()
    }

    function icon(g: CanvasRenderingContext2D, k: string, cx: number, cy: number, col: string) {
      g.strokeStyle = col
      g.fillStyle = col
      g.lineWidth = 9
      g.lineCap = "round"
      g.lineJoin = "round"
      if (k === "doc") {
        rr(g, cx - 38, cy - 50, 76, 100, 12)
        g.stroke()
        g.beginPath()
        g.moveTo(cx - 20, cy - 18)
        g.lineTo(cx + 20, cy - 18)
        g.moveTo(cx - 20, cy + 4)
        g.lineTo(cx + 20, cy + 4)
        g.moveTo(cx - 20, cy + 26)
        g.lineTo(cx + 4, cy + 26)
        g.stroke()
      }
      if (k === "check") {
        rr(g, cx - 40, cy - 48, 80, 100, 12)
        g.stroke()
        g.beginPath()
        g.moveTo(cx - 20, cy - 4)
        g.lineTo(cx - 8, cy + 10)
        g.lineTo(cx + 20, cy - 20)
        g.stroke()
        g.beginPath()
        g.moveTo(cx - 20, cy + 30)
        g.lineTo(cx + 20, cy + 30)
        g.stroke()
      }
      if (k === "chat") {
        rr(g, cx - 52, cy - 46, 70, 52, 14)
        g.stroke()
        rr(g, cx - 8, cy - 6, 62, 46, 13)
        g.fillStyle = col
        g.globalAlpha = 0.9
        g.fill()
        g.globalAlpha = 1
      }
      if (k === "dollar") {
        rr(g, cx - 38, cy - 50, 76, 100, 12)
        g.stroke()
        g.font = `800 62px ${fontFamily}`
        g.textAlign = "center"
        g.textBaseline = "middle"
        g.fillText("$", cx, cy + 4)
        g.textBaseline = "alphabetic"
      }
      if (k === "rocket") {
        g.save()
        g.translate(cx, cy)
        g.rotate(Math.PI / 4)
        g.beginPath()
        g.moveTo(0, -56)
        g.quadraticCurveTo(30, -26, 24, 22)
        g.lineTo(-24, 22)
        g.quadraticCurveTo(-30, -26, 0, -56)
        g.closePath()
        g.stroke()
        g.beginPath()
        g.arc(0, -14, 9, 0, 7)
        g.stroke()
        g.beginPath()
        g.moveTo(-24, 12)
        g.lineTo(-42, 34)
        g.lineTo(-24, 28)
        g.moveTo(24, 12)
        g.lineTo(42, 34)
        g.lineTo(24, 28)
        g.stroke()
        g.beginPath()
        g.moveTo(0, 34)
        g.lineTo(0, 52)
        g.stroke()
        g.restore()
      }
    }

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    function tex(s: (typeof STEPS)[number], idx: number, title: [string, string]) {
      const W = 512
      const H = 672
      const c = document.createElement("canvas")
      c.width = W
      c.height = H
      const g = c.getContext("2d") as CanvasRenderingContext2D
      rr(g, 4, 4, W - 8, H - 8, 58)
      const gr = g.createLinearGradient(0, 0, 0, H)
      gr.addColorStop(0, "#ffffff")
      gr.addColorStop(0.55, "#fbfcff")
      gr.addColorStop(1, s.tint)
      g.fillStyle = gr
      g.fill()
      g.font = `800 30px ${fontFamily}`
      g.fillStyle = s.c
      g.textAlign = "left"
      g.fillText(s.n, 46, 84)
      g.fillStyle = "rgba(20,40,90,.10)"
      g.fillRect(46, 104, W - 92, 2)
      g.beginPath()
      g.arc(W / 2, 262, 112, 0, 7)
      g.fillStyle = s.tint
      g.fill()
      g.lineWidth = 3
      g.strokeStyle = "rgba(255,255,255,.9)"
      g.stroke()
      icon(g, s.ico, W / 2, 262, s.c)
      g.textAlign = "center"
      g.fillStyle = "#0a1317"
      g.font = `800 46px ${fontFamily}`
      g.fillText(title[0], W / 2, 452)
      g.fillText(title[1], W / 2, 508)
      g.fillStyle = s.c
      rr(g, W / 2 - 34, 540, 68, 8, 4)
      g.fill()
      for (let i = 0; i < 5; i++) {
        g.beginPath()
        g.arc(W / 2 - 48 + i * 24, 598, i === idx ? 7 : 5, 0, 7)
        g.fillStyle = i === idx ? s.c : "rgba(20,40,90,.18)"
        g.fill()
      }
      const tx = track(new THREE.CanvasTexture(c))
      tx.anisotropy = maxAniso
      tx.encoding = THREE.sRGBEncoding
      return tx
    }

    function shape(w: number, h: number, rad: number) {
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

    type Card = {
      g: THREE.Group
      ped: THREE.Mesh
      ring: THREE.Mesh
    }
    const cards: Card[] = []
    const fronts: THREE.Mesh[] = []
    const pts: THREE.Vector3[] = []
    const packets: THREE.Mesh[] = []
    const pathCurve: { c: THREE.CatmullRomCurve3 | null } = { c: null }

    const bodyGeo = track(
      new THREE.ExtrudeGeometry(shape(1.5, 1.96, 0.21), {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 10,
      }),
    )
    bodyGeo.translate(0, 0, -0.05)
    const planeGeo = track(new THREE.PlaneGeometry(1.45, 1.9))
    const pedGeo = track(new THREE.CylinderGeometry(0.72, 0.8, 0.06, 56))
    const ringGeo = track(new THREE.TorusGeometry(0.74, 0.018, 8, 72))

    function build() {
      STEPS.forEach((s, i) => {
        const th = (i - 2) * STEP
        const g = new THREE.Group()
        const body = new THREE.Mesh(bodyGeo, track(new THREE.MeshStandardMaterial({ color: s.c, roughness: 0.45, metalness: 0.12 })))
        const front = new THREE.Mesh(planeGeo, track(new THREE.MeshBasicMaterial({ map: tex(s, i, titles[i]), transparent: true })))
        front.position.z = 0.078
        front.userData.i = i
        g.add(body)
        g.add(front)
        const wrap = new THREE.Group()
        wrap.add(g)
        wrap.position.set(Math.sin(th) * R, 0, Math.cos(th) * R)
        wrap.rotation.y = th
        const ped = new THREE.Mesh(
          pedGeo,
          track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: new THREE.Color(s.c), emissiveIntensity: 0.08 })),
        )
        ped.position.set(Math.sin(th) * R, Y, Math.cos(th) * R)
        const ring = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: new THREE.Color(s.c), transparent: true, opacity: 0.45 })))
        ring.rotation.x = Math.PI / 2
        ring.position.copy(ped.position)
        ring.position.y += 0.035
        group.add(wrap)
        group.add(ped)
        group.add(ring)
        cards.push({ g, ped, ring })
        fronts.push(front)
        pts.push(new THREE.Vector3(ped.position.x, Y + 0.04, ped.position.z))
      })
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5)
      pathCurve.c = curve
      group.add(new THREE.Mesh(track(new THREE.TubeGeometry(curve, 120, 0.03, 8, false)), track(new THREE.MeshBasicMaterial({ color: 0x6d8dff, transparent: true, opacity: 0.75 }))))
      const grid = new THREE.PolarGridHelper(4.6, 16, 6, 64, 0x9fb4ff, 0xd2dcff)
      grid.position.y = Y - 0.03
      const gm = grid.material as THREE.Material
      gm.transparent = true
      gm.opacity = 0.5
      track(grid.geometry)
      track(gm)
      group.add(grid)
      const pGeo = track(new THREE.SphereGeometry(0.06, 12, 12))
      const pMat = track(new THREE.MeshBasicMaterial({ color: 0x2b4fe0 }))
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Mesh(pGeo, pMat)
        p.userData = { o: k / 3 }
        group.add(p)
        packets.push(p)
      }
    }

    let rot = 0
    let target = 0
    let vel = 0
    let active = 2
    let hover = -1
    let drag = false
    let moved = 0
    let lastX = 0
    let idleT = 0
    let hoverOn = false
    const ptr = { x: 0, y: 0 }
    const dots = Array.from(box.querySelectorAll<HTMLButtonElement>(".c-flow-dots button"))
    const angFor = (i: number) => -(i - 2) * STEP
    const setActive = (i: number) => {
      active = i
      dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"))
    }
    const go = (i: number, user = false) => {
      target = angFor(i)
      setActive(i)
      if (user) {
        idleT = 0
        box.classList.add("touched")
      }
    }
    dots.forEach((d, i) => on(d, "click", () => go(i, true)))
    setActive(2)

    function size() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      cam.aspect = w / h
      const k = w / h < 1.1 ? 1.22 : 1
      cam.position.set(0, 1.2 * k, 9.1 * k)
      cam.lookAt(0, -0.15, 0)
      cam.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    cleanups.push(() => ro.disconnect())

    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    function pick(e: PointerEvent) {
      const b = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, cam)
      const h = ray.intersectObjects(fronts)
      return h.length ? (h[0].object.userData.i as number) : -1
    }
    on(canvas, "pointerdown", (e: PointerEvent) => {
      drag = true
      moved = 0
      lastX = e.clientX
      vel = 0
      idleT = 0
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* not capturable */
      }
    })
    on(canvas, "pointermove", (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      ptr.x = ((e.clientX - b.left) / b.width) * 2 - 1
      ptr.y = ((e.clientY - b.top) / b.height) * 2 - 1
      if (drag) {
        const dx = e.clientX - lastX
        lastX = e.clientX
        moved += Math.abs(dx)
        if (moved > 4) {
          canvas.classList.add("drag")
          box.classList.add("touched")
        }
        const lim = STEP * 2 + 0.35
        let d = (dx / b.width) * 2.6
        if (Math.abs(rot) > STEP * 2) d *= 0.35
        rot = Math.max(-lim, Math.min(lim, rot + d))
        target = rot
        vel = d
      } else if (e.pointerType === "mouse") {
        hover = pick(e)
        canvas.style.cursor = hover >= 0 ? "pointer" : "grab"
      }
    })
    const up = (e: PointerEvent) => {
      if (!drag) return
      drag = false
      canvas.classList.remove("drag")
      if (moved < 6) {
        const i = pick(e)
        if (i >= 0) go(i, true)
      } else {
        const k = Math.max(0, Math.min(4, Math.round(-(rot + vel * 8) / STEP) + 2))
        go(k, true)
      }
    }
    on(canvas, "pointerup", up)
    on(canvas, "pointercancel", () => {
      drag = false
      canvas.classList.remove("drag")
      go(active)
    })
    on(canvas, "pointerenter", () => {
      hoverOn = true
    })
    on(canvas, "pointerleave", () => {
      hoverOn = false
      hover = -1
      ptr.x = ptr.y = 0
    })
    // Keyboard: the dots are real buttons; arrow keys on the canvas step through as well.
    canvas.tabIndex = 0
    on(canvas, "keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(Math.min(4, active + 1), true)
      else if (e.key === "ArrowLeft") go(Math.max(0, active - 1), true)
      else return
      e.preventDefault()
    })

    let t0 = 0
    let first = true
    const loop: Loop = {
      on: false,
      fn(t) {
        const dt = Math.min(0.05, (t - t0) / 1000 || 0.016)
        t0 = t
        if (!drag) rot += (target - rot) * Math.min(1, dt * 7)
        if (!reduce && !drag && !hoverOn) {
          idleT += dt
          if (idleT > 3.4) {
            idleT = 0
            go((active + 1) % 5)
          }
        }
        group.rotation.y = rot
        group.rotation.x += (ptr.y * 0.07 - group.rotation.x) * 0.08
        group.position.x += (ptr.x * -0.18 - group.position.x) * 0.06
        for (let i = 0; i < cards.length; i++) {
          const c = cards[i]
          const a = i === active
          const h = i === hover
          const s = a ? 1.1 : h ? 1.04 : 0.95
          c.g.scale.x += (s - c.g.scale.x) * 0.12
          c.g.scale.y = c.g.scale.z = c.g.scale.x
          c.g.position.y += ((a ? 0.12 : 0) + Math.sin(t * 0.0014 + i * 1.3) * 0.04 - c.g.position.y) * 0.1
          c.g.position.z += ((a ? 0.35 : 0) - c.g.position.z) * 0.1
          const rm = c.ring.material as THREE.MeshBasicMaterial
          rm.opacity += ((a ? 1 : 0.35) - rm.opacity) * 0.12
          c.ring.scale.x = c.ring.scale.y = c.ring.scale.z = 1 + (a ? 0.07 * Math.sin(t * 0.004) : 0)
          const pm = c.ped.material as THREE.MeshStandardMaterial
          pm.emissiveIntensity += ((a ? 0.55 : 0.08) - pm.emissiveIntensity) * 0.12
        }
        const curve = pathCurve.c
        if (curve) {
          for (let j = 0; j < packets.length; j++) {
            const p = packets[j]
            const u = (t * 0.00007 + (p.userData.o as number)) % 1
            p.position.copy(curve.getPointAt(u))
            p.position.y += 0.05
          }
        }
        renderer.render(scene, cam)
        if (first) {
          first = false
          mark("c3d:first-frame")
          drawnResolve()
          o.onReady?.()
        }
      },
    }

    const fontReady =
      document.fonts && document.fonts.load
        ? Promise.race([document.fonts.load(`800 46px ${fontFamily}`), new Promise((res) => setTimeout(res, 1800))])
        : Promise.resolve()
    fontReady
      .catch(() => undefined)
      .then(() => {
        if (destroyed) return
        build()
        size()
        loops.push(loop)
        watch(canvas, loop)
        // Draw one frame even when the carousel is off screen (a restored scroll position, a #brief link, the page
        // reopened after a send), so the page leaves its "pending" state and the first scroll up finds the scene ready.
        loop.fn(performance.now())
      })
      .catch((error) => {
        if (!destroyed) o.onFail?.(error)
      })
  }

  /* ====================================================================================================
     Background: soft shapes that drift and shift with the scroll position
     ==================================================================================================== */
  function mountBackground(): void {
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: !coarse, alpha: true, powerPreference: "low-power" })
    } catch {
      return // decoration only: the page is complete without it
    }
    track({ dispose: () => { renderer.dispose(); renderer.forceContextLoss() } })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2))
    const scene = new THREE.Scene()
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
    ].map((g) => track(g))
    const cols = [0x7f9bff, 0xa9c1ff, 0x9be3d0, 0xffd2a8, 0xc7b8ff, 0x8fd0ff]
    const N = coarse ? 10 : 18
    const H = 38
    const items: Array<{ m: THREE.Mesh; sp: number; ph: number; y: number }> = []
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(
        geos[i % geos.length],
        track(new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.35, metalness: 0.12, transparent: true, opacity: 0.36, flatShading: true })),
      )
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
    on(window, "pointermove", (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1
    }, { passive: true })
    let W = 0
    let Hh = 0
    function size() {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w === W && Math.abs(h - Hh) < 160) return
      W = w
      Hh = h
      renderer.setSize(w, h, false)
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
        renderer.render(scene, cam)
      },
    }
    loops.push(loop)
    on(document, "visibilitychange", () => {
      loop.on = !document.hidden
    })
    bgCanvas.dataset.live = "1"
  }

  const idle = () =>
    new Promise<void>((resolve) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => resolve(), { timeout: 600 })
      else window.setTimeout(resolve, 0)
    })

  try {
    mountFlow()
  } catch (error) {
    // No WebGL (or the context could not be created): hand the page back to its plain layout.
    queueMicrotask(() => {
      if (!destroyed) o.onFail?.(error)
    })
  }
  // The background is decoration: it starts once the carousel has drawn and the browser is idle again.
  void (async () => {
    await carouselDrawn
    if (destroyed) return
    await idle()
    if (destroyed) return
    mountBackground()
    mark("c3d:ready")
  })()

  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      cancelAnimationFrame(raf)
      cleanups.splice(0).forEach((fn) => fn())
      disposables.splice(0).forEach((d) => {
        try {
          d.dispose()
        } catch {
          /* already released */
        }
      })
    },
  }
}
