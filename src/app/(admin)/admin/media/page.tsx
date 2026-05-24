import { Trash2, Upload } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { deleteMediaAction } from "@/app/(admin)/admin/actions"
import { listMedia } from "@/lib/cms"

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams?: { uploaded?: string }
}) {
  const media = await listMedia()
  const uploaded = searchParams?.uploaded === "1"

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Media library"
        title="Upload and manage assets."
        description="Assets are stored under the public uploads folder for phase one and recorded in the CMS store."
      />

      {uploaded ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Asset uploaded successfully.
        </div>
      ) : null}

      <form action="/api/media" method="post" encType="multipart/form-data" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Asset name</span>
            <input
              name="name"
              required
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
              placeholder="Homepage hero screenshot"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Alt text</span>
            <input
              name="alt"
              required
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
              placeholder="Homepage hero visual"
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">Upload file</span>
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-500"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          <Upload className="h-4 w-4" />
          Upload asset
        </button>
      </form>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04]">
            <div className="aspect-[16/10] border-b border-white/10 bg-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.alt} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 p-5">
              <div>
                <h3 className="text-base font-semibold text-white">{asset.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{asset.alt}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">{asset.url}</p>
                <form action={deleteMediaAction}>
                  <input type="hidden" name="id" value={asset.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
                  >
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
