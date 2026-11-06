"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { createClient } from "@supabase/supabase-js"
import { Eye, KeyRound, Link2, Loader2, Paperclip, RefreshCw, Send, Star, Upload, X } from "lucide-react"
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
import {
  MAX_ATTACHMENTS,
  describeLink,
  formatBytes,
  planDelivery,
  toEmailAttachments,
  type OutreachAttachment,
} from "@/lib/outreach/attachments"
import { describeStatus, isFinalStatus } from "@/lib/outreach/status"
import { renderOutreachEmail } from "@/lib/outreach/template"
import type { OutreachAccount, OutreachMessage } from "@/lib/outreach/store"

type Props = {
  initialAccounts: OutreachAccount[]
  initialMessages: OutreachMessage[]
  brand: { name: string; siteUrl: string; logoUrl: string }
  storage: { url?: string; publishableKey?: string }
  setupError?: string | null
}

type DraftAttachment = OutreachAttachment & { key: string; warning?: string | null }

/** Only the fields the server needs, without the screen-only key and warning. */
function toPayload(item: DraftAttachment): OutreachAttachment {
  return { kind: item.kind, name: item.name, url: item.url, size: item.size, mimeType: item.mimeType, storagePath: item.storagePath }
}

const TONE_CLASS = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  bad: "border-rose-200 bg-rose-50 text-rose-700",
} as const

