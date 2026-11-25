"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { adminAccentButton, adminGhostButton } from "@/lib/admin-ui"
import { cn } from "@/lib/utils"

type Summary = { windowsDone: number; windowsTotal: number; dailyRows: number; queryRows: number; stoppedEarly: boolean; from: string; to: string }

/** Sync now (last 90 days) or load the full 16 months Search Console keeps. */
export function AdminGscSyncButton({ disabled, disabledReason }: { disabled?: boolean; disabledReason?: string }) {
  const router = useRouter()
  const [running, setRunning] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null)

  async function run(days: number) {
    if (running) return
    setRunning(days)
    setOutcome(null)
    try {
      const response = await fetch("/api/admin/search-console/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; summary?: Summary }
      if (!response.ok || !data.ok || !data.summary) {
        setOutcome({ ok: false, text: data.error || `Sync failed (HTTP ${response.status}).` })
      } else {
        const s = data.summary
        setOutcome({
          ok: true,
          text: `Synced ${s.from} to ${s.to}: ${s.queryRows.toLocaleString()} query rows, ${s.dailyRows.toLocaleString()} daily rows.${s.stoppedEarly ? ` Stopped after ${s.windowsDone}/${s.windowsTotal} months (time limit): press again to finish.` : ""}`,
        })
      }
      router.refresh()
    } catch {
      setOutcome({ ok: false, text: "The sync lost its connection. It may still finish: reload in a few minutes." })
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={cn(adminAccentButton, "gap-2")} disabled={disabled || running !== null} onClick={() => run(90)} title={disabled ? disabledReason : undefined}>
          {running === 90 ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running === 90 ? "Syncing…" : "Sync now"}
        </button>
        <button type="button" className={adminGhostButton} disabled={disabled || running !== null} onClick={() => run(486)} title={disabled ? disabledReason : "Loads all 16 months Google keeps"}>
          {running === 486 ? "Loading 16 months…" : "Load 16 months"}
        </button>
      </div>
      {disabled && disabledReason ? <p className="text-xs text-slate-500">{disabledReason}</p> : null}
      {outcome ? <p className={cn("max-w-md text-xs leading-5 sm:text-right", outcome.ok ? "text-emerald-700" : "text-rose-700")}>{outcome.text}</p> : null}
    </div>
  )
}
