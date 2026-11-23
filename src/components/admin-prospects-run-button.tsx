"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Radar } from "lucide-react"
import { adminAccentButton } from "@/lib/admin-ui"
import type { RunSummary } from "@/lib/lead-discovery/types"

type Outcome = { tone: "good" | "warn" | "bad"; text: string }

function describe(summary: RunSummary): string {
  const saved = summary.inserted
  const parts = [
    `${summary.candidates} candidates checked`,
    `${summary.deduplicated} already known`,
    `${summary.qualified} qualified`,
    saved ? `${saved} saved (${summary.insertedCompanies.join(", ")})` : "none saved today",
  ]
  if (summary.stoppedEarly || summary.notScoredInTime) parts.push(`${summary.notScoredInTime} not scored in time (rate limit)`)
  return `${parts.join(" · ")}.`
}

/** Runs the same discovery pipeline as the weekday cron, on demand. Takes one to four minutes. */
export function AdminProspectsRunButton({ disabled, disabledReason }: { disabled?: boolean; disabledReason?: string }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  async function run() {
    if (running) return
    setRunning(true)
    setOutcome(null)
    try {
      const response = await fetch("/api/admin/prospects/discover", { method: "POST" })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; summary?: RunSummary | null }
      if (!response.ok || !data.ok || !data.summary) {
        setOutcome({ tone: "bad", text: data.error || `Discovery failed (HTTP ${response.status}).` })
      } else {
        setOutcome({ tone: data.summary.inserted ? "good" : "warn", text: describe(data.summary) })
      }
      router.refresh()
    } catch {
      setOutcome({ tone: "bad", text: "The run lost its connection. It may still finish: reload in a few minutes." })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void run()}
        disabled={running || disabled}
        title={disabled ? disabledReason : undefined}
        className={`${adminAccentButton} gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radar className="h-4 w-4" aria-hidden="true" />}
        {running ? "Searching… (1–4 min)" : "Run discovery now"}
      </button>
      {outcome ? (
        <p
          role="status"
          className={`max-w-md rounded-2xl border px-3 py-2 text-xs leading-5 ${
            outcome.tone === "good"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : outcome.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {outcome.text}
        </p>
      ) : null}
    </div>
  )
}