function StatusChip({ status, note }: { status: string; note?: string | null }) {
  const info = describeStatus(status)
  return (
    <span
      title={note || info.hint}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${TONE_CLASS[info.tone]}`}
    >
      {info.label}
    </span>
  )
}

function parseList(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function AdminOutreachWorkspace({ initialAccounts, initialMessages, brand, storage, setupError }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [messages, setMessages] = useState(initialMessages)
  const defaultAccount = accounts.find((account) => account.isDefault) ?? accounts[0]
  const [accountId, setAccountId] = useState(defaultAccount?.id ?? "")
  const account = accounts.find((item) => item.id === accountId) ?? defaultAccount

  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  // null means "follow the selected sender's signature"; a string is what the writer typed for this email.
  const [signatureDraft, setSignatureDraft] = useState<string | null>(null)
  const signature = signatureDraft ?? account?.signature ?? ""
  const [attachments, setAttachments] = useState<DraftAttachment[]>([])
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  // One id per draft: a double click or a retry of the same draft can never send the email twice.
  const [draftId, setDraftId] = useState(() => crypto.randomUUID())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => {
    if (!account) return null
    // Files that travel as real attachments are not part of the email body, so only links appear here.
    const plan = planDelivery(attachments.map(toPayload))
    return renderOutreachEmail({
      subject: subject || "(no subject)",
      body: body || "Your message appears here.",
      signature,
      attachments: toEmailAttachments(plan),
      senderName: account.displayName,
      senderEmail: account.fromEmail,
      brandName: brand.name,
      siteUrl: brand.siteUrl,
      logoUrl: brand.logoUrl,
    })
  }, [account, attachments, body, brand, signature, subject])

  const refreshMessages = useCallback(async (withStatus: boolean) => {
    if (withStatus) setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/outreach/messages${withStatus ? "?refresh=1" : ""}`, { cache: "no-store" })
      const data = (await response.json()) as { messages?: OutreachMessage[] }
      if (Array.isArray(data.messages)) setMessages(data.messages)
    } catch {
      // Keep what is on screen if the refresh fails.
    } finally {
      if (withStatus) setRefreshing(false)
    }
  }, [])

  // Statuses come from Resend automatically: check on open and every 20 seconds while anything is unsettled.
  // Messages whose key can only send (note set) or that are older than two weeks will never change, so they do not keep polling.
  const [openedAt] = useState(() => Date.now())
  const hasPending = messages.some(
    (message) =>
      message.resendId &&
      !isFinalStatus(message.status) &&
      !message.statusNote &&
      openedAt - Date.parse(message.createdAt) < 14 * 24 * 60 * 60 * 1000,
  )
  useEffect(() => {
    if (!hasPending) return
    const first = setTimeout(() => void refreshMessages(true), 0)
    const timer = setInterval(() => void refreshMessages(true), 20_000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [hasPending, refreshMessages])

  async function checkLink(key: string, url: string) {
    try {
      const response = await fetch("/api/admin/outreach/check-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = (await response.json()) as { status?: string; message?: string }
      setAttachments((current) =>
        current.map((item) => (item.key === key ? { ...item, warning: data.status === "private" ? data.message : null } : item)),
      )
    } catch {
      // The check is advisory only.
    }
  }

  function addLink() {
    setError(null)
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can add at most ${MAX_ATTACHMENTS} attachments.`)
      return
    }
    let url: URL
    try {
      url = new URL(linkUrl.trim())
    } catch {
      setError("Enter a full link that starts with https://")
      return
    }
    if (url.protocol !== "https:") {
      setError("Links must start with https://")
      return
    }
    const key = crypto.randomUUID()
    setAttachments((current) => [
      ...current,
      { key, kind: "link", name: linkName.trim() || `${describeLink(url.toString()).provider} link`, url: url.toString() },
    ])
    setLinkName("")
    setLinkUrl("")
    void checkLink(key, url.toString())
  }

  async function uploadFile(file: File) {
    setError(null)
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can add at most ${MAX_ATTACHMENTS} attachments.`)
      return
    }
    if (!storage.url || !storage.publishableKey) {
      setError("File uploads are not configured on this site.")
      return
    }
    setUploading(true)
    try {
      const prepared = await fetch("/api/admin/outreach/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, size: file.size, mimeType: file.type }),
      })
      const data = (await prepared.json()) as { path?: string; token?: string; bucket?: string; publicUrl?: string; error?: string }
      if (!prepared.ok || !data.path || !data.token || !data.bucket || !data.publicUrl) {
        throw new Error(data.error || "Could not prepare the upload.")
      }
      const supabase = createClient(storage.url, storage.publishableKey, { auth: { persistSession: false } })
      const { error: uploadError } = await supabase.storage
        .from(data.bucket)
        .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type || undefined })
      if (uploadError) throw uploadError
      setAttachments((current) => [
        ...current,
        {
          key: crypto.randomUUID(),
          kind: "file",
          name: file.name,
          url: data.publicUrl as string,
          size: file.size,
          mimeType: file.type || undefined,
          storagePath: data.path as string,
        },
      ])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The upload failed. Try again.")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault()
    if (sending || !account) return
    setSending(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          accountId: account.id,
          to: parseList(to),
          cc: parseList(cc),
          bcc: parseList(bcc),
          subject,
          body,
          signature,
          attachments: attachments.map(toPayload),
        }),
      })
      const data = (await response.json()) as { error?: string; notice?: string | null; message?: OutreachMessage }
      if (!response.ok) throw new Error(data.error || "The email could not be sent.")
      setSuccess(`Sent from ${account.fromEmail}.${data.notice ? ` ${data.notice}` : ""}`)
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      setAttachments([])
      setDraftId(crypto.randomUUID())
      setSignatureDraft(null)
      setShowPreview(false)
      void refreshMessages(false)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "The email could not be sent.")
    } finally {
      setSending(false)
    }
  }

  const canSend = !sending && !uploading && Boolean(account) && parseList(to).length > 0 && Boolean(subject.trim()) && Boolean(body.trim())

  return (
    <div className="space-y-8">
      {setupError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{setupError}</p> : null}

      <form onSubmit={onSend} className={`${adminSurface} space-y-5 p-6`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Compose</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">New outreach email</h2>
        </div>

        {accounts.length === 0 ? (
          <p className={`${adminSurfaceSoft} px-4 py-5 text-sm text-slate-600`}>
            No sender account yet. Add one under Sender accounts below, or run the “Outreach sender sync” workflow to
            load the account stored in GitHub.
          </p>
        ) : (
          <>
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
              <span className={adminFieldLabel}>To</span>
              <input className={adminInputClassName()} value={to} onChange={(event) => setTo(event.target.value)} placeholder="name@company.com, another@company.com" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className={adminFieldLabel}>CC (optional)</span>
                <input className={adminInputClassName()} value={cc} onChange={(event) => setCc(event.target.value)} />
              </label>
              <label className="block space-y-2">
                <span className={adminFieldLabel}>BCC (optional)</span>
                <input className={adminInputClassName()} value={bcc} onChange={(event) => setBcc(event.target.value)} />
              </label>
            </div>
            <label className="block space-y-2">
              <span className={adminFieldLabel}>Subject</span>
              <input className={adminInputClassName()} value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className={adminFieldLabel}>Message</span>
              <textarea
                className={adminTextareaClassName("min-h-64")}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={"Hi Amy,\n\nOne short paragraph about why you are writing.\n\nOur materials:\n* Research Briefing: [Investor Deck](https://docs.google.com/...)\n* Portfolio: https://example.com\n\nCould you point me to the right people?"}
              />
              <span className={adminHint}>Start a line with * for a bullet. Write [text](https://link) or paste a plain link to make a link.</span>
            </label>
            <label className="block space-y-2">
              <span className={adminFieldLabel}>Sign-off and signature</span>
              <textarea
                className={adminTextareaClassName("min-h-28")}
                value={signature}
                onChange={(event) => setSignatureDraft(event.target.value)}
              />
              <span className={adminHint}>Prefilled from the sender account. Edit it here for this email only, or change it permanently under Sender accounts.</span>
            </label>

            <div className={`${adminSurfaceSoft} space-y-4 p-4`}>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Paperclip className="h-4 w-4" /> Attachments
                </p>
                <span className="text-xs text-slate-500">
                  {attachments.length} of {MAX_ATTACHMENTS}
                </span>
              </div>

              {attachments.length ? (
                <ul className="space-y-2">
                  {attachments.map((item) => (
                    <li key={item.key} className="rounded-xl border border-[#ced0d4] bg-white px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="mr-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            {item.kind === "file" ? "File" : describeLink(item.url).provider}
                          </span>
                          <span className="break-all font-medium text-slate-950">{item.name}</span>
                          {item.kind === "file" && item.size !== undefined ? (
                            <span className="ml-2 text-xs text-slate-500">{formatBytes(item.size)}</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                          onClick={() => setAttachments((current) => current.filter((entry) => entry.key !== item.key))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {item.warning ? <p className="mt-1 text-xs text-amber-700">{item.warning}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={adminHint}>Add a Google Drive or other link, or upload a file. Up to {MAX_ATTACHMENTS}.</p>
              )}

              <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <input className={adminInputClassName()} value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="Name (optional)" aria-label="Link name" />
                <input
                  className={adminInputClassName()}
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addLink()
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/…"
                  aria-label="Link address"
                />
                <button type="button" className={adminGhostButton} onClick={addLink} disabled={!linkUrl.trim()}>
                  <Link2 className="mr-2 h-4 w-4" /> Add link
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadFile(file)
                  }}
                />
                <button type="button" className={adminGhostButton} onClick={() => fileInput.current?.click()} disabled={uploading || attachments.length >= MAX_ATTACHMENTS}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload a file"}
                </button>
                <span className={adminHint}>
                  Files up to 20 MB in total travel as normal attachments. Larger files are sent as a download link, so there is no size limit. For Drive
                  links, set sharing to “Anyone with the link”.
                </span>
              </div>
            </div>

            {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={adminAccentButton} disabled={!canSend}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sending ? "Sending…" : "Send email"}
              </button>
              <button type="button" className={adminSecondaryButton} onClick={() => setShowPreview((value) => !value)}>
                <Eye className="mr-2 h-4 w-4" /> {showPreview ? "Hide preview" : "Preview"}
              </button>
            </div>

            {showPreview && preview ? (
              <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[32rem] w-full rounded-2xl border border-[#ced0d4] bg-white" />
            ) : null}
          </>
        )}
      </form>

      <section className={`${adminSurface} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Sent</p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Delivery status</h2>
            <p className="mt-2 text-sm text-slate-600">Updated from Resend automatically, so you do not need to open the Resend dashboard.</p>
          </div>
          <button type="button" className={adminGhostButton} onClick={() => void refreshMessages(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {messages.length === 0 ? (
            <p className={`${adminSurfaceSoft} px-4 py-5 text-sm text-slate-600`}>No outreach emails yet.</p>
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`${adminSurfaceSoft} px-4 py-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{message.subject}</p>
                    <p className="mt-1 text-sm text-slate-600">To: {message.to.join(", ")}</p>
                    <p className="text-xs text-slate-500">From: {message.fromEmail}</p>
                    {message.attachments.length ? (
                      <p className="text-xs text-slate-500">
                        {message.attachments.length} attachment{message.attachments.length === 1 ? "" : "s"}: {message.attachments.map((item) => item.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <StatusChip status={message.status} note={message.statusNote} />
                </div>
                <p className="mt-3 text-xs text-slate-500">{new Date(message.createdAt).toLocaleString()}</p>
                {message.errorMessage ? <p className="mt-2 text-xs text-rose-600">{message.errorMessage}</p> : null}
                {message.statusNote && !message.errorMessage ? <p className="mt-2 text-xs text-amber-700">{message.statusNote}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <AccountsSection accounts={accounts} onChange={setAccounts} />
    </div>
  )
}

function AccountsSection({ accounts, onChange }: { accounts: OutreachAccount[]; onChange: (accounts: OutreachAccount[]) => void }) {
  const [fromEmail, setFromEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [signature, setSignature] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  function edit(account: OutreachAccount) {
    setFromEmail(account.fromEmail)
    setDisplayName(account.displayName)
    setSignature(account.signature)
    setApiKey("")
    setMessage({ tone: "ok", text: `Editing ${account.fromEmail}. Leave the API key empty to keep the saved one.` })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/outreach/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail, displayName, signature, ...(apiKey.trim() ? { apiKey } : {}) }),
      })
      const data = (await response.json()) as { error?: string; accounts?: OutreachAccount[] }
      if (!response.ok || !data.accounts) throw new Error(data.error || "Could not save the account.")
      onChange(data.accounts)
      setMessage({ tone: "ok", text: "Saved. The API key is stored encrypted and is not shown again." })
      setFromEmail("")
      setDisplayName("")
      setApiKey("")
      setSignature("")
    } catch (saveError) {
      setMessage({ tone: "error", text: saveError instanceof Error ? saveError.message : "Could not save the account." })
    } finally {
      setBusy(false)
    }
  }

  async function makeDefault(id: string) {
    const response = await fetch("/api/admin/outreach/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const data = (await response.json()) as { accounts?: OutreachAccount[] }
    if (data.accounts) onChange(data.accounts)
  }

  return (
    <section className={`${adminSurface} space-y-6 p-6`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Sender accounts</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">Who emails are sent from</h2>
        <p className="mt-2 text-sm text-slate-600">
          Each account has its own Resend API key, so it never touches the contact@ setup used by the Email page. Add a sender email and its key and it is
          ready to use.
        </p>
      </div>

      <ul className="space-y-3">
        {accounts.length === 0 ? <li className={`${adminSurfaceSoft} px-4 py-5 text-sm text-slate-600`}>No accounts yet.</li> : null}
        {accounts.map((account) => (
          <li key={account.id} className={`${adminSurfaceSoft} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">
                {account.displayName} <span className="font-normal text-slate-600">&lt;{account.fromEmail}&gt;</span>
              </p>
              <p className="text-xs text-slate-500">
                <KeyRound className="mr-1 inline h-3 w-3" />
                API key ending {account.keyLast4} · {account.source === "github" ? "synced from GitHub" : "added here"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {account.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Star className="h-3 w-3" /> Default
                </span>
              ) : (
                <button type="button" className={adminGhostButton} onClick={() => void makeDefault(account.id)}>
                  Make default
                </button>
              )}
              <button type="button" className={adminGhostButton} onClick={() => edit(account)}>
                Edit
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={save} className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-950">Add or update an account</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className={adminFieldLabel}>Sender email</span>
            <input className={adminInputClassName()} type="email" required value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} placeholder="you@yourdomain.com" />
          </label>
          <label className="block space-y-2">
            <span className={adminFieldLabel}>Sender name</span>
            <input className={adminInputClassName()} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Lakshit Mathur" />
          </label>
        </div>
        <label className="block space-y-2">
          <span className={adminFieldLabel}>Resend API key</span>
          <input className={adminInputClassName()} type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="re_…" />
          <span className={adminHint}>The domain of the sender email must be verified in the Resend account this key belongs to. Stored encrypted; never shown again.</span>
        </label>
        <label className="block space-y-2">
          <span className={adminFieldLabel}>Default sign-off and signature</span>
          <textarea className={adminTextareaClassName("min-h-24")} value={signature} onChange={(event) => setSignature(event.target.value)} placeholder={"Warm regards,\nLakshit Mathur\nFounder, CodeTelemetryLab"} />
        </label>
        {message ? (
          <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-rose-700" : "text-emerald-700"}`}>
            {message.text}
          </p>
        ) : null}
        <button type="submit" className={adminAccentButton} disabled={busy || !fromEmail || !displayName}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save account
        </button>
      </form>
    </section>
  )
}
