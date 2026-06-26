import { deleteBlogAction, deleteProjectAction, saveBlogAction, saveHomepageAction, saveProjectAction } from "@/app/(admin)/admin/actions"
import {
  adminAccentButton,
  adminCheckboxCard,
  adminDangerButton,
  adminFieldLabel,
  adminHint,
  adminInputClassName,
  adminSurface,
  adminSurfaceSoft,
  adminTextareaClassName,
} from "@/lib/admin-ui"
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
      <span className={adminFieldLabel}>{label}</span>
      {children}
      {hint ? <span className={adminHint}>{hint}</span> : null}
    </label>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className={adminSurfaceSoft}>
      <div className="border-b border-[rgba(10,19,23,0.08)] px-5 py-4 sm:px-6">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function lineValue<T>(items: T[], mapper: (item: T) => string) {
  return items.map(mapper).join("\n")
}

export function BlogEditorForm({ post }: { post?: BlogPost | null }) {
  return (
    <form action={saveBlogAction} className={`${adminSurface} space-y-6 p-4 sm:p-6`}>
      <input type="hidden" name="id" defaultValue={post?.id ?? ""} />
      <FormSection
        title="Post details"
        description="Set the core identity for the article, including the URL, category, and related discovery metadata."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title">
            <input name="title" defaultValue={post?.title ?? ""} required className={adminInputClassName()} />
          </Field>
          <Field label="Slug" hint="Leave blank to derive from title">
            <input name="slug" defaultValue={post?.slug ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={post?.category ?? ""} required className={adminInputClassName()} />
          </Field>
          <Field label="Tags" hint="Comma separated">
            <input name="tags" defaultValue={post?.tags.join(", ") ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Featured image URL">
            <input name="featuredImage" defaultValue={post?.featuredImage ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Publish">
            <label className={adminCheckboxCard}>
              <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? false} className="h-4 w-4 accent-[#0064e0]" />
              Published and visible on the public site
            </label>
          </Field>
        </div>
      </FormSection>
      <FormSection
        title="Search and sharing"
        description="Optional metadata that improves how the post appears in search previews and content listings."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="SEO title">
            <input name="seoTitle" defaultValue={post?.seoTitle ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="SEO description" hint="Optional but recommended">
            <input name="seoDescription" defaultValue={post?.seoDescription ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Excerpt" hint="Short summary used on lists">
            <textarea
              name="excerpt"
              defaultValue={post?.excerpt ?? ""}
              required
              rows={4}
              className={adminTextareaClassName()}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection
        title="Article body"
        description="Write the long-form content here. The content field is ready for markdown and MDX-style formatting."
      >
        <Field label="Content" hint="MDX-ready content body">
          <textarea name="content" defaultValue={post?.content ?? ""} required rows={16} className={adminTextareaClassName("min-h-[24rem]")} />
        </Field>
      </FormSection>
      <div className="flex flex-col gap-4 border-t border-[rgba(10,19,23,0.08)] px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">The blog body supports MDX-style formatting and markdown elements.</p>
        <button type="submit" className={adminAccentButton}>
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
      <button type="submit" className={adminDangerButton}>Delete</button>
    </form>
  )
}

export function ProjectEditorForm({ project }: { project?: Project | null }) {
  return (
    <form action={saveProjectAction} className={`${adminSurface} space-y-6 p-4 sm:p-6`}>
      <input type="hidden" name="id" defaultValue={project?.id ?? ""} />
      <FormSection
        title="Project identity"
        description="Capture how the case study is labeled publicly and how visitors will discover it in the portfolio."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title">
            <input name="title" defaultValue={project?.title ?? ""} required className={adminInputClassName()} />
          </Field>
          <Field label="Slug" hint="Leave blank to derive from title">
            <input name="slug" defaultValue={project?.slug ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Category">
            <input name="category" defaultValue={project?.category ?? ""} required className={adminInputClassName()} />
          </Field>
          <Field label="Stack" hint="Comma separated">
            <input name="stack" defaultValue={project?.stack.join(", ") ?? ""} className={adminInputClassName()} />
          </Field>
          <Field label="Screenshots" hint="Comma separated URLs">
            <input name="screenshots" defaultValue={project?.screenshots.join(", ") ?? ""} className={adminInputClassName()} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Featured">
              <label className={adminCheckboxCard}>
                <input type="checkbox" name="featured" defaultChecked={project?.featured ?? false} className="h-4 w-4 accent-[#0064e0]" />
                Highlight on the homepage
              </label>
            </Field>
            <Field label="Publish">
              <label className={adminCheckboxCard}>
                <input type="checkbox" name="isPublished" defaultChecked={project?.isPublished ?? true} className="h-4 w-4 accent-[#0064e0]" />
                Visible to visitors
              </label>
            </Field>
          </div>
        </div>
      </FormSection>
      <FormSection
        title="Case study narrative"
        description="Keep the write-up concise and outcome-focused so the public project page stays useful to technical buyers."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <Field label="Problem">
            <textarea name="problem" defaultValue={project?.problem ?? ""} required rows={6} className={adminTextareaClassName()} />
          </Field>
          <Field label="Solution">
            <textarea name="solution" defaultValue={project?.solution ?? ""} required rows={6} className={adminTextareaClassName()} />
          </Field>
          <Field label="Results">
            <textarea name="results" defaultValue={project?.results ?? ""} required rows={6} className={adminTextareaClassName()} />
          </Field>
        </div>
      </FormSection>
      <div className="flex flex-col gap-4 border-t border-[rgba(10,19,23,0.08)] px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          Use commas for stack and screenshot values. The UI will render them as pills and cards.
        </p>
        <button type="submit" className={adminAccentButton}>
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
      <button type="submit" className={adminDangerButton}>Delete</button>
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
    <form action={saveHomepageAction} className={`${adminSurface} space-y-6 p-4 sm:p-6`}>
      <FormSection
        title="Hero and calls to action"
        description="These fields shape the first impression on the public homepage and should stay concise, credible, and action-oriented."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Hero eyebrow">
            <input name="heroEyebrow" defaultValue={homepage.heroEyebrow} required className={adminInputClassName()} />
          </Field>
          <Field label="Hero title">
            <textarea name="heroTitle" defaultValue={homepage.heroTitle} required rows={3} className={adminTextareaClassName()} />
          </Field>
          <Field label="Hero description">
            <textarea name="heroDescription" defaultValue={homepage.heroDescription} required rows={4} className={adminTextareaClassName()} />
          </Field>
          <Field label="Primary CTA label">
            <input name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} required className={adminInputClassName()} />
          </Field>
          <Field label="Primary CTA href">
            <input name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} required className={adminInputClassName()} />
          </Field>
          <Field label="Secondary CTA label">
            <input name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} required className={adminInputClassName()} />
          </Field>
          <Field label="Secondary CTA href">
            <input name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} required className={adminInputClassName()} />
          </Field>
          <Field label="CTA title">
            <textarea name="ctaTitle" defaultValue={homepage.ctaTitle} required rows={3} className={adminTextareaClassName()} />
          </Field>
          <Field label="CTA description">
            <textarea name="ctaDescription" defaultValue={homepage.ctaDescription} required rows={4} className={adminTextareaClassName()} />
          </Field>
        </div>
      </FormSection>
      <FormSection
        title="Structured homepage blocks"
        description="Each line feeds a repeatable content block on the live homepage, so keeping the format tidy preserves the public layout."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Services" hint="One per line: Title | Description | Notes">
            <textarea name="servicesText" defaultValue={rowsFromServices(homepage)} required rows={8} className={adminTextareaClassName("min-h-56")} />
          </Field>
          <Field label="Testimonials" hint="One per line: Name | Role | Quote">
            <textarea
              name="testimonialsText"
              defaultValue={rowsFromTestimonials(homepage)}
              required
              rows={8}
              className={adminTextareaClassName("min-h-56")}
            />
          </Field>
          <Field label="Stats" hint="One per line: Label | Value">
            <textarea name="statsText" defaultValue={rowsFromStats(homepage)} required rows={6} className={adminTextareaClassName()} />
          </Field>
          <Field label="Process" hint="One per line: Title | Description">
            <textarea name="processText" defaultValue={rowsFromProcess(homepage)} required rows={6} className={adminTextareaClassName()} />
          </Field>
        </div>
      </FormSection>
      <div className="flex flex-col gap-4 border-t border-[rgba(10,19,23,0.08)] px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          This editor keeps the homepage content editable without changing source files.
        </p>
        <button type="submit" className={adminAccentButton}>
          Save homepage
        </button>
      </div>
    </form>
  )
}
