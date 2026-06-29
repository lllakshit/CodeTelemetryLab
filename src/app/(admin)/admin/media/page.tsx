import { Trash2, Upload } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { deleteMediaAction } from "@/app/(admin)/admin/actions"
import {
  adminAccentButton,
  adminDangerButton,
  adminFieldLabel,
  adminInputClassName,
  adminSurface,
} from "@/lib/admin-ui"
import { listMedia } from "@/lib/cms"
import { filenameFromUrl } from "@/lib/utils"

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams?: Promise<{ uploaded?: string; error?: string }>
}) {
  const media = await listMedia()
  const resolvedSearchParams = await searchParams
  const uploaded = resolvedSearchParams?.uploaded === "1"
  const error = resolvedSearchParams?.error

  const errorMessage =
    error === "missing"
      ? "Choose an image, asset name, and alt text before uploading."
      : error === "type"
        ? "Only image uploads are supported here."
        : error === "cms-schema"
          ? "Supabase media tables are unavailable for this deployment. Apply supabase/schema.sql to the connected Supabase project."
        : error === "storage" || error === "storage-config"
          ? "Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then create a public media-assets bucket in Supabase."
          : error === "unauthorized"
            ? "Sign in again before uploading assets."
            : error === "upload"
            ? "The upload failed before the asset could be saved. Check the Vercel function logs and Supabase storage settings."
            : null

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Media library"
        title="Upload and manage assets."
        description="Assets now land in Supabase Storage and are recorded in the CMS layer so Vercel deploys stay serverless."
      />

      {uploaded ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Asset uploaded successfully.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <form action="/api/media" method="post" encType="multipart/form-data" className={`${adminSurface} p-6`}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className={adminFieldLabel}>Asset name</span>
            <input
              name="name"
              required
              className={adminInputClassName()}
              placeholder="Homepage hero screenshot"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className={adminFieldLabel}>Alt text</span>
            <input
              name="alt"
              required
              className={adminInputClassName()}
              placeholder="Homepage hero visual"
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className={adminFieldLabel}>Upload file</span>
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="w-full rounded-[1rem] border border-[#ced0d4] bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
          </label>
        </div>
        <button type="submit" className={`${adminAccentButton} mt-6 gap-2`}>
          <Upload className="h-4 w-4" />
          Upload asset
        </button>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Uploaded image URLs can be pasted into blog featured images, embedded in blog markdown with
          <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">![Alt text](image-url)</code>
          , or used in project screenshot fields.
        </p>
      </form>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((asset) => (
          <article key={asset.id} className={`${adminSurface} overflow-hidden`}>
            <div className="aspect-[16/10] border-b border-[rgba(10,19,23,0.08)] bg-[#eef3f8]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.alt} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 p-5">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{asset.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{asset.alt}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {asset.storagePath ? asset.storagePath : filenameFromUrl(asset.url)}
                </p>
              </div>
              <div className="space-y-2 rounded-[1.25rem] bg-slate-50 p-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Direct URL</p>
                  <p className="mt-2 break-all text-xs text-slate-700">{asset.url}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Markdown</p>
                  <p className="mt-2 break-all text-xs text-slate-700">{`![${asset.alt}](${asset.url})`}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[14rem] truncate text-xs text-blue-700 transition hover:text-blue-900"
                >
                  {asset.url}
                </a>
                <form action={deleteMediaAction}>
                  <input type="hidden" name="id" value={asset.id} />
                  <button type="submit" className={`${adminDangerButton} gap-2`}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
