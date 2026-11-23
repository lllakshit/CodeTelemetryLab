"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { updateProspect } from "@/lib/lead-discovery/store"
import { PROSPECT_STATUSES } from "@/lib/lead-discovery/types"

const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(PROSPECT_STATUSES) })
const notesSchema = z.object({ id: z.string().uuid(), notes: z.string().max(5000) })

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

export async function setProspectStatusAction(formData: FormData) {
  await requireAdmin()
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") })
  if (!parsed.success) throw new Error("Invalid prospect status")
  await updateProspect(parsed.data.id, { status: parsed.data.status })
  revalidatePath("/admin/leads/prospects")
}

export async function saveProspectNotesAction(formData: FormData) {
  await requireAdmin()
  const parsed = notesSchema.safeParse({ id: formData.get("id"), notes: String(formData.get("notes") ?? "") })
  if (!parsed.success) throw new Error("Notes are too long")
  await updateProspect(parsed.data.id, { notes: parsed.data.notes.trim() || null })
  revalidatePath("/admin/leads/prospects")
}
