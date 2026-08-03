"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Loader2, Send } from "lucide-react"
import {
  adminAccentButton,
  adminFieldLabel,
  adminHint,
  adminInputClassName,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import type { EmailLog } from "@/lib/store"

type FieldErrors = Partial<Record<"to" | "cc" | "bcc" | "subject" | "body", string[]>>

type AdminEmailComposerProps = {
  initialLogs: EmailLog[]
  fromAddress: string
}

export function AdminEmailComposer({ initialLogs, fromAddress }: AdminEmailComposerProps) {
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [logs, setLogs] = useState(initialLogs)

  const canSubmit = useMemo(() => !sending && to.trim() && subject.trim() && body.trim(), [sending, to, subject, body])

  async function refreshLogs() {
    try {
      const response = await fetch("/api/admin/email", { method: "GET" })
      if (!response.ok) return
      const data = (await response.json()) as { logs?: EmailLog[] }
      if (Array.isArray(data.logs)) setLogs(data.logs)
    } catch {
      // Keep existing logs if refresh fails.
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return

    setSending(true)
    setSuccess(null)
    setError(null)
    setFieldErrors({})

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc, bcc, subject, body }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
        fieldErrors?: FieldErrors
      }

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {})
        setError(data.error || "Failed to send email.")
        return
      }

      setSuccess(data.message || "Email sent successfully")
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      await refreshLogs()
    } catch {
      setError("Network error while sending email. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className={`${adminSurface} space-y-5 p-6`}>
        <div className={`${adminSurfaceSoft} px-4 py-3`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">From</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{fromAddress}</p>
          <p className={adminHint}>Sender is fixed for deliverability and brand consistency.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block space-y-2">
            <span className={adminFieldLabel}>To</span>
            <input
              type="email"
              required
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className={adminInputClassName()}
              placeholder="recipient@company.com"
              autoComplete="off"
            />
            {fieldErrors.to?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.to[0]}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className={adminFieldLabel}>CC (optional)</span>
            <input
              type="text"
              value={cc}
              onChange={(event) => setCc(event.target.value)}
              className={adminInputClassName()}
              placeholder="one@example.com, two@example.com"
              autoComplete="off"
            />
            {fieldErrors.cc?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.cc[0]}</p> : null}
          </label>
        </div>

        <label className="block space-y-2">
          <span className={adminFieldLabel}>BCC (optional)</span>
          <input
            type="text"
            value={bcc}
            onChange={(event) => setBcc(event.target.value)}
            className={adminInputClassName()}
            placeholder="private@example.com"
            autoComplete="off"
          />
          {fieldErrors.bcc?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.bcc[0]}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className={adminFieldLabel}>Subject</span>
          <input
            type="text"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={adminInputClassName()}
            placeholder="Short, specific subject line"
            maxLength={300}
          />
          {fieldErrors.subject?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.subject[0]}</p> : null}
        </label>

        <label className="block space-y-2">
          <span className={adminFieldLabel}>Message</span>
          <textarea
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={adminTextareaClassName("min-h-56")}
            placeholder="Write the email exactly as you want it sent."
            maxLength={20000}
          />
          <p className={adminHint}>Plain text. Line breaks are preserved.</p>
          {fieldErrors.body?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.body[0]}</p> : null}
        </label>

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!canSubmit} className={`${adminAccentButton} disabled:cursor-not-allowed disabled:opacity-60`}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Send email
              </>
            )}
          </button>
        </div>
      </form>

      <section className={`${adminSurface} p-6`}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Recent sends</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">Email log</h2>
        <p className="mt-2 text-sm text-slate-600">Internal audit trail for outbound founder emails.</p>

        <div className="mt-6 space-y-3">
          {logs.length === 0 ? (
            <p className={`${adminSurfaceSoft} px-4 py-5 text-sm text-slate-600`}>No emails sent yet.</p>
          ) : (
            logs.map((log) => (
              <article key={log.id} className={`${adminSurfaceSoft} px-4 py-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{log.subject}</p>
                    <p className="mt-1 text-sm text-slate-600">To: {log.recipient}</p>
                    {log.cc.length ? <p className="text-xs text-slate-500">CC: {log.cc.join(", ")}</p> : null}
                    {log.bcc.length ? <p className="text-xs text-slate-500">BCC: {log.bcc.join(", ")}</p> : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      log.status === "sent"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                {log.errorMessage ? <p className="mt-2 text-xs text-rose-600">{log.errorMessage}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
