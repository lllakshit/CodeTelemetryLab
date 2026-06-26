"use client"

import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { Check, ImageIcon, Link2, Search, Upload, X } from "lucide-react"
import {
  adminAccentButton,
  adminFieldLabel,
  adminGhostButton,
  adminHint,
  adminInputClassName,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
import type { MediaAsset } from "@/lib/store"
import { filenameFromUrl } from "@/lib/utils"

type PickerMode = "featured" | "inline"

type Props = {
  assets: MediaAsset[]
  initialFeaturedImage?: string | null
  initialContent?: string | null
}

export function BlogMediaEditorFields({
  assets,
  initialFeaturedImage = "",
  initialContent = "",
}: Props) {
  const [media, setMedia] = useState(assets)
  const [featuredImage, setFeaturedImage] = useState(initialFeaturedImage ?? "")
  const [content, setContent] = useState(initialContent ?? "")
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<PickerMode>("inline")
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState("")
  const [uploadAlt, setUploadAlt] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredMedia = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return media

    return media.filter((asset) =>
      [asset.name, asset.alt, asset.url, filenameFromUrl(asset.url)]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [media, query])

  function openPicker(nextMode: PickerMode) {
    setMode(nextMode)
    setIsOpen(true)
    setUploadError("")
  }

  function insertImage(asset: MediaAsset) {
    if (mode === "featured") {
      setFeaturedImage(asset.url)
      setIsOpen(false)
      return
    }

    const markdown = `![${asset.alt}](${asset.url})`
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((current) => `${current.trimEnd()}\n\n${markdown}\n`)
      setIsOpen(false)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.slice(0, start)
    const after = content.slice(end)
    const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n\n"
    const suffix = after.startsWith("\n") || after.length === 0 ? "\n" : "\n\n"
    const nextContent = `${before}${prefix}${markdown}${suffix}${after}`

    setContent(nextContent)
    setIsOpen(false)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = before.length + prefix.length + markdown.length + suffix.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setUploadError("")

    if (file) {
      const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      setUploadName((current) => current || cleanName)
      setUploadAlt((current) => current || cleanName)
    }
  }

  async function uploadSelectedImage() {
    if (!selectedFile) {
      setUploadError("Choose an image first.")
      return
    }

    const name = uploadName.trim()
    const alt = uploadAlt.trim()
    if (!name || !alt) {
      setUploadError("Add an asset name and alt text.")
      return
    }

    setIsUploading(true)
    setUploadError("")

    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("alt", alt)
      formData.set("file", selectedFile)

      const response = await fetch("/api/media?return=json", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      })

      const payload = (await response.json()) as { asset?: MediaAsset; error?: string }
      if (!response.ok || !payload.asset) {
        throw new Error(payload.error || "Upload failed.")
      }

      setMedia((current) => [payload.asset!, ...current])
      setSelectedFile(null)
      setUploadName("")
      setUploadAlt("")
      insertImage(payload.asset)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <section className={adminSurfaceSoft}>
        <div className="border-b border-[rgba(10,19,23,0.08)] px-5 py-4 sm:px-6">
          <h3 className="text-lg font-semibold text-slate-950">Images and article body</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Choose a featured image and place supporting images directly inside the article.
          </p>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <label className="grid gap-2 text-sm">
            <span className={adminFieldLabel}>Featured image URL</span>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <input
                name="featuredImage"
                value={featuredImage}
                onChange={(event) => setFeaturedImage(event.target.value)}
                className={adminInputClassName()}
                placeholder="/uploads/example.png"
              />
              <button type="button" onClick={() => openPicker("featured")} className={`${adminGhostButton} gap-2`}>
                <ImageIcon className="h-4 w-4" />
                Choose image
              </button>
            </div>
            <span className={adminHint}>Use an uploaded media-library URL or any public image URL.</span>
          </label>

          {featuredImage ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-[rgba(10,19,23,0.08)] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="" className="max-h-72 w-full object-cover" />
            </div>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className={adminFieldLabel}>Content</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className={adminHint}>Use markdown and MDX-style formatting for the long-form article.</span>
              <button type="button" onClick={() => openPicker("inline")} className={`${adminGhostButton} gap-2`}>
                <Link2 className="h-4 w-4" />
                Insert image
              </button>
            </div>
            <textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={16}
              className={adminTextareaClassName("min-h-[24rem]")}
            />
          </label>
        </div>
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Media library</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  {mode === "featured" ? "Choose featured image" : "Insert article image"}
                </h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className={`${adminGhostButton} gap-2`}>
                <X className="h-4 w-4" />
                Close
              </button>
            </div>

            <div className="grid min-h-0 gap-5 overflow-y-auto p-5 lg:grid-cols-[0.7fr_0.3fr]">
              <div className="space-y-4">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className={adminInputClassName("pl-10")}
                    placeholder="Search media"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredMedia.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => insertImage(asset)}
                      className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white text-left transition hover:border-blue-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                    >
                      <div className="aspect-[16/10] bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.url} alt={asset.alt} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-sm font-semibold text-slate-950">{asset.name}</p>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600">{asset.alt}</p>
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                          <Check className="h-3.5 w-3.5" />
                          {mode === "featured" ? "Use featured" : "Insert markdown"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {!filteredMedia.length ? (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    No media assets match this search.
                  </div>
                ) : null}
              </div>

              <div className="h-fit rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Upload className="h-4 w-4 text-blue-700" />
                  Upload image
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-[#ced0d4] bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                  />
                  <input
                    value={uploadName}
                    onChange={(event) => setUploadName(event.target.value)}
                    className={adminInputClassName()}
                    placeholder="Asset name"
                  />
                  <input
                    value={uploadAlt}
                    onChange={(event) => setUploadAlt(event.target.value)}
                    className={adminInputClassName()}
                    placeholder="Alt text"
                  />
                  {uploadError ? <p className="text-sm leading-6 text-rose-600">{uploadError}</p> : null}
                  <button
                    type="button"
                    onClick={uploadSelectedImage}
                    disabled={isUploading}
                    className={`${adminAccentButton} w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload and use"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
