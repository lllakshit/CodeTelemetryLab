import type { ComponentPropsWithoutRef, ElementType } from "react"

function Heading({
  level,
  className,
  ...props
}: ComponentPropsWithoutRef<"h1"> & { level: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const Tag = `h${level}` as ElementType
  return <Tag className={className} {...props} />
}

export const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <Heading {...props} level={1} className="mt-10 text-4xl font-semibold tracking-tight text-white" />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <Heading {...props} level={2} className="mt-10 text-3xl font-semibold tracking-tight text-white" />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <Heading {...props} level={3} className="mt-8 text-2xl font-semibold tracking-tight text-white" />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p {...props} className="mt-4 leading-8 text-slate-300" />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul {...props} className="mt-5 list-disc space-y-3 pl-6 text-slate-300" />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol {...props} className="mt-5 list-decimal space-y-3 pl-6 text-slate-300" />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => <li {...props} className="leading-8" />,
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      {...props}
      className="text-blue-300 underline decoration-white/20 underline-offset-4 transition hover:text-cyan-300"
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      {...props}
      className="mt-6 border-l-2 border-blue-400/40 pl-5 italic text-slate-300"
    />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr {...props} className="my-10 border-white/10" />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code {...props} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-cyan-200" />
  ),
}
