"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { Loader2, RefreshCw, Send, X } from "lucide-react"
import {
  adminAccentButton,
  adminFieldLabel,
  adminGhostButton,
  adminHint,
  adminInputClassName,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import type { EmailLog } from "@/lib/store"
import { describeStatus } from "@/lib/outreach/status"

type FieldErrors = Partial<Record<"to" | "cc" | "bcc" | "subject" | "body", string[]>>

/** Values the Email page fills in (from a discovered prospect, or from ?to=&subject=&body=). All stay editable. */
export type ComposerPrefill = {
  to: string[]
  subject: string
  body: string
  prospect?: { id: string; company: string; status: string; contactRoute: string | null }
  /** A prospect id was given but no such prospect exists. */
  missingProspect?: boolean
}

type AdminEmailComposerProps = {
  initialLogs: EmailLog[]
  fromAddress: string
  prefill?: ComposerPrefill | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function parseDraftEmails(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function AdminEmailComposer({ initialLogs, fromAddress, prefill }: AdminEmailComposerProps) {
  const [toRecipients, setToRecipients] = useState<string[]>(prefill?.to ?? [])
  const [toDraft, setToDraft] = useState("")
  const [toDraftError, setToDraftError] = useState<string | null>(null)
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(prefill?.subject ?? "")
  const [body, setBody] = useState(prefill?.body ?? "")
  // The prospect this email is for; cleared after one successful send so a second email does not re-mark it.
  const [prospect, setProspect] = useState(prefill?.prospect ?? null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [logs, setLogs] = useState(initialLogs)
  const toInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = useMemo(
    () =>
      !sending &&
      (toRecipients.length > 0 || Boolean(toDraft.trim())) &&
      Boolean(subject.trim()) &&
      Boolean(body.trim()),
    [sending, toRecipients.length, toDraft, subject, body],
  )

  function addToRecipients(rawParts: string[]) {
    if (!rawParts.length) return true

    const next = [...toRecipients]
    for (const part of rawParts) {
      const email = normalizeEmail(part)
      if (!EMAIL_PATTERN.test(email)) {
        setToDraftError(`“${part.trim()}” is not a valid email address.`)
        return false
      }
      if (next.includes(email)) continue
      if (next.length >= 20) {
        setToDraftError("You can add up to 20 recipients in To.")
        return false
      }
      next.push(email)
    }

    setToRecipients(next)
    setToDraft("")
    setToDraftError(null)
    return true
  }

  function commitToDraft() {
    const parts = parseDraftEmails(toDraft)
    if (!parts.length) {
      setToDraftError(null)
      return true
    }
    return addToRecipients(parts)
  }

  function removeToRecipient(email: string) {
    setToRecipients((current) => current.filter((item) => item !== email))
    setToDraftError(null)
  }

  function onToKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (!toDraft.trim()) {
        if (event.key === "Enter") event.preventDefault()
        return
      }
      event.preventDefault()
      commitToDraft()
      return
    }

    if (event.key === "Backspace" && !toDraft && toRecipients.length) {
      event.preventDefault()
      setToRecipients((current) => current.slice(0, -1))
    }
  }

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

  // Delivery status is read back from Resend automatically while any sent email is still unsettled.
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [statusReadable, setStatusReadable] = useState(true)
  const refreshStatuses = useCallback(async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch("/api/admin/email/refresh", { method: "POST" })
      if (!response.ok) return
      const data = (await response.json()) as { logs?: EmailLog[]; readable?: boolean }
      if (Array.isArray(data.logs)) setLogs(data.logs)
      if (data.readable === false) setStatusReadable(false)
    } catch {
      // Keep what is on screen.
    } finally {
      setCheckingStatus(false)
    }
  }, [])
  // Check once when the page opens (and on the Refresh button). No background polling here: this page shares
  // Resend's rate limit with real contact sends, and a send-only key can never report status anyway.
  useEffect(() => {
    const first = setTimeout(() => void refreshStatuses(), 0)
    return () => clearTimeout(first)
  }, [refreshStatuses])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return

    const recipients = [...toRecipients]
    for (const part of parseDraftEmails(toDraft)) {
      const email = normalizeEmail(part)
      if (!EMAIL_PATTERN.test(email)) {
        setToDraftError(`“${part.trim()}” is not a valid email address.`)
        toInputRef.current?.focus()
        return
      }
      if (recipients.includes(email)) continue
      if (recipients.length >= 20) {
        setToDraftError("You can add up to 20 recipients in To.")
        return
      }
      recipients.push(email)
    }

    if (!recipients.length) {
      setToDraftError("Add at least one recipient, then press Enter.")
      toInputRef.current?.focus()
      return
    }

    setToRecipients(recipients)
    setToDraft("")
    setToDraftError(null)
    setSending(true)
    setSuccess(null)
    setError(null)
    setFieldErrors({})

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients, cc, bcc, subject, body, ...(prospect ? { prospectId: prospect.id } : {}) }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
        fieldErrors?: FieldErrors
        prospectUpdated?: boolean
      }

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {})
        setError(data.error || "Failed to send email.")
        return
      }

      setSuccess(
        prospect
          ? `${data.message || "Email sent successfully"}. ${data.prospectUpdated ? `${prospect.company} is now marked Contacted.` : `${prospect.company} keeps its current status (${prospect.status.replace(/_/g, " ")}).`}`
          : data.message || "Email sent successfully",
      )
      if (prospect) {
        setProspect(null)
        // Drop ?prospectId so a reload does not fill the same draft again.
        window.history.replaceState(null, "", "/admin/email")
      }
      setToRecipients([])
      setToDraft("")
      setToDraftError(null)
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
        {prospect ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            <p>
              Draft for prospect <strong>{prospect.company}</strong>. Review and edit everything before sending; sending marks the prospect Contacted.
            </p>
            {!prefill?.to.length ? (
              <p className="mt-1 text-blue-800">No public email was found for this company, so add the recipient yourself{prospect.contactRoute ? ` (${prospect.contactRoute})` : ""}.</p>
            ) : null}
            {prospect.status !== "new" && prospect.status !== "approved" ? (
              <p className="mt-1 text-amber-800">Current status: {prospect.status.replace(/_/g, " ")}.</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/admin/leads/prospects" className="text-blue-700 underline-offset-2 hover:underline">Back to prospects</Link>
              <button
                type="button"
                className="text-blue-700 underline-offset-2 hover:underline"
                onClick={() => {
                  setProspect(null)
                  window.history.replaceState(null, "", "/admin/email")
                }}
              >
                Send without linking to the prospect
              </button>
            </div>
          </div>
        ) : null}
        {prefill?.missingProspect ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">That prospect was not found, so nothing was filled in.</div>
        ) : null}
        <div className={`${adminSurfaceSoft} px-4 py-3`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">From</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{fromAddress}</p>
          <p className={adminHint}>Sender is fixed for deliverability and brand consistency.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="block space-y-2">
            <span className={adminFieldLabel}>To</span>
            <div
              className={`${adminInputClassName("flex min-h-11 flex-wrap items-center gap-2 py-2")} cursor-text`}
              onClick={() => toInputRef.current?.focus()}
            >
              {toRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                >
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeToRecipient(email)
                    }}
                    className="rounded-full p-0.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                ref={toInputRef}
                type="text"
                value={toDraft}
                onChange={(event) => {
                  setToDraft(event.target.value)
                  if (toDraftError) setToDraftError(null)
                }}
                onKeyDown={onToKeyDown}
                onBlur={() => {
                  if (toDraft.trim()) commitToDraft()
                }}
                className="min-w-[12rem] flex-1 border-0 bg-transparent p-0 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder={toRecipients.length ? "Add another, press Enter" : "name@company.com, press Enter"}
                autoComplete="off"
                inputMode="email"
              />
            </div>
            <p className={adminHint}>Type an address and press Enter (or comma) to add more recipients.</p>
            {toDraftError ? <p className="text-xs text-rose-600">{toDraftError}</p> : null}
            {fieldErrors.to?.[0] ? <p className="text-xs text-rose-600">{fieldErrors.to[0]}</p> : null}
          </div>

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
          <p className={adminHint}>Plain text. Line breaks are preserved. Logo header is added automatically.</p>
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Internal audit trail for outbound founder emails, with delivery status from Resend.</p>
          <button type="button" className={adminGhostButton} onClick={() => void refreshStatuses()} disabled={checkingStatus}>
            <RefreshCw className={`mr-2 h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} /> Refresh status
          </button>
        </div>

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
                  {(() => {
                    const info = log.status === "sent" ? describeStatus(log.deliveryStatus ?? "sent") : describeStatus("failed")
                    // Until Resend reports a delivery status, keep the original look: a green "sent".
                    const unknown = log.status === "sent" && !log.deliveryStatus
                    const tone =
                      info.tone === "good" || unknown
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : info.tone === "pending"
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "border border-rose-200 bg-rose-50 text-rose-700"
                    return (
                      <span
                        title={log.statusNote || info.hint}
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}
                      >
                        {info.label}
                      </span>
                    )
                  })()}
                </div>
                <p className="mt-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                {log.errorMessage ? <p className="mt-2 text-xs text-rose-600">{log.errorMessage}</p> : null}
                {log.statusNote && !log.errorMessage && statusReadable ? <p className="mt-2 text-xs text-amber-700">{log.statusNote}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
