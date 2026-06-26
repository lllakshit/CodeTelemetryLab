import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { z } from "zod"
import { addMediaAsset } from "@/lib/cms"
import { createSupabaseAdminClient, getSupabaseConfig, SUPABASE_MEDIA_BUCKET } from "@/lib/supabase"

const uploadSchema = z.object({
  name: z.string().min(2),
  alt: z.string().min(2),
})

const publicUploadsDir = path.join(process.cwd(), "public", "uploads")

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

function wantsJson(request: Request) {
  const url = new URL(request.url)
  return url.searchParams.get("return") === "json" || request.headers.get("accept")?.includes("application/json")
}

function redirectToMedia(request: Request, search: string) {
  return NextResponse.redirect(new URL(`/admin/media${search}`, request.url))
}

function mediaError(request: Request, code: string, message: string, status = 400) {
  if (wantsJson(request)) {
    return NextResponse.json({ error: message, code }, { status })
  }

  return redirectToMedia(request, `?error=${code}`)
}

function storageConfigMessage() {
  return "Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then create a public 'media-assets' bucket in Supabase."
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

async function uploadToSupabase(file: File) {
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

  return {
    url: publicUrl.publicUrl,
    storageBucket: SUPABASE_MEDIA_BUCKET,
    storagePath,
  }
}

async function uploadToLocal(file: File) {
  const ext = extensionForMime(file.type)
  const filename = `${randomUUID()}.${ext}`
  const destination = path.join(publicUploadsDir, filename)
  const bytes = Buffer.from(await file.arrayBuffer())

  await mkdir(publicUploadsDir, { recursive: true })
  await writeFile(destination, bytes)

  return {
    url: `/uploads/${filename}`,
    storageBucket: null,
    storagePath: `uploads/${filename}`,
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const parsed = uploadSchema.safeParse({
      name: formData.get("name"),
      alt: formData.get("alt"),
    })

    const file = formData.get("file")
    if (!parsed.success || !(file instanceof File) || file.size === 0) {
      return mediaError(request, "missing", "Choose an image, asset name, and alt text before uploading.")
    }

    if (!file.type.startsWith("image/")) {
      return mediaError(request, "type", "Only image uploads are supported here.")
    }

    const supabaseConfig = getSupabaseConfig()
    const canUseSupabaseStorage = Boolean(supabaseConfig.url && supabaseConfig.secretKey)
    const isVercelDeployment = Boolean(process.env.VERCEL)

    if (isVercelDeployment && !canUseSupabaseStorage) {
      return mediaError(
        request,
        "storage-config",
        storageConfigMessage(),
      )
    }

    const uploadResult = canUseSupabaseStorage
      ? await uploadToSupabase(file)
      : await uploadToLocal(file)

    if (!uploadResult) {
      return mediaError(request, "storage", storageConfigMessage())
    }

    const asset = await addMediaAsset({
      name: parsed.data.name,
      alt: parsed.data.alt,
      url: uploadResult.url,
      storageBucket: uploadResult.storageBucket,
      storagePath: uploadResult.storagePath,
      mimeType: file.type,
      size: file.size,
    })

    if (wantsJson(request)) {
      return NextResponse.json({ asset }, { status: 201 })
    }

    return redirectToMedia(request, "?uploaded=1")
  } catch (error) {
    console.error("Media upload failed", error)
    return mediaError(
      request,
      "upload",
      "The upload failed before the asset could be saved. Check the Vercel function logs and Supabase storage settings.",
      500,
    )
  }
}
