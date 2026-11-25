import { AdminAiChat } from "@/components/admin-ai-chat"
import { aiKey, currentAiModel } from "@/lib/ai/groq-chat"
import { getThread, listActions, listMessages, listThreads, type Action, type Message, type Thread } from "@/lib/ai/store"

export const dynamic = "force-dynamic"

type PageProps = { searchParams?: Promise<{ t?: string; archived?: string; q?: string; prompt?: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function AdminAiPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showArchived = params?.archived === "1"
  let threads: Thread[] = []
  let thread: Thread | null = null
  let messages: Message[] = []
  let actions: Action[] = []
  let loadError: string | null = null
  try {
    threads = await listThreads({ archived: showArchived, search: params?.q })
    if (params?.t && UUID.test(params.t)) {
      thread = await getThread(params.t)
      if (thread) [messages, actions] = await Promise.all([listMessages(thread.id), listActions(thread.id)])
    }
  } catch (error) {
    loadError = error instanceof Error && /ai_threads|ai_messages/.test(error.message) ? "The AI tables are missing: apply migration 20261125000000_search_console_ai.sql." : "Chats could not be loaded."
  }
  const key = aiKey()

  return (
    <AdminAiChat
      key={thread?.id ?? "new"}
      threads={threads}
      thread={thread}
      messages={messages}
      actions={actions}
      showArchived={showArchived}
      search={params?.q ?? ""}
      initialPrompt={params?.prompt?.slice(0, 2000) ?? ""}
      ready={Boolean(key)}
      keyName={key?.name ?? null}
      model={currentAiModel()}
      loadError={loadError}
    />
  )
}
