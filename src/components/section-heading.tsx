import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  level = 2,
}: {
  eyebrow: string
  title: string
  description?: string
  className?: string
  level?: 1 | 2
}) {
  const HeadingTag = level === 1 ? "h1" : "h2"

  return (
    <div className={cn("max-w-3xl", className)}>
      <div className="inline-flex items-center gap-3">
        <span className="h-px w-8 bg-slate-300" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-700">{eyebrow}</p>
      </div>
      <HeadingTag className="mt-4 text-3xl font-medium tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </HeadingTag>
      {description ? <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
    </div>
  )
}
