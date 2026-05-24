import { deleteBlogAction, deleteProjectAction, saveBlogAction, saveHomepageAction, saveProjectAction } from "@/app/(admin)/admin/actions"
import type { BlogPost, HomeContent, Project } from "@/lib/store"

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-slate-300">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

function inputClassName() {
  return "rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
}

function textareaClassName() {
  return "rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
}

function lineValue<T>(items: T[], mapper: (item: T) => string) {
  return items.map(mapper).join("\n")
}

export function BlogEditorForm({ post }: { post?: BlogPost | null }) {
  return (
    <form action={saveBlogAction} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <input type="hidden" name="id" defaultValue={post?.id ?? ""} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title">
          <input name="title" defaultValue={post?.title ?? ""} required className={inputClassName()} />
        </Field>
        <Field label="Slug" hint="Leave blank to derive from title">
          <input name="slug" defaultValue={post?.slug ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Category">
          <input name="category" defaultValue={post?.category ?? ""} required className={inputClassName()} />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <input name="tags" defaultValue={post?.tags.join(", ") ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Featured image URL">
          <input name="featuredImage" defaultValue={post?.featuredImage ?? ""} className={inputClassName()} />
        </Field>
        <Field label="SEO title">
          <input name="seoTitle" defaultValue={post?.seoTitle ?? ""} className={inputClassName()} />
        </Field>
        <Field label="SEO description" hint="Optional but recommended">
          <input name="seoDescription" defaultValue={post?.seoDescription ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Publish">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? false} />
            Published
          </label>
        </Field>
        <Field label="Excerpt" hint="Short summary used on lists">
          <textarea name="excerpt" defaultValue={post?.excerpt ?? ""} required rows={4} className={textareaClassName()} />
        </Field>
        <Field label="Content" hint="MDX-ready content body">
          <textarea name="content" defaultValue={post?.content ?? ""} required rows={16} className={textareaClassName()} />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">The blog body supports MDX-style formatting and markdown elements.</p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Save blog post
        </button>
      </div>
    </form>
  )
}

export function BlogDeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteBlogAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
      >
        Delete
      </button>
    </form>
  )
}

export function ProjectEditorForm({ project }: { project?: Project | null }) {
  return (
    <form action={saveProjectAction} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <input type="hidden" name="id" defaultValue={project?.id ?? ""} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title">
          <input name="title" defaultValue={project?.title ?? ""} required className={inputClassName()} />
        </Field>
        <Field label="Slug" hint="Leave blank to derive from title">
          <input name="slug" defaultValue={project?.slug ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Category">
          <input name="category" defaultValue={project?.category ?? ""} required className={inputClassName()} />
        </Field>
        <Field label="Stack" hint="Comma separated">
          <input name="stack" defaultValue={project?.stack.join(", ") ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Screenshots" hint="Comma separated URLs">
          <input name="screenshots" defaultValue={project?.screenshots.join(", ") ?? ""} className={inputClassName()} />
        </Field>
        <Field label="Featured">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input type="checkbox" name="featured" defaultChecked={project?.featured ?? false} />
            Featured project
          </label>
        </Field>
        <Field label="Publish">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input type="checkbox" name="isPublished" defaultChecked={project?.isPublished ?? true} />
            Published
          </label>
        </Field>
        <Field label="Problem">
          <textarea name="problem" defaultValue={project?.problem ?? ""} required rows={5} className={textareaClassName()} />
        </Field>
        <Field label="Solution">
          <textarea name="solution" defaultValue={project?.solution ?? ""} required rows={5} className={textareaClassName()} />
        </Field>
        <Field label="Results">
          <textarea name="results" defaultValue={project?.results ?? ""} required rows={5} className={textareaClassName()} />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">Use commas for stack and screenshot values. The UI will render them as pills and cards.</p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Save project
        </button>
      </div>
    </form>
  )
}

export function ProjectDeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteProjectAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
      >
        Delete
      </button>
    </form>
  )
}

function rowsFromServices(homepage: HomeContent) {
  return lineValue(homepage.services, (item) => `${item.title} | ${item.description} | ${item.notes}`)
}

function rowsFromTestimonials(homepage: HomeContent) {
  return lineValue(homepage.testimonials, (item) => `${item.name} | ${item.role} | ${item.quote}`)
}

function rowsFromStats(homepage: HomeContent) {
  return lineValue(homepage.stats, (item) => `${item.label} | ${item.value}`)
}

function rowsFromProcess(homepage: HomeContent) {
  return lineValue(homepage.process, (item) => `${item.title} | ${item.description}`)
}

export function HomepageEditorForm({ homepage }: { homepage: HomeContent }) {
  return (
    <form action={saveHomepageAction} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Hero eyebrow">
          <input name="heroEyebrow" defaultValue={homepage.heroEyebrow} required className={inputClassName()} />
        </Field>
        <Field label="Hero title">
          <textarea name="heroTitle" defaultValue={homepage.heroTitle} required rows={3} className={textareaClassName()} />
        </Field>
        <Field label="Hero description">
          <textarea name="heroDescription" defaultValue={homepage.heroDescription} required rows={4} className={textareaClassName()} />
        </Field>
        <Field label="Primary CTA label">
          <input name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} required className={inputClassName()} />
        </Field>
        <Field label="Primary CTA href">
          <input name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} required className={inputClassName()} />
        </Field>
        <Field label="Secondary CTA label">
          <input name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} required className={inputClassName()} />
        </Field>
        <Field label="Secondary CTA href">
          <input name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} required className={inputClassName()} />
        </Field>
        <Field label="CTA title">
          <textarea name="ctaTitle" defaultValue={homepage.ctaTitle} required rows={3} className={textareaClassName()} />
        </Field>
        <Field label="CTA description">
          <textarea name="ctaDescription" defaultValue={homepage.ctaDescription} required rows={4} className={textareaClassName()} />
        </Field>
        <Field label="Services" hint="One per line: Title | Description | Notes">
          <textarea name="servicesText" defaultValue={rowsFromServices(homepage)} required rows={8} className={textareaClassName()} />
        </Field>
        <Field label="Testimonials" hint="One per line: Name | Role | Quote">
          <textarea name="testimonialsText" defaultValue={rowsFromTestimonials(homepage)} required rows={8} className={textareaClassName()} />
        </Field>
        <Field label="Stats" hint="One per line: Label | Value">
          <textarea name="statsText" defaultValue={rowsFromStats(homepage)} required rows={6} className={textareaClassName()} />
        </Field>
        <Field label="Process" hint="One per line: Title | Description">
          <textarea name="processText" defaultValue={rowsFromProcess(homepage)} required rows={6} className={textareaClassName()} />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">This editor keeps the homepage content editable without changing source files.</p>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Save homepage
        </button>
      </div>
    </form>
  )
}
