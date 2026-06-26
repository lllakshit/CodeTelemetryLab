type BlueprintHeroProps = {
  className?: string
}

export function BlueprintHero({ className }: BlueprintHeroProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative aspect-[18/14] overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${className ?? ""}`}
    >
      <svg viewBox="0 0 720 560" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blueprintGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#EFF6FF" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="720" height="560" rx="28" fill="url(#blueprintGlow)" />
        {[...Array(9)].map((_, index) => (
          <g key={index} opacity="0.35">
            <path d={`M${80 + index * 64} 36V520`} stroke="#CBD5E1" strokeOpacity="0.28" />
            <path d={`M36 ${76 + index * 56}H684`} stroke="#CBD5E1" strokeOpacity="0.28" />
          </g>
        ))}
        <rect x="82" y="90" width="182" height="116" rx="18" stroke="#38BDF8" strokeOpacity="0.55" />
        <rect x="300" y="72" width="320" height="142" rx="22" fill="rgba(255,255,255,0.5)" stroke="#60A5FA" strokeOpacity="0.45" />
        <rect x="118" y="250" width="260" height="168" rx="22" fill="rgba(255,255,255,0.45)" stroke="#38BDF8" strokeOpacity="0.42" />
        <rect x="426" y="262" width="160" height="168" rx="22" stroke="#60A5FA" strokeOpacity="0.42" />
        <circle cx="170" cy="146" r="32" stroke="#38BDF8" strokeWidth="3" />
        <circle cx="380" cy="144" r="24" stroke="#60A5FA" strokeWidth="3" />
        <circle cx="518" cy="350" r="34" stroke="#38BDF8" strokeWidth="3" />
        <path d="M201 146H300" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <path d="M404 144H452" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
        <path d="M378 350H426" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <path d="M126 322H346" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
        <path d="M430 324H554" stroke="#60A5FA" strokeWidth="2.5" strokeOpacity="0.7" strokeLinecap="round" />
        <path d="M246 206L308 250" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M456 214L430 262" stroke="#60A5FA" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M170 178V250" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M518 296V262" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.6" strokeLinecap="round" />
        <text x="96" y="468" fill="#0F172A" fontSize="18" fontFamily="Inter, system-ui, sans-serif" opacity="0.9">
          Content architecture, systems, and launch surfaces
        </text>
        <text x="96" y="498" fill="#2563EB" fontSize="13" fontFamily="JetBrains Mono, monospace" opacity="0.9">
          SVG-first / Operations-ready / SEO-conscious
        </text>
      </svg>
    </div>
  )
}
