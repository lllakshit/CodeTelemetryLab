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
  img: (props: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt ?? ""}
      loading="lazy"
      decoding="async"
      className="mt-8 h-auto w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 object-cover shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
    />
  ),
  h4: (props: ComponentPropsWithoutRef<"h4">) => (
    <Heading {...props} level={4} className="mt-6 text-lg font-semibold tracking-tight text-slate-950" />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong {...props} className="font-semibold text-slate-950" />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      {...props}
      className="mt-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-100"
    />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
      <table {...props} className="w-full min-w-[32rem] border-collapse text-left text-sm text-slate-700" />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => <thead {...props} className="bg-slate-50 text-slate-950" />,
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th {...props} className="border-b border-slate-200 px-4 py-3 font-semibold" />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td {...props} className="border-b border-slate-100 px-4 py-3 align-top leading-7" />
  ),
}
