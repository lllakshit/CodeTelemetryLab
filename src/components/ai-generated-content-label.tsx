import { cn } from "@/lib/utils"

/** Small disclosure label for AI-assisted editorial content. */
export function AiGeneratedContentLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500",
        className,
      )}
      title="This article includes AI-assisted writing and human editorial review"
    >
      AI Generated Content
    </span>
  )
}
