import Image from "next/image"
import { realCoverImage } from "@/lib/blog-quality"
import type { BlogPost } from "@/lib/store"
import { cn } from "@/lib/utils"

type PostCoverProps = {
  post: Pick<BlogPost, "title" | "category" | "featuredImage">
  /** `thumb` for list rows, `card` for related/lead cards, `hero` for the article header. */
  variant?: "thumb" | "card" | "hero"
  sizes: string
  priority?: boolean
  className?: string
}

const radius = {
  thumb: "rounded-[1.25rem]",
  card: "rounded-[1.75rem]",
  hero: "rounded-[1.75rem]",
} as const

/**
 * One cover treatment for every article surface: fixed 16:9 frame, same border and radius,
 * descriptive alt text, and a branded fallback when a post has no real cover image.
 */
export function PostCover({ post, variant = "card", sizes, priority = false, className }: PostCoverProps) {
  const src = realCoverImage(post)
  const frame = cn(
    "relative block aspect-[16/9] w-full overflow-hidden border border-slate-200 bg-slate-100",
    radius[variant],
    className,
  )

  if (src) {
    return (
      <span className={frame}>
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

  return (
    <span
      role="img"
      aria-label={`${post.category} article: ${post.title}`}
      className={cn(
        frame,
        "grid-noise flex flex-col justify-between bg-[linear-gradient(135deg,#f4f8ff,#e6f0ff_60%,#dbeafe)] p-5",
        variant === "thumb" && "p-4",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-700">{post.category}</span>
      <span
        className={cn(
          "line-clamp-3 font-medium tracking-[-0.02em] text-slate-950",
          variant === "thumb" ? "text-sm leading-5" : "text-xl leading-7 sm:text-2xl sm:leading-8",
        )}
      >
        {post.title}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">CodeTelemetryLab</span>
    </span>
  )
}
