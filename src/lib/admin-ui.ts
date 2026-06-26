import { cn } from "@/lib/utils"

export const adminSurface =
  "rounded-3xl border border-[rgba(10,19,23,0.08)] bg-white/92 shadow-[0_14px_44px_rgba(15,23,42,0.06)] backdrop-blur-sm"

export const adminSurfaceSoft =
  "rounded-2xl border border-[rgba(10,19,23,0.08)] bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.035)]"

export const adminPrimaryButton =
  "inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"

export const adminAccentButton =
  "inline-flex items-center justify-center rounded-full bg-[#0064e0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0457cb]"

export const adminSecondaryButton =
  "inline-flex items-center justify-center rounded-full border-2 border-slate-950/90 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"

export const adminGhostButton =
  "inline-flex items-center justify-center rounded-full border border-[rgba(10,19,23,0.12)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"

export const adminDangerButton =
  "inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"

export const adminBadge =
  "inline-flex items-center gap-2 rounded-full border border-[rgba(10,19,23,0.08)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"

export const adminInfoChip =
  "rounded-full border border-[#ced0d4] bg-white px-3 py-1 text-xs font-semibold text-slate-600"

export function adminInputClassName(className?: string) {
  return cn(
    "w-full rounded-xl border border-[#ced0d4] bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-[#8595a4] focus:border-[#1876f2] focus:ring-4 focus:ring-[#0064e0]/10",
    className,
  )
}

export function adminTextareaClassName(className?: string) {
  return adminInputClassName(cn("min-h-32 resize-y", className))
}

export const adminCheckboxCard =
  "flex min-h-11 items-center gap-3 rounded-xl border border-[#ced0d4] bg-white px-3.5 py-2.5 text-sm text-slate-700"

export const adminHint = "text-xs leading-6 text-slate-500"
export const adminFieldLabel = "text-sm font-medium text-slate-700"
