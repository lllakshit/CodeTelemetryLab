"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNowStrict } from "date-fns"
import { Archive, ArchiveRestore, Check, Loader2, MessageSquarePlus, Pin, PinOff, Send, Sparkles, Trash2, Wrench, X } from "lucide-react"
import {
  applyProposalAction,
  archiveThreadAction,
  deleteThreadAction,
  dismissProposalAction,
  pinThreadAction,
  renameThreadAction,
} from "@/app/(admin)/admin/ai/actions"
import { AiMarkdown } from "@/components/ai-markdown"
import { adminGhostButton, adminHint, adminSurface } from "@/lib/admin-ui"
import type { Action, Message, Thread } from "@/lib/ai/store"
import { cn } from "@/lib/utils"

const STARTERS = [
  "Give me today's overview: new leads, applications, traffic and search, versus the previous period.",
  "Which leads should I reply to first? Rank the open ones with a reason each.",
  "Where are my visitors and leads coming from in the last 30 days?",
  "Shortlist the job applications: who looks strongest and why?",
  "Find my top 5 SEO opportunities in Search Console and propose new titles and descriptions.",
  "Audit the homepage SEO and list what to fix first.",
]

const KIND_LABEL: Record<Action["kind"], string> = { blog_seo: "Blog SEO", lead_update: "Lead", application_update: "Application" }

type Props = {
  threads: Thread[]
  thread: Thread | null
  messages: Message[]
  actions: Action[]
  showArchived: boolean
  search: string
  initialPrompt: string
  ready: boolean
  keyName: string | null
  model: string
  loadError: string | null
}

function ago(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNowStrict(date, { addSuffix: true })
}

export function AdminAiChat(props: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(props.messages)
  const [actions, setActions] = useState<Action[]>(props.actions)
  const [threadId, setThreadId] = useState<string | null>(props.thread?.id ?? null)
  const [draft, setDraft] = useState(props.initialPrompt)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const localId = useRef(0)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages.length, sending])

  async function send(text: string) {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setError(null)
    setDraft("")
    const optimistic: Message = { id: `local-${(localId.current += 1)}`, threadId: threadId ?? "", role: "user", content: message, toolCalls: [], model: null, tokens: null, createdAt: new Date().toISOString() }
    setMessages((list) => [...list, optimistic])
    try {
      const response = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message }),
      })
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; threadId?: string | null; user?: Message | null; assistant?: Message; actions?: Action[] }
      const newThread = data.threadId && data.threadId !== threadId ? data.threadId : null
      if (data.threadId) setThreadId(data.threadId)
      if (!response.ok || !data.ok || !data.assistant) {
        // The question is saved even when the answer failed, so keep it and show the error.
        setMessages((list) => list.map((m) => (m.id === optimistic.id && data.user ? data.user : m)))
        setError(data.error || `The assistant failed (HTTP ${response.status}).`)
        if (newThread) router.replace(`/admin/ai?t=${newThread}`, { scroll: false })
        return
      }
      setMessages((list) => [...list.filter((m) => m.id !== optimistic.id), data.user!, data.assistant!])
      setActions(data.actions ?? [])
      if (newThread) router.replace(`/admin/ai?t=${newThread}`, { scroll: false })
      else router.refresh()
    } catch {
      setError("Connection lost. The answer may still be saved: reload the chat in a minute.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ThreadList {...props} activeId={threadId} />

      <section className={cn(adminSurface, "flex min-h-[70vh] flex-col")}>
        <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI assistant · live data</p>
            {props.thread ? <ThreadTitle thread={props.thread} /> : <h1 className="text-lg font-semibold text-slate-950">New chat</h1>}
          </div>
          {props.thread ? <ThreadMenu thread={props.thread} /> : null}
        </header>

        {!props.ready ? (
          <div className="mx-5 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Add <strong>GROQ_AI_LAYER_KEY</strong> in Vercel (Production and Preview) and redeploy to switch the assistant on.
          </div>
        ) : null}
        {props.loadError ? <div className="mx-5 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{props.loadError}</div> : null}

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-[#0064e0]" />
                <p className="text-sm leading-6 text-slate-700">
                  Ask about leads, job applications, where visitors come from, or Search Console. Every answer is built from live database and Google data, and any change it suggests waits for your Apply.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    disabled={!props.ready || sending}
                    onClick={() => send(starter)}
                    className="rounded-2xl border border-[rgba(10,19,23,0.1)] bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-950 disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} actions={actions.filter((a) => a.messageId === message.id)} onAction={(next) => setActions((list) => list.map((a) => (a.id === next.id ? next : a)))} />
          ))}

          {/* Proposals not yet linked to an answer (the answer failed after proposing). */}
          {actions.filter((a) => !a.messageId).length ? (
            <div className="space-y-2">
              {actions
                .filter((a) => !a.messageId)
                .map((action) => (
                  <ProposalCard key={action.id} action={action} onChange={(next) => setActions((list) => list.map((a) => (a.id === next.id ? next : a)))} />
                ))}
            </div>
          ) : null}

          {sending ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking live data…
            </div>
          ) : null}
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          <div ref={bottom} />
        </div>

        <form
          className="border-t border-slate-100 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            send(draft)
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send(draft)
                }
              }}
              rows={2}
              maxLength={8000}
              disabled={!props.ready}
              placeholder={props.ready ? "Ask anything about leads, applications, traffic or SEO… (Enter to send, Shift+Enter for a new line)" : "Assistant is off until the Groq key is set"}
              className="min-h-[52px] flex-1 resize-y rounded-2xl border border-[rgba(10,19,23,0.12)] bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
            <button type="submit" disabled={!props.ready || sending || !draft.trim()} className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#0064e0] text-white transition hover:bg-[#0457cb] disabled:opacity-40" aria-label="Send">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className={cn(adminHint, "mt-2")}>
            Groq {props.model}
            {props.keyName ? ` · key ${props.keyName}` : ""} · read-only tools; changes need your Apply.
          </p>
        </form>
      </section>
    </div>
  )
}

