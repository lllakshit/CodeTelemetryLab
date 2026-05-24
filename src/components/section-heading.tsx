import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">{description}</p> : null}
    </div>
  )
}
