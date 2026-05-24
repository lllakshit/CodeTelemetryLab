import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { redirect } from "next/navigation"
import { z } from "zod"
import { addMediaAsset } from "@/lib/cms"

const uploadSchema = z.object({
  name: z.string().min(2),
  alt: z.string().min(2),
})

function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/jpeg":
    case "image/jpg":
      return "jpg"
    default:
      return "bin"
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const parsed = uploadSchema.safeParse({
    name: formData.get("name"),
    alt: formData.get("alt"),
  })

  const file = formData.get("file")
  if (!parsed.success || !(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Upload requires a file, name, and alt text." }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  const ext = extensionForMime(file.type)
  const filename = `${randomUUID()}.${ext}`
  const filePath = path.join(uploadsDir, filename)
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  await addMediaAsset({
    name: parsed.data.name,
    alt: parsed.data.alt,
    url: `/uploads/${filename}`,
    mimeType: file.type,
    size: file.size,
  })

  redirect("/admin/media?uploaded=1")
}
