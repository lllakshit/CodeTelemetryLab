import Image from "next/image"
import { realCoverImage } from "@/lib/blog-quality"
import type { BlogPost } from "@/lib/store"

/**
 * Cover palettes from the approved prototype, cycled by position on the page so neighbouring covers never match:
 * background gradient (from, to), then the block faces (top, left, right).
 */
const PALETTES: Array<{ bg: [string, string]; top: string; left: string; right: string }> = [
  { bg: ["#0b1530", "#1f3a8a"], top: "#8fb0ff", left: "#5b82f0", right: "#3558c8" },
  { bg: ["#0e2b2b", "#127a63"], top: "#9be3d0", left: "#4fc7a6", right: "#23957b" },
  { bg: ["#1d1236", "#5b3bb5"], top: "#c9b6fb", left: "#9a78f0", right: "#6b46d0" },
  { bg: ["#321a0a", "#b3611a"], top: "#ffd2a8", left: "#f0a15c", right: "#c97a2a" },
  { bg: ["#0a2540", "#2563eb"], top: "#a9c9ff", left: "#6aa0f5", right: "#3c74d6" },
  { bg: ["#14233a", "#3b5bdb"], top: "#b9c8ff", left: "#7d97f5", right: "#4f6bd8" },
  { bg: ["#142a1f", "#1f8f5f"], top: "#b6efd0", left: "#6fd5a2", right: "#34a874" },
  { bg: ["#2a1235", "#8a3fb0"], top: "#e4c1f5", left: "#c78ae6", right: "#9b55c4" },
]

/** FNV-1a hash, then a small xorshift generator: the same post always gets the same block layout. */
function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

const GRID = 5
const STEP_X = 38.1
const STEP_Y = 22
const HALF_W = 34.3
const HALF_H = 19.8
const UNIT = 3.96
const ORIGIN_X = 332.8
const ORIGIN_Y = 207.6

type Block = { key: string; left: string; right: string; top: string }

const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`

/** An isometric field of blocks of different heights on a 5x5 grid, drawn back to front. */
function blockField(seed: string): Block[] {
  const rnd = seededRandom(seed)
  const cells: Array<{ gx: number; gy: number; h: number }> = []
  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID; gy++) {
      const keep = rnd() < 0.62
      const h = 3 + Math.floor(rnd() * 18)
      if (keep) cells.push({ gx, gy, h })
    }
  }
  // Never an almost empty cover: top up with low blocks along the middle row.
  for (let g = 0; cells.length < 10 && g < GRID; g++) {
    if (!cells.some((c) => c.gx === g && c.gy === 2)) cells.push({ gx: g, gy: 2, h: 3 + g })
  }
  cells.sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx)
  return cells.map(({ gx, gy, h }) => {
    const cx = ORIGIN_X + (gx - gy) * STEP_X
    const yb = ORIGIN_Y + (gx + gy) * STEP_Y
    const yt = yb - h * UNIT
    return {
      key: `${gx}-${gy}`,
      left: [pt(cx - HALF_W, yt - HALF_H), pt(cx, yt), pt(cx, yb), pt(cx - HALF_W, yb - HALF_H)].join(" "),
      right: [pt(cx + HALF_W, yt - HALF_H), pt(cx, yt), pt(cx, yb), pt(cx + HALF_W, yb - HALF_H)].join(" "),
      top: [pt(cx, yt - 2 * HALF_H), pt(cx + HALF_W, yt - HALF_H), pt(cx, yt), pt(cx - HALF_W, yt - HALF_H)].join(" "),
    }
  })
}

const LINES = Array.from({ length: 7 }, (_, k) => 30 + k * 52)

/**
 * Blog cover in the prototype's style. A post with a real cover image keeps that image; every other post gets
 * generated block art plus its category, title and the brand (the same three lines the old fallback cover showed).
 * `index` is the post's position on the page: it picks the palette and keeps the SVG gradient ids unique.
 */
export function BlogCover({
  post,
  index,
  sizes,
  priority = false,
}: {
  post: Pick<BlogPost, "title" | "category" | "featuredImage">
  index: number
  sizes: string
  priority?: boolean
}) {
  const src = realCoverImage(post)
  if (src) {
    return (
      <span className="bcov">
        <Image
          src={src}
          alt={`Cover image for ${post.title}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-center"
        />
      </span>
    )
  }

  const p = PALETTES[index % PALETTES.length]
  const g = `bcg-${index}`
  const r = `bcr-${index}`
  return (
    <span className="bcov" role="img" aria-label={`${post.category} article: ${post.title}`}>
      <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.bg[0]} />
            <stop offset="1" stopColor={p.bg[1]} />
          </linearGradient>
          <radialGradient id={r} cx=".6" cy=".35" r=".6">
            <stop offset="0" stopColor={p.top} stopOpacity=".5" />
            <stop offset="1" stopColor={p.top} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="400" fill={`url(#${g})`} />
        <rect width="640" height="400" fill={`url(#${r})`} />
        {LINES.map((y) => (
          <line key={y} x1="0" y1={y} x2="640" y2={y - 60} stroke="#fff" strokeOpacity=".05" />
        ))}
        {blockField(`${post.category}|${post.title}`).map((b) => (
          <g key={b.key}>
            <polygon points={b.left} fill={p.left} />
            <polygon points={b.right} fill={p.right} />
            <polygon points={b.top} fill={p.top} />
          </g>
        ))}
      </svg>
      <span className="bc-cat">{post.category.toUpperCase()}</span>
      <span className="bc-title">{post.title}</span>
      <span className="bc-brand">CODETELEMETRYLAB</span>
    </span>
  )
}
