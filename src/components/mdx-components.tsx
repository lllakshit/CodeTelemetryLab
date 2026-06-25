import type { ComponentPropsWithoutRef } from "react"

function Heading({
  level,
  className,
  ...props
}: ComponentPropsWithoutRef<"h1"> & { level: 1 | 2 | 3 | 4 | 5 | 6 }) {
  if (level === 2) return <h2 className={className} {...props} />
  if (level === 3) return <h3 className={className} {...props} />
  if (level === 4) return <h4 className={className} {...props} />
  if (level === 5) return <h5 className={className} {...props} />
  if (level === 6) return <h6 className={className} {...props} />
  return <h1 className={className} {...props} />
}

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <Heading {...props} level={2} className="mt-10 text-3xl font-medium tracking-[-0.03em] text-slate-950" />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <Heading {...props} level={2} className="mt-10 text-3xl font-medium tracking-[-0.03em] text-slate-950" />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <Heading {...props} level={3} className="mt-8 text-2xl font-semibold tracking-tight text-slate-950" />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p {...props} className="mt-4 leading-8 text-slate-700" />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className="mt-5 list-disc space-y-3 pl-6 text-slate-700" />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol {...props} className="mt-5 list-decimal space-y-3 pl-6 text-slate-700" />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => <li {...props} className="leading-8" />,
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      {...props}
      className="text-blue-700 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-600"
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...props}
      className="mt-6 border-l-2 border-blue-400/40 pl-5 italic text-slate-700"
    />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr {...props} className="my-10 border-slate-200" />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code {...props} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-blue-700" />
  ),
}