function ThreadList({ threads, showArchived, search, activeId }: Props & { activeId: string | null }) {
  return (
    <aside className={cn(adminSurface, "flex max-h-[80vh] flex-col p-4")}>
      <Link href="/admin/ai" className={cn(adminGhostButton, "mb-3 w-full gap-2")}>
        <MessageSquarePlus className="h-4 w-4" /> New chat
      </Link>
      <form action="/admin/ai" className="mb-3">
        {showArchived ? <input type="hidden" name="archived" value="1" /> : null}
        <input name="q" defaultValue={search} placeholder="Search chats" className="w-full rounded-full border border-[rgba(10,19,23,0.12)] bg-white px-4 py-2 text-sm" />
      </form>
      <div className="mb-2 flex gap-2 text-xs font-semibold">
        <Link href="/admin/ai" className={cn("rounded-full px-3 py-1", !showArchived ? "bg-slate-950 text-white" : "text-slate-600")}>
          Saved
        </Link>
        <Link href="/admin/ai?archived=1" className={cn("rounded-full px-3 py-1", showArchived ? "bg-slate-950 text-white" : "text-slate-600")}>
          Archived
        </Link>
      </div>
      <nav className="-mx-1 flex-1 space-y-1 overflow-y-auto">
        {threads.length === 0 ? <p className={cn(adminHint, "px-2")}>{search ? "No chats match." : showArchived ? "No archived chats." : "No chats yet."}</p> : null}
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/admin/ai?t=${t.id}${showArchived ? "&archived=1" : ""}`}
            aria-current={t.id === activeId ? "page" : undefined}
            className={cn("block rounded-2xl px-3 py-2 transition", t.id === activeId ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100")}
          >
            <span className="flex items-center gap-1.5 truncate text-sm font-medium">
              {t.pinned ? <Pin className="h-3 w-3 shrink-0" /> : null}
              <span className="truncate">{t.title}</span>
            </span>
            <span className={cn("text-xs", t.id === activeId ? "text-white/70" : "text-slate-500")}>
              {t.messageCount} messages · {ago(t.updatedAt)}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function ThreadTitle({ thread }: { thread: Thread }) {
  const [editing, setEditing] = useState(false)
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="max-w-full truncate text-left text-lg font-semibold text-slate-950 hover:underline" title="Rename">
        {thread.title}
      </button>
    )
  }
  return (
    <form action={renameThreadAction} onSubmit={() => setEditing(false)} className="flex gap-2">
      <input type="hidden" name="id" value={thread.id} />
      <input name="title" defaultValue={thread.title} maxLength={120} autoFocus className="min-w-0 flex-1 rounded-full border border-slate-300 px-3 py-1 text-sm" />
      <button type="submit" className="text-sm font-semibold text-[#0064e0]">
        Save
      </button>
    </form>
  )
}

function ThreadMenu({ thread }: { thread: Thread }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={pinThreadAction}>
        <input type="hidden" name="id" value={thread.id} />
        <input type="hidden" name="pinned" value={thread.pinned ? "0" : "1"} />
        <button type="submit" className={cn(adminGhostButton, "gap-1.5 px-3 py-1.5 text-xs")}>
          {thread.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />} {thread.pinned ? "Unpin" : "Pin"}
        </button>
      </form>
      <form action={archiveThreadAction}>
        <input type="hidden" name="id" value={thread.id} />
        <input type="hidden" name="archived" value={thread.archived ? "0" : "1"} />
        <button type="submit" className={cn(adminGhostButton, "gap-1.5 px-3 py-1.5 text-xs")}>
          {thread.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />} {thread.archived ? "Restore" : "Archive"}
        </button>
      </form>
      <form
        action={deleteThreadAction}
        onSubmit={(event) => {
          if (!window.confirm("Delete this chat and its messages permanently? This cannot be undone.")) event.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={thread.id} />
        <button type="submit" className={cn(adminGhostButton, "gap-1.5 px-3 py-1.5 text-xs text-rose-700")}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ message, actions, onAction }: { message: Message; actions: Action[]; onAction: (a: Action) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white">{message.content}</div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="max-w-full rounded-3xl rounded-bl-md border border-slate-100 bg-white px-4 py-3">
        <AiMarkdown text={message.content} />
      </div>
      {message.toolCalls.length ? (
        <details className="px-1 text-xs text-slate-500">
          <summary className="inline-flex cursor-pointer items-center gap-1.5">
            <Wrench className="h-3 w-3" /> Checked {message.toolCalls.map((t) => t.name.replace(/_/g, " ")).join(", ")}
          </summary>
          <ul className="mt-1 space-y-0.5 pl-5">
            {message.toolCalls.map((t, i) => (
              <li key={i} className={t.ok ? "" : "text-rose-600"}>
                {t.name}: {t.preview}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {actions.map((action) => (
        <ProposalCard key={action.id} action={action} onChange={onAction} />
      ))}
    </div>
  )
}

function ProposalCard({ action, onChange }: { action: Action; onChange: (a: Action) => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(action.error)
  const keys = Object.keys(action.after)

  function decide(apply: boolean) {
    startTransition(async () => {
      const result = apply ? await applyProposalAction(action.id) : await dismissProposalAction(action.id)
      if (result.ok) {
        setError(null)
        onChange({ ...action, status: apply ? "applied" : "dismissed" })
      } else {
        setError(result.error)
        if (apply) onChange({ ...action, status: "failed", error: result.error })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-[#cfe0fb] bg-[#f4f8ff] p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-950">
          Proposed: {KIND_LABEL[action.kind]} · {action.targetLabel}
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            action.status === "pending" && "bg-amber-100 text-amber-800",
            action.status === "applied" && "bg-emerald-100 text-emerald-800",
            action.status === "dismissed" && "bg-slate-200 text-slate-600",
            action.status === "failed" && "bg-rose-100 text-rose-700",
          )}
        >
          {action.status}
        </span>
      </div>
      {action.reason ? <p className="mt-1 text-xs leading-5 text-slate-600">{action.reason}</p> : null}
      <dl className="mt-3 space-y-2">
        {keys.map((key) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[130px_1fr]">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{key.replace(/_/g, " ")}</dt>
            <dd className="space-y-0.5">
              <p className="text-xs text-slate-500 line-through">{String(action.before[key] ?? "(empty)")}</p>
              <p className="text-slate-900">
                {String(action.after[key])} <span className="text-xs text-slate-500">({String(action.after[key]).length} chars)</span>
              </p>
            </dd>
          </div>
        ))}
      </dl>
      {action.status === "pending" ? (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={pending} onClick={() => decide(true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Apply
          </button>
          <button type="button" disabled={pending} onClick={() => decide(false)} className={cn(adminGhostButton, "gap-1.5 px-4 py-2 text-xs")}>
            <X className="h-3.5 w-3.5" /> Dismiss
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  )
}
