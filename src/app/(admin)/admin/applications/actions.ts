"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { applicationStatuses, updateApplication, type ApplicationStatus } from "@/lib/applications"

export async function updateApplicationAction(formData: FormData) {
  // Server actions are public endpoints: check the admin session here, not only in the layout.
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const notes = String(formData.get("notes") ?? "")

  if (!/^[0-9a-f-]{36}$/i.test(id) || !(applicationStatuses as readonly string[]).includes(status)) {
    throw new Error("Invalid application update")
  }

  await updateApplication(id, { status: status as ApplicationStatus, notes })
  revalidatePath("/admin/applications")
  revalidatePath(`/admin/applications/${id}`)
  redirect(`/admin/applications/${id}?saved=1`)
}
