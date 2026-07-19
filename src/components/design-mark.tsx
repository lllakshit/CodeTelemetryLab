import Image from "next/image"

type DesignMarkProps = {
  className?: string
  labelClassName?: string
  showLabel?: boolean
  /** header = compact mark; footer = slightly larger mark */
  size?: "sm" | "md" | "lg"
  priority?: boolean
}

const sizeMap = {
  sm: { box: "h-9 w-9", px: 36 },
  md: { box: "h-10 w-10", px: 40 },
  lg: { box: "h-12 w-12", px: 48 },
} as const

export function DesignMark({
  className,
  labelClassName,
  showLabel = true,
  size = "md",
  priority = false,
}: DesignMarkProps) {
  const dimensions = sizeMap[size]

  return (
    <span
      className={
        className
          ? `inline-flex items-center gap-3 text-slate-900 ${className}`
          : "inline-flex items-center gap-3 text-slate-900"
      }
    >
      <span
        className={`relative ${dimensions.box} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm`}
      >
        <Image
          src="/brand/ct-labs-mark.png"
          alt="CodeTelemetryLabs"
          width={dimensions.px}
          height={dimensions.px}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </span>
      {showLabel ? (
        <span className={labelClassName ?? "inline-flex flex-col leading-none"}>
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-900">
            CodeTelemetryLabs
          </span>
          <span className="text-[0.68rem] text-slate-500">Code. Automate. Elevate.</span>
        </span>
      ) : null}
    </span>
  )
}
