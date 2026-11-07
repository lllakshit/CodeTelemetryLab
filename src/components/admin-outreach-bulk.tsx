"use client"

import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { Download, Eye, FileSpreadsheet, Loader2, Send, Square } from "lucide-react"
import {
  adminAccentButton,
  adminFieldLabel,
  adminGhostButton,
  adminHint,
  adminInputClassName,
  adminSecondaryButton,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import { planDelivery, toEmailAttachments } from "@/lib/outreach/attachments"
import { bulkAttachments, parseBulkTable, readSheetFile, sheetTemplateCsv, type BulkRow, type Table } from "@/lib/outreach/sheet"
import { renderOutreachEmail } from "@/lib/outreach/template"
import type { OutreachAccount, OutreachMessage } from "@/lib/outreach/store"

type Props = {
  accounts: OutreachAccount[]
  brand: { name: string; siteUrl: string; logoUrl: string }
  /** Called after an email goes out so the delivery list below can refresh. */
  onSent: () => void
}

type RowState = { state: "sending" | "sent" | "failed"; error?: string }

const PAUSE_BETWEEN_EMAILS_MS = 1200

export function AdminOutreachBulk({ accounts, brand, onSent }: Props) {
  const defaultAccount = accounts.find((account) => account.isDefault) ?? accounts[0]
  const [accountId, setAccountId] = useState(defaultAccount?.id ?? "")
  const account = accounts.find((item) => item.id === accountId) ?? defaultAccount

  const [subject, setSubject] = useState("")
  // null means "follow the selected sender's signature"; a string is what the writer typed for this batch.
  const [signatureDraft, setSignatureDraft] = useState<string | null>(null)
  const signature = signatureDraft ?? account?.signature ?? ""
  const [showFooter, setShowFooter] = useState(true)

  const [fileName, setFileName] = useState("")
  const [table, setTable] = useState<Table | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [states, setStates] = useState<Record<number, RowState>>({})
  const [previewLine, setPreviewLine] = useState<number | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const stopRequested = useRef(false)
  // Rows that are being sent right now, so a double click or "Send all" plus a single click cannot send one twice.
  const inFlight = useRef(new Set<number>())
  // One id per row, so a retry after a lost connection cannot send the same email twice.
  const draftIds = useRef(new Map<number, string>())
  const fileInput = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => (table ? parseBulkTable(table, { defaultSubject: subject }) : null), [table, subject])
  const rows = parsed?.rows ?? []
  const validRows = rows.filter((row) => row.problems.length === 0)
  const waiting = validRows.filter((row) => states[row.line]?.state !== "sent")
  const sentCount = rows.filter((row) => states[row.line]?.state === "sent").length
  const failedCount = rows.filter((row) => states[row.line]?.state === "failed").length

  const previewRow = rows.find((row) => row.line === previewLine) ?? null
  const preview = useMemo(() => {
    if (!account || !previewRow) return null
    return renderOutreachEmail({
      subject: previewRow.subject || "(no subject)",
      body: previewRow.message,
      signature,
      attachments: toEmailAttachments(planDelivery(bulkAttachments(previewRow))),
      senderName: account.displayName,
      senderEmail: account.fromEmail,
      brandName: brand.name,
      siteUrl: brand.siteUrl,
      logoUrl: brand.logoUrl,
      showFooter,
    })
  }, [account, brand, previewRow, showFooter, signature])

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setFileError(null)
    try {
      const next = await readSheetFile(file.name, new Uint8Array(await file.arrayBuffer()))
      setTable(next)
      setFileName(file.name)
      setStates({})
      setPreviewLine(null)
      draftIds.current = new Map()
    } catch (error) {
      setTable(null)
      setFileName("")
      setFileError(error instanceof Error ? error.message : "That file could not be read.")
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([sheetTemplateCsv()], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "outreach-bulk-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  function setState(line: number, value: RowState | null) {
    setStates((current) => {
      const next = { ...current }
      if (value) next[line] = value
      else delete next[line]
      return next
    })
  }

  /** Sends one row. Returns true when the email went out. */
  async function sendRow(row: BulkRow): Promise<boolean> {
    if (!account || row.problems.length > 0) return false
    if (states[row.line]?.state === "sent" || inFlight.current.has(row.line)) return false
    inFlight.current.add(row.line)
    setState(row.line, { state: "sending" })
    let draftId = draftIds.current.get(row.line)
    if (!draftId) {
      draftId = crypto.randomUUID()
      draftIds.current.set(row.line, draftId)
    }
    try {
      const response = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          accountId: account.id,
          to: row.to,
          cc: [],
          bcc: [],
          subject: row.subject,
          body: row.message,
          signature,
          showFooter,
          attachments: bulkAttachments(row),
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: OutreachMessage }
      if (!response.ok || data.message?.status === "failed") {
        // The server recorded this attempt as failed, so the email did not go out: the next try needs a fresh id.
        draftIds.current.delete(row.line)
        setState(row.line, { state: "failed", error: data.error || data.message?.errorMessage || "The email could not be sent." })
        return false
      }
      setState(row.line, { state: "sent" })
      onSent()
      return true
    } catch {
      // No answer: the email may or may not have gone out. The same id is kept, so a retry cannot send it twice.
      setState(row.line, { state: "failed", error: "No answer from the server. Check the delivery list below before trying again." })
      return false
    } finally {
      inFlight.current.delete(row.line)
    }
  }

  async function sendAll() {
    if (!account || sendingAll || waiting.length === 0) return
    const ok = window.confirm(
      `Send ${waiting.length} email${waiting.length === 1 ? "" : "s"} from ${account.fromEmail}?\n\nEach row goes to its own recipient. Sent email cannot be recalled.`,
    )
    if (!ok) return
    stopRequested.current = false
    setSendingAll(true)
    try {
      for (const [position, row] of waiting.entries()) {
        if (stopRequested.current) break
        // Stop on the first failure so a broken key or a bad setup does not fail every row.
        if (!(await sendRow(row))) break
        if (position < waiting.length - 1) await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_EMAILS_MS))
      }
    } finally {
      setSendingAll(false)
    }
  }

  if (accounts.length === 0) return null

  return (
    <section className={`${adminSurface} space-y-5 p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Bulk</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Send from a sheet</h2>
          <p className={`${adminHint} mt-2 max-w-2xl`}>
            Upload a .csv or .xlsx file. Every row is one email. The first row must hold the headers{" "}
            <strong>To</strong>, <strong>pitch deck</strong>, <strong>resume to be sent</strong> and <strong>message</strong>
            ; an optional <strong>Subject</strong> column gives each row its own subject.
          </p>
        </div>
        <button type="button" className={adminGhostButton} onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" /> Sample file
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className={adminFieldLabel}>From</span>
          <select
            className={adminInputClassName()}
            value={account?.id ?? ""}
            onChange={(event) => {
              setAccountId(event.target.value)
              setSignatureDraft(null)
            }}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName} &lt;{item.fromEmail}&gt;
                {item.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className={adminFieldLabel}>Subject for every email</span>
          <input
            className={adminInputClassName()}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={parsed?.hasSubjectColumn ? "Used for rows with no Subject cell" : "Required if the sheet has no Subject column"}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className={adminFieldLabel}>Sign-off and signature</span>
        <textarea className={adminTextareaClassName("min-h-24")} value={signature} onChange={(event) => setSignatureDraft(event.target.value)} />
        <span className={adminHint}>Added under every message in this batch. Prefilled from the sender account.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={showFooter} onChange={(event) => setShowFooter(event.target.checked)} />
        <span>
          Show the {brand.name} footer (logo, site and sender line)
          <span className={`${adminHint} block`}>Turn this off for email that goes out under another name, such as a different project.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" accept=".csv,.tsv,.xlsx,text/csv" className="hidden" onChange={(event) => void onFile(event)} />
        <button type="button" className={adminSecondaryButton} onClick={() => fileInput.current?.click()} disabled={sendingAll}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {table ? "Choose another sheet" : "Upload a sheet"}
        </button>
        {fileName ? <span className="text-sm text-slate-600">{fileName}</span> : null}
      </div>
      {fileError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{fileError}</p> : null}
      {parsed?.fileProblems.map((problem) => (
        <p key={problem} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {problem}
        </p>
      ))}

      {rows.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              {rows.length} row{rows.length === 1 ? "" : "s"} · {validRows.length} ready · {sentCount} sent
              {failedCount ? ` · ${failedCount} failed` : ""}
              {rows.length - validRows.length ? ` · ${rows.length - validRows.length} need fixing` : ""}
            </p>
            <div className="flex items-center gap-3">
              {sendingAll ? (
                <button type="button" className={adminSecondaryButton} onClick={() => {
                    stopRequested.current = true
                  }}>
                  <Square className="mr-2 h-4 w-4" /> Stop after this one
                </button>
              ) : null}
              <button type="button" className={adminAccentButton} onClick={() => void sendAll()} disabled={sendingAll || waiting.length === 0}>
                {sendingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send all ({waiting.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ced0d4]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Attached</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const state = states[row.line]
                  const invalid = row.problems.length > 0
                  return (
                    <tr key={row.line} className={`border-t border-[#e4e6eb] align-top ${previewLine === row.line ? "bg-blue-50/50" : ""}`}>
                      <td className="px-4 py-3 text-slate-500">{row.line}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.to.join(", ") || "—"}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{row.subject || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {[row.deckUrl ? "Pitch deck" : "", row.resumeUrl ? "Resume" : ""].filter(Boolean).join(" + ") || "None"}
                      </td>
                      <td className="px-4 py-3">
                        {invalid ? (
                          <ul className="space-y-1 text-xs text-rose-700">
                            {row.problems.map((problem) => (
                              <li key={problem}>{problem}</li>
                            ))}
                          </ul>
                        ) : state?.state === "sent" ? (
                          <span className="text-emerald-700">Sent</span>
                        ) : state?.state === "sending" ? (
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
                          </span>
                        ) : state?.state === "failed" ? (
                          <span className="text-xs text-rose-700">{state.error}</span>
                        ) : (
                          <span className="text-slate-500">Ready</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" className={adminGhostButton} onClick={() => setPreviewLine(previewLine === row.line ? null : row.line)}>
                            <Eye className="mr-2 h-4 w-4" /> {previewLine === row.line ? "Hide" : "Preview"}
                          </button>
                          <button
                            type="button"
                            className={adminSecondaryButton}
                            onClick={() => void sendRow(row)}
                            disabled={invalid || state?.state === "sent" || state?.state === "sending"}
                          >
                            <Send className="mr-2 h-4 w-4" /> {state?.state === "failed" ? "Retry" : "Send"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {previewRow && preview ? (
            <div className={`${adminSurfaceSoft} space-y-3 p-4`}>
              <div className="text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">From:</span> {account?.displayName} &lt;{account?.fromEmail}&gt;
                </p>
                <p>
                  <span className="font-semibold text-slate-900">To:</span> {previewRow.to.join(", ") || "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Subject:</span> {previewRow.subject || "—"}
                </p>
              </div>
              <iframe title={`Preview of row ${previewRow.line}`} srcDoc={preview.html} sandbox="" className="h-[32rem] w-full rounded-2xl border border-[#ced0d4] bg-white" />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
