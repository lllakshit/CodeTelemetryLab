/**
 * Behaviours of the shared 3D design system that work on the server-rendered markup and need no WebGL: card reveal and
 * mouse tilt, FAQ accordion, isometric layer stacks, the process timeline, stacked case studies, the CSS 3D ring on the
 * About page, and the blog and careers filters.
 *
 * Nothing here is needed to read a page: every answer, post and role is in the HTML, and the filters only hide cards
 * that are already there. Returns a function that removes every listener, observer and animation frame.
 */
export function enhanceSite(root: HTMLElement, opts: { motion: boolean }): () => void {
  const cleanups: Array<() => void> = []
  const on = (t: EventTarget, type: string, fn: (e: any) => void, o?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn, o)
    cleanups.push(() => t.removeEventListener(type, fn, o))
  }
  const $ = <T extends Element>(s: string, r: ParentNode = root) => r.querySelector<T>(s)
  const $$ = <T extends Element>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s))
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches
  const motion = opts.motion && !reduce
  const hasIO = typeof IntersectionObserver !== "undefined"
  // Tells the inline script in Site3DPage that the page script is running, so it keeps the reveal animation on.
  root.dataset.enh = "1"

  const onScrollFrame = (fn: () => void) => {
    let queued = false
    const run = () => {
      queued = false
      fn()
    }
    const queue = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(run)
    }
    on(window, "scroll", queue, { passive: true })
    on(window, "resize", queue)
    fn()
  }

  /* ---------- scroll reveal ---------- */
  const rv = $$<HTMLElement>(".rv")
  if (motion && hasIO) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    )
    rv.forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())
  } else {
    rv.forEach((el) => el.classList.add("in"))
  }

  /* ---------- mouse tilt on glass cards ---------- */
  if (motion && !coarse) {
    $$<HTMLElement>("[data-tilt]").forEach((el) => {
      const max = parseFloat(el.dataset.tilt || "") || 6
      const reset = () => {
        el.style.setProperty("--rx", "0deg")
        el.style.setProperty("--ry", "0deg")
        el.classList.remove("tilting")
      }
      on(el, "pointermove", (e: PointerEvent) => {
        if (e.pointerType === "touch") return
        if ((e.target as Element | null)?.closest(".cv3d, .ring3d, input, select, textarea")) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        el.style.setProperty("--ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg")
        el.style.setProperty("--rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg")
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%")
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%")
        el.classList.add("tilting")
      })
      on(el, "pointerleave", reset)
      on(el, "pointercancel", reset)
    })
  }

  /* ---------- FAQ accordion ---------- */
  $$<HTMLElement>(".faq-item").forEach((it) => {
    const b = $<HTMLButtonElement>(".faq-q", it)
    if (!b) return
    on(b, "click", () => {
      const open = !it.classList.contains("open")
      it.classList.toggle("open", open)
      b.setAttribute("aria-expanded", String(open))
    })
  })

  /* ---------- isometric exploded layers ---------- */
  $$<HTMLElement>(".iso").forEach((iso) => {
    const st = $<HTMLElement>(".iso-stack", iso)
    if (!st) return
    on(iso, "pointermove", (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const b = iso.getBoundingClientRect()
      st.style.setProperty("--tz", ((e.clientX - b.left) / b.width - 0.5) * 26 + "deg")
      st.style.setProperty("--tx", -((e.clientY - b.top) / b.height - 0.5) * 14 + "deg")
    })
    on(iso, "pointerleave", () => {
      st.style.setProperty("--tz", "0deg")
      st.style.setProperty("--tx", "0deg")
    })
    on(iso, "click", () => iso.classList.toggle("open"))
  })
  $$<HTMLElement>("[data-layers]").forEach((w) => {
    const iso = $<HTMLElement>(".iso", w)
    if (!iso) return
    const ls = $$<HTMLElement>(".iso-l", iso)
    const lis = $$<HTMLElement>(".layer-list li", w)
    const hl = (idx: number | null) => {
      ls.forEach((l) => l.classList.toggle("hl", idx !== null && Number(l.dataset.i) === idx))
      lis.forEach((li) => li.classList.toggle("on", idx !== null && Number(li.dataset.l) === idx))
      iso.classList.toggle("open", idx !== null)
    }
    lis.forEach((li) => {
      const i = Number(li.dataset.l)
      on(li, "pointerenter", () => hl(i))
      on(li, "focus", () => hl(i))
      on(li, "click", () => hl(i))
      on(li, "pointerleave", () => hl(null))
      on(li, "blur", () => hl(null))
    })
    ls.forEach((l) => on(l, "pointerenter", () => hl(Number(l.dataset.i))))
  })

  /* ---------- process timeline: the line fills and each step lights up as it passes the middle of the screen ---------- */
  $$<HTMLElement>("#tl").forEach((tl) => {
    const items = $$<HTMLElement>(".tl-i", tl)
    onScrollFrame(() => {
      const r = tl.getBoundingClientRect()
      const mid = window.innerHeight * 0.55
      tl.style.setProperty("--p", (clamp((mid - r.top) / Math.max(1, r.height), 0, 1) * 100).toFixed(1) + "%")
      items.forEach((it) => {
        const ir = it.getBoundingClientRect()
        it.classList.toggle("on", ir.height > 0 && ir.top + ir.height / 2 < mid)
      })
    })
  })

  /* ---------- stacked case studies: the card underneath shrinks a little as the next one slides over it ---------- */
  const cases = $$<HTMLElement>(".case")
  if (cases.length && motion) {
    const mq = window.matchMedia("(min-width: 981px)")
    onScrollFrame(() => {
      cases.forEach((c, i) => {
        const nx = cases[i + 1]
        if (!nx || !mq.matches) {
          c.style.scale = ""
          return
        }
        const top = parseFloat(getComputedStyle(nx).top) || 0
        const r = nx.getBoundingClientRect()
        if (!r.height) return
        const p = clamp(1 - (r.top - top) / (window.innerHeight * 0.55), 0, 1)
        c.style.scale = (1 - p * 0.05).toFixed(4)
      })
    })
  }

  /* ---------- About: CSS 3D ring of values (drag to spin, tap a face to bring it to the front) ---------- */
  $$<HTMLElement>(".ring3d").forEach((el) => {
    const inn = $<HTMLElement>(".ring3d-in", el)
    const faces = $$<HTMLElement>(".ring3d-face", el)
    if (!inn || !faces.length) return
    const n = faces.length
    let ang = 0
    let vel = 0
    let drag = false
    let lx = 0
    let moved = 0
    let tgt: number | null = null
    let visible = !hasIO
    const rad = () => Math.max(140, (el.clientWidth || 600) * 0.26)
    const layout = () => faces.forEach((f, i) => (f.style.transform = `rotateY(${(i * 360) / n}deg) translateZ(${rad()}px)`))
    layout()
    on(window, "resize", layout)
    on(el, "pointerdown", (e: PointerEvent) => {
      drag = true
      moved = 0
      lx = e.clientX
      tgt = null
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* not capturable */
      }
    })
    on(el, "pointermove", (e: PointerEvent) => {
      if (!drag) return
      const dx = e.clientX - lx
      lx = e.clientX
      moved += Math.abs(dx)
      if (moved > 4) el.classList.add("drag")
      ang += dx * 0.4
      vel = dx * 0.4
    })
    const up = (e: PointerEvent) => {
      if (!drag) return
      drag = false
      el.classList.remove("drag")
      if (moved < 6) {
        const f = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest<HTMLElement>(".ring3d-face")
        const i = f ? faces.indexOf(f) : -1
        if (i >= 0) {
          const base = (-i * 360) / n
          tgt = base + Math.round((ang - base) / 360) * 360
        }
      }
    }
    on(el, "pointerup", up)
    on(el, "pointercancel", up)
    // Keyboard: arrow keys turn the ring one face at a time.
    on(el, "keydown", (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const stepA = 360 / n
      tgt = Math.round((ang + (e.key === "ArrowRight" ? -stepA : stepA)) / stepA) * stepA
    })
    let raf = 0
    const frame = () => {
      raf = 0
      if (!visible) return
      if (tgt !== null) {
        ang += (tgt - ang) * 0.12
        if (Math.abs(tgt - ang) < 0.2) tgt = null
      } else if (!drag) {
        if (Math.abs(vel) > 0.02) {
          ang += vel
          vel *= 0.94
        } else if (motion) ang -= 0.22
      }
      inn.style.transform = `translateZ(${-rad()}px) rotateY(${ang.toFixed(2)}deg)`
      raf = requestAnimationFrame(frame)
    }
    if (hasIO) {
      const io = new IntersectionObserver((es) => {
        visible = es[0].isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(frame)
      })
      io.observe(el)
      cleanups.push(() => io.disconnect())
    } else raf = requestAnimationFrame(frame)
    cleanups.push(() => cancelAnimationFrame(raf))
  })

  /* ---------- blog: search and category filter over the posts on this page ---------- */
  $$<HTMLFormElement>("#blogFilter").forEach((f) => {
    const items = $$<HTMLElement>(".post, .feat")
    const cnt = $<HTMLElement>("#blogCount")
    const orig = cnt?.textContent ?? ""
    const empty = $<HTMLElement>("#blogEmpty")
    const q = $<HTMLInputElement>("[name=q]", f)
    const sel = $<HTMLSelectElement>("[name=category]", f)
    const pager = $<HTMLElement>(".pager")
    if (!q || !sel) return
    const run = () => {
      const term = q.value.trim().toLowerCase()
      const cat = sel.value.trim().toLowerCase()
      const any = Boolean(term || cat)
      let n = 0
      items.forEach((it) => {
        const okT = !term || (it.dataset.text ?? "").includes(term)
        const okC = !cat || (it.dataset.cat ?? "").toLowerCase() === cat || (it.dataset.tags ?? "").toLowerCase().includes(`|${cat}|`)
        const show = okT && okC
        const was = !it.classList.contains("hide")
        it.classList.toggle("hide", !show)
        if (show) {
          n++
          if (!was) {
            it.classList.remove("show")
            void it.offsetWidth
            it.classList.add("show")
          }
        }
      })
      if (cnt) cnt.textContent = any ? `Showing ${n} matching ${n === 1 ? "article" : "articles"} on this page.` : orig
      if (empty) empty.style.display = n ? "none" : "block"
      if (pager) pager.style.display = any ? "none" : ""
    }
    // The form also works without script: it submits to the server, which filters across every page.
    on(f, "submit", (e: Event) => {
      if (f.dataset.server === "1") return
      e.preventDefault()
      run()
    })
    on(q, "input", run)
    on(sel, "change", run)
  })

  /* ---------- careers: team filter ---------- */
  $$<HTMLElement>("#teams").forEach((nav) => {
    const links = $$<HTMLAnchorElement>("a", nav)
    const roles = $$<HTMLElement>(".role")
    const h = $<HTMLElement>("#openCount")
    links.forEach((a) =>
      on(a, "click", (e: MouseEvent) => {
        e.preventDefault()
        const team = a.dataset.team || ""
        links.forEach((x) => x.setAttribute("aria-current", x === a ? "true" : "false"))
        let n = 0
        roles.forEach((r) => {
          const show = !team || r.dataset.team === team
          const was = !r.classList.contains("hide")
          r.classList.toggle("hide", !show)
          if (show) {
            n++
            if (!was || team === "") {
              r.classList.remove("show")
              void r.offsetWidth
              r.classList.add("show")
            }
          }
        })
        if (h) h.textContent = team ? `${n} ${n === 1 ? "opening" : "openings"}` : (h.dataset.orig ?? h.textContent)
      }),
    )
  })

  return () => cleanups.splice(0).forEach((fn) => fn())
}
