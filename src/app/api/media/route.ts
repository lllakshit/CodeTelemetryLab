import { randomUUID } from "node:crypto"
import { redirect } from "next/navigation"
import { z } from "zod"
import { addMediaAsset } from "@/lib/cms"
import { createSupabaseAdminClient, SUPABASE_MEDIA_BUCKET } from "@/lib/supabase"

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

async function ensureMediaBucket() {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.storage.listBuckets()

  if (error) throw error

  const bucket = data?.find((entry) => entry.name === SUPABASE_MEDIA_BUCKET)
  if (!bucket) {
    const { error: createError } = await supabase.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
      public: true,
    })
    if (createError) throw createError
    return supabase
  }

  if (!bucket.public) {
    const { error: updateError } = await supabase.storage.updateBucket(SUPABASE_MEDIA_BUCKET, {
      public: true,
    })
    if (updateError) throw updateError
  }

  return supabase
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

  const supabase = await ensureMediaBucket()
  const ext = extensionForMime(file.type)
  const storagePath = `uploads/${randomUUID()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(storagePath)

  await addMediaAsset({
    name: parsed.data.name,
    alt: parsed.data.alt,
    url: publicUrl.publicUrl,
    storageBucket: SUPABASE_MEDIA_BUCKET,
    storagePath,
    mimeType: file.type,
    size: file.size,
  })

  redirect("/admin/media?uploaded=1")
}
