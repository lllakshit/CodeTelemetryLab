"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import { accessToken, googleClient, listSites, revokeToken } from "@/lib/search-console/google"
import { deleteConnection, getRefreshToken, setSite } from "@/lib/search-console/store"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
}

/** Saves the chosen property, after checking the connected account really has it. */
export async function chooseSiteAction(formData: FormData) {
  await requireAdmin()
  const siteUrl = z.string().min(3).max(500).parse(formData.get("siteUrl"))
  const client = googleClient()
  const saved = await getRefreshToken()
  if (!client || !saved.ok) throw new Error("Search Console is not connected")
  const sites = await listSites(await accessToken(client, saved.token))
  if (!sites.some((site) => site.siteUrl === siteUrl)) throw new Error("That property is not in the connected Google account")
  await setSite(siteUrl)
  revalidatePath("/admin/search-console")
}

/** Disconnects: revokes the Google token and deletes it. Synced numbers are kept unless "also delete data" is ticked. */
export async function disconnectAction(formData: FormData) {
  await requireAdmin()
  const saved = await getRefreshToken()
  if (saved.ok) await revokeToken(saved.token)
  await deleteConnection(formData.get("purge") === "on")
  revalidatePath("/admin/search-console")
}
