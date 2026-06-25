type DesignMarkProps = {
  className?: string
  labelClassName?: string
  showLabel?: boolean
}

export function DesignMark({ className, labelClassName, showLabel = true }: DesignMarkProps) {
  return (
    <span
      className={
        className
          ? `inline-flex items-center gap-3 text-slate-900 ${className}`
          : "inline-flex items-center gap-3 text-slate-900"
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        fill="none"
        className="h-10 w-10 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M12 10L6 16L12 22" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 10L34 16L28 22" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 6L18 34" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showLabel ? (
        <span className={labelClassName ?? "inline-flex flex-col leading-none"}>
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-900">
            CodeTelemetryLabs
          </span>
          <span className="text-[0.68rem] text-slate-500">Engineering systems with editorial clarity</span>
        </span>
      ) : null}
    </span>
  )
}
