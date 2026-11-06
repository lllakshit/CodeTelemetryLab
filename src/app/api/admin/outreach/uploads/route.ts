import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { createSupabaseAdminClient } from "@/lib/supabase"

const BUCKET = "outreach-attachments"

const schema = z.object({
  fileName: z.string().trim().min(1).max(200),
  size: z.number().int().min(0),
  mimeType: z.string().max(120).optional(),
})

function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/^\.+/, "")
    .slice(-120)
  return cleaned || "file"
}

/**
 * Gives the browser a one-time URL to upload a file straight to storage, so large files do not pass through
 * the server. The file can then be attached (small files) or linked (large files) when the email is sent.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 })

  const path = `${randomUUID()}/${safeFileName(parsed.data.fileName)}`
  try {
    const storage = createSupabaseAdminClient().storage.from(BUCKET)
    const { data, error } = await storage.createSignedUploadUrl(path)
    if (error || !data) throw error ?? new Error("No upload URL")
    return NextResponse.json({
      path,
      token: data.token,
      bucket: BUCKET,
      publicUrl: storage.getPublicUrl(path).data.publicUrl,
    })
  } catch (error) {
    console.error("Outreach: could not create an upload URL", error)
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 500 })
  }
}
