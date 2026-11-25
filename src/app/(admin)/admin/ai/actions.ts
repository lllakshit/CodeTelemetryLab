"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@/auth"
import { applyAction } from "@/lib/ai/apply"
import { decideAction, deleteThread, updateThread } from "@/lib/ai/store"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

const id = z.string().uuid()

export async function renameThreadAction(formData: FormData) {
  await requireAdmin()
  const title = z.string().trim().min(1).max(120).parse(formData.get("title"))
  await updateThread(id.parse(formData.get("id")), { title })
  revalidatePath("/admin/ai")
}

export async function pinThreadAction(formData: FormData) {
  await requireAdmin()
  await updateThread(id.parse(formData.get("id")), { pinned: formData.get("pinned") === "1" })
  revalidatePath("/admin/ai")
}

export async function archiveThreadAction(formData: FormData) {
  await requireAdmin()
  const threadId = id.parse(formData.get("id"))
  const archived = formData.get("archived") === "1"
  await updateThread(threadId, { archived })
  revalidatePath("/admin/ai")
  redirect(archived ? "/admin/ai" : `/admin/ai?t=${threadId}`)
}

/** Permanent: removes the chat, its messages and its proposals. The screen asks for confirmation first. */
export async function deleteThreadAction(formData: FormData) {
  await requireAdmin()
  await deleteThread(id.parse(formData.get("id")))
  revalidatePath("/admin/ai")
  redirect("/admin/ai")
}

export async function applyProposalAction(proposalId: string) {
  await requireAdmin()
  return applyAction(id.parse(proposalId))
}

export async function dismissProposalAction(proposalId: string) {
  await requireAdmin()
  const ok = await decideAction(id.parse(proposalId), "dismissed")
  return ok ? { ok: true as const } : { ok: false as const, error: "Already decided" }
}
