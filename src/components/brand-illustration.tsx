type BrandIllustrationProps = {
  variant: "about" | "contact" | "blog" | "portal" | "automation" | "platform"
  className?: string
}

const variantLabels = {
  about: {
    eyebrow: "Operating model",
    caption: "Discovery, build, handoff, and future expansion framed as one system.",
  },
  contact: {
    eyebrow: "Inquiry flow",
    caption: "Clear intake, realistic timelines, and a response path that feels human.",
  },
  blog: {
    eyebrow: "Editorial system",
    caption: "Content architecture designed for SEO, publishing workflows, and product credibility.",
  },
  portal: {
    eyebrow: "Portal surface",
    caption: "Role-aware navigation, document handoff, and client visibility in one workflow.",
  },
  automation: {
    eyebrow: "Automation console",
    caption: "Structured operations, guardrails, and readable system state for internal teams.",
  },
  platform: {
    eyebrow: "Platform foundation",
    caption: "Multi-tenant structure, operational controls, and delivery discipline built into the surface.",
  },
} as const

export function BrandIllustration({ variant, className }: BrandIllustrationProps) {
  const label = variantLabels[variant]

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f4f8fc)] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-700">{label.eyebrow}</p>
        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        </div>
      </div>
      <svg viewBox="0 0 720 460" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="18" width="684" height="360" rx="30" fill="#F8FBFF" stroke="#DEE3E9" />
        <path d="M72 100H648" stroke="#E2E8F0" strokeDasharray="6 8" />
        <path d="M72 182H648" stroke="#E2E8F0" strokeDasharray="6 8" />
        <path d="M72 264H648" stroke="#E2E8F0" strokeDasharray="6 8" />
        {variant === "about" ? (
          <>
            <rect x="72" y="70" width="164" height="74" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="278" y="70" width="164" height="74" rx="22" fill="#EAF3FF" stroke="#BFDBFE" />
            <rect x="484" y="70" width="164" height="74" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="132" y="214" width="456" height="102" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <circle cx="154" cy="107" r="14" stroke="#0064E0" strokeWidth="3" />
            <circle cx="360" cy="107" r="14" stroke="#0064E0" strokeWidth="3" />
            <circle cx="566" cy="107" r="14" stroke="#0064E0" strokeWidth="3" />
            <path d="M168 107H278" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M374 107H484" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M360 121V214" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
        {variant === "contact" ? (
          <>
            <rect x="88" y="86" width="210" height="208" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="342" y="86" width="290" height="96" rx="24" fill="#EAF3FF" stroke="#BFDBFE" />
            <rect x="342" y="198" width="290" height="96" rx="24" fill="#FFFFFF" stroke="#CBD5E1" />
            <path d="M130 126H256" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M130 158H230" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M130 190H248" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M130 222H204" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <circle cx="566" cy="134" r="16" stroke="#0064E0" strokeWidth="3" />
            <path d="M520 134H550" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M382 230H590" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M382 258H532" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M298 190H342" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
        {variant === "blog" ? (
          <>
            <rect x="92" y="82" width="250" height="212" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="382" y="82" width="246" height="84" rx="22" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="382" y="184" width="246" height="110" rx="22" fill="#EAF3FF" stroke="#BFDBFE" />
            <path d="M128 122H304" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 154H280" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 186H294" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 218H264" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <circle cx="430" cy="124" r="14" stroke="#0064E0" strokeWidth="3" />
            <circle cx="570" cy="124" r="14" stroke="#0064E0" strokeWidth="3" />
            <path d="M444 124H556" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M414 220H590" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M414 250H558" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
        {variant === "portal" ? (
          <>
            <rect x="72" y="84" width="576" height="220" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="96" y="110" width="122" height="168" rx="20" fill="#F8FAFC" stroke="#E2E8F0" />
            <rect x="244" y="110" width="170" height="72" rx="20" fill="#EAF3FF" stroke="#BFDBFE" />
            <rect x="434" y="110" width="190" height="72" rx="20" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="244" y="202" width="380" height="76" rx="20" fill="#FFFFFF" stroke="#CBD5E1" />
            <path d="M122 138H188" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M122 170H176" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M122 202H182" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <circle cx="308" cy="146" r="14" stroke="#0064E0" strokeWidth="3" />
            <path d="M322 146H374" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M280 238H584" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
        {variant === "automation" ? (
          <>
            <rect x="92" y="88" width="160" height="84" rx="24" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="286" y="88" width="160" height="84" rx="24" fill="#EAF3FF" stroke="#BFDBFE" />
            <rect x="480" y="88" width="160" height="84" rx="24" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="164" y="228" width="404" height="92" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <circle cx="172" cy="130" r="14" stroke="#0064E0" strokeWidth="3" />
            <circle cx="366" cy="130" r="14" stroke="#0064E0" strokeWidth="3" />
            <circle cx="560" cy="130" r="14" stroke="#0064E0" strokeWidth="3" />
            <path d="M186 130H286" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M380 130H480" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M366 144V228" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M214 264H516" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M214 292H444" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : null}
        {variant === "platform" ? (
          <>
            <rect x="92" y="88" width="250" height="214" rx="28" fill="#FFFFFF" stroke="#CBD5E1" />
            <rect x="378" y="88" width="250" height="98" rx="24" fill="#EAF3FF" stroke="#BFDBFE" />
            <rect x="378" y="204" width="250" height="98" rx="24" fill="#FFFFFF" stroke="#CBD5E1" />
            <circle cx="154" cy="142" r="18" stroke="#0064E0" strokeWidth="3" />
            <path d="M186 142H292" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 206H304" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 236H282" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 266H228" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <path d="M416 128H590" stroke="#0064E0" strokeWidth="3" strokeLinecap="round" />
            <path d="M416 244H574" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            <circle cx="570" cy="246" r="18" stroke="#0064E0" strokeWidth="3" />
          </>
        ) : null}
        <text x="42" y="426" fill="#5D6C7B" fontSize="18" fontFamily="Arial, sans-serif">
          {label.caption}
        </text>
      </svg>
    </div>
  )
}
