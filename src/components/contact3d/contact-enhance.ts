/**
 * Small behaviours for the contact page that work on the server-rendered markup: card reveal and tilt, the FAQ
 * accordion, the coverflow strip, the form's progress cubes, a double-submit guard and the "send a brief" jumps.
 *
 * Nothing here is needed to read the page or send the form: the form is a normal POST, every FAQ answer is in the
 * HTML, and the strip is a normal horizontally scrolling list. Returns a function that removes every listener.
 */
export function enhanceContact(root: HTMLElement, opts: { motion: boolean }): () => void {
  const cleanups: Array<() => void> = []
  const on = (t: EventTarget, type: string, fn: (e: any) => void, o?: AddEventListenerOptions | boolean) => {
    t.addEventListener(type, fn, o)
    cleanups.push(() => t.removeEventListener(type, fn, o))
  }
  const $ = <T extends Element>(s: string, r: ParentNode = root) => r.querySelector<T>(s)
  const $$ = <T extends Element>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s))
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarse = window.matchMedia("(pointer: coarse)").matches
  const motion = opts.motion && !reduce
  // Tells the inline script in the page that the page script is running, so it keeps the reveal animation on.
  root.dataset.enh = "1"

  /* ---------- scroll reveal ---------- */
  const rv = $$<HTMLElement>(".c-rv")
  if (motion && typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    )
    rv.forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())
    // Safety net: if the observer never reports (a hidden tab, an odd embed), show everything after a moment.
    const t = window.setTimeout(() => rv.forEach((el) => el.classList.add("in")), 4000)
    cleanups.push(() => window.clearTimeout(t))
  } else {
    rv.forEach((el) => el.classList.add("in"))
  }

  /* ---------- pointer tilt on the glass cards (mouse and pen only) ---------- */
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
        const target = e.target as Element | null
        if (target?.closest("#c-flow-canvas")) return
        // Keep a card still while someone is typing in it, so selecting text or placing the caret stays steady.
        const a = document.activeElement
        if (a && el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) {
          if (el.classList.contains("tilting")) reset()
          return
        }
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
      on(el, "focusin", (e: FocusEvent) => {
        if ((e.target as Element).matches("input, textarea, select")) reset()
      })
    })
  }

  /* ---------- FAQ accordion (every answer is already in the HTML) ---------- */
  $$<HTMLElement>(".c-faq-item").forEach((item) => {
    const b = $<HTMLButtonElement>(".c-q", item)
    if (!b) return
    on(b, "click", () => {
      const open = !item.classList.contains("open")
      item.classList.toggle("open", open)
      b.setAttribute("aria-expanded", String(open))
    })
  })

  /* ---------- coverflow strip (engagement expectations) ---------- */
  const cov = $<HTMLElement>("#c-cover")
  if (cov) {
    const items = $$<HTMLElement>(".c-cov", cov)
    let pending = false
    const upd = () => {
      pending = false
      const mid = cov.clientWidth / 2 + cov.scrollLeft
      items.forEach((it) => {
        if (!motion) {
          it.style.transform = ""
          it.style.opacity = ""
          return
        }
        const c = it.offsetLeft + it.offsetWidth / 2
        let d = (c - mid) / (cov.clientWidth * 0.55)
        d = Math.max(-1.5, Math.min(1.5, d))
        const a = Math.abs(d)
        it.style.transform = `rotateY(${(-d * 32).toFixed(1)}deg) translateZ(${(-a * 70).toFixed(0)}px) scale(${(1 - a * 0.07).toFixed(3)})`
        it.style.opacity = (1 - Math.min(0.5, a * 0.32)).toFixed(2)
      })
    }
    const queue = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(upd)
    }
    on(cov, "scroll", queue, { passive: true })
    on(window, "resize", queue)
    upd()
    const t = window.setTimeout(upd, 400)
    cleanups.push(() => window.clearTimeout(t))
    let down = false
    let sx = 0
    let sl = 0
    on(cov, "pointerdown", (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      down = true
      sx = e.clientX
      sl = cov.scrollLeft
      cov.classList.add("grabbing")
    })
    on(window, "pointermove", (e: PointerEvent) => {
      if (down) cov.scrollLeft = sl - (e.clientX - sx)
    })
    on(window, "pointerup", () => {
      if (!down) return
      down = false
      cov.classList.remove("grabbing")
    })
  }

  /* ---------- form: progress cubes and a double-submit guard ---------- */
  const form = $<HTMLFormElement>("#c-form")
  if (form) {
    const ok = (name: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
      if (!el) return false
      const v = el.value.trim()
      return name === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) : v.length > 0
    }
    const paint = () => {
      ;["name", "email", "message"].forEach((n) => $(`[data-cube="${n}"]`)?.classList.toggle("ok", ok(n)))
    }
    on(form, "input", paint)
    on(form, "change", paint)
    paint()
    // Browsers restore typed values when you come back to the page; show them in the cubes as well.
    const t = window.setTimeout(paint, 300)
    cleanups.push(() => window.clearTimeout(t))

    const btn = $<HTMLButtonElement>(".c-submit", form)
    const label = btn ? $<HTMLElement>(".c-submit-label", btn) : null
    const idleLabel = label?.textContent ?? ""
    const release = () => {
      form.dataset.sending = "0"
      btn?.removeAttribute("aria-disabled")
      if (label) label.textContent = idleLabel
    }
    on(form, "submit", (e: Event) => {
      if (form.dataset.sending === "1") {
        e.preventDefault()
        return
      }
      if (!form.checkValidity()) return // the browser shows its own message
      form.dataset.sending = "1"
      btn?.setAttribute("aria-disabled", "true")
      if (label) label.textContent = "Sending…"
      // If the send is stopped (Esc, Stop, a stalled network), let the visitor try again instead of staying locked.
      const t = window.setTimeout(release, 10000)
      cleanups.push(() => window.clearTimeout(t))
    })
    // Coming back with the browser's back button restores the page from memory; let the visitor send again.
    on(window, "pageshow", (e: PageTransitionEvent) => {
      if (e.persisted) {
        release()
        paint()
      }
    })
  }

  /* ---------- jump to the form ---------- */
  const card = $<HTMLElement>("#brief")
  const goForm = () => {
    if (!card) return false
    // Wait two frames: the phone menu closes on the same click, and its height must be gone before measuring the scroll.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // A card taller than the window would centre with its top under the sticky header; align its top instead.
        const tall = card.offsetHeight > window.innerHeight - 110
        card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: tall ? "start" : "center" })
        if (!coarse && root.dataset.state !== "sent") {
          const t = window.setTimeout(() => $<HTMLInputElement>("#c-name")?.focus({ preventScroll: true }), 500)
          cleanups.push(() => window.clearTimeout(t))
        }
      }),
    )
    return true
  }
  // The header and footer "Send a brief" links point at this same page; on this page they jump to the form instead.
  on(
    document,
    "click",
    (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a")
      if (!a || card?.contains(a)) return
      const goes = a.hasAttribute("data-go-form") || (a.getAttribute("href") === "/contact" && /send a brief/i.test(a.textContent || ""))
      if (goes && goForm()) e.preventDefault()
    },
    true,
  )

  /* ---------- phone button: shown until the form (or the footer) is on screen ---------- */
  const footer = document.querySelector("footer")
  if (card && typeof IntersectionObserver !== "undefined") {
    let formIn = false
    let footerIn = false
    const set = () => {
      root.dataset.fab = formIn || footerIn ? "0" : "1"
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.target === card) formIn = e.isIntersecting
        else footerIn = e.isIntersecting
      })
      set()
    })
    io.observe(card)
    if (footer) io.observe(footer)
    cleanups.push(() => io.disconnect())
  }

  /* ---------- after a send or a rejected send, bring the form into view ---------- */
  if (root.dataset.state && card && window.scrollY < 80) {
    const raf = requestAnimationFrame(() =>
      card.scrollIntoView({ block: card.offsetHeight > window.innerHeight - 110 ? "start" : "center" }),
    )
    cleanups.push(() => cancelAnimationFrame(raf))
  }

  return () => cleanups.splice(0).forEach((fn) => fn())
}
