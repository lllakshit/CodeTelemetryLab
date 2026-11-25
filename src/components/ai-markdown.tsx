import { Fragment, type ReactNode } from "react"

/**
 * Small, safe markdown renderer for assistant answers: headings, paragraphs, bullet and numbered lists, tables,
 * fenced code, **bold**, *italic*, `code` and [links](https://…). Builds React elements (never raw HTML), so text
 * from leads or web pages that the model repeats cannot inject markup.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\)|\*[^*\s][^*]*\*)/g
  let last = 0
  let i = 0
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0
    if (index > last) out.push(text.slice(last, index))
    const token = match[0]
    const key = `${keyBase}-${i++}`
    if (token.startsWith("**")) out.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith("`")) out.push(<code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em]">{token.slice(1, -1)}</code>)
    else if (token.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      out.push(
        <a key={key} href={m?.[2]} target={m?.[2].startsWith("/") ? undefined : "_blank"} rel="noreferrer" className="font-medium text-[#0064e0] underline-offset-2 hover:underline">
          {m?.[1]}
        </a>,
      )
    } else out.push(<em key={key}>{token.slice(1, -1)}</em>)
    last = index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())

export function AiMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    const key = `b${k++}`
    if (/^```/.test(line)) {
      const body: string[] = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++])
      i += 1
      blocks.push(
        <pre key={key} className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
          <code>{body.join("\n")}</code>
        </pre>,
      )
      continue
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]))
      blocks.push(
        <div key={key} className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-xs">
            <thead>
              <tr>
                {head.map((h, j) => (
                  <th key={j} className="border-b border-slate-200 px-2 py-1.5 font-semibold text-slate-600">
                    {inline(h, `${key}h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-slate-100">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1.5 align-top text-slate-800">
                      {inline(c, `${key}r${ri}c${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push(
        <p key={key} className={heading[1].length <= 2 ? "text-base font-semibold text-slate-950" : "text-sm font-semibold text-slate-950"}>
          {inline(heading[2], key)}
        </p>,
      )
      i += 1
      continue
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, ""))
      const List = ordered ? "ol" : "ul"
      blocks.push(
        <List key={key} className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
          {items.map((item, j) => (
            <li key={j}>{inline(item, `${key}-${j}`)}</li>
          ))}
        </List>,
      )
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|\s*([-*•]|\d+[.)])\s+|\s*\|)/.test(lines[i])) para.push(lines[i++])
    if (!para.length) para.push(lines[i++])
    blocks.push(
      <p key={key}>
        {para.map((p, j) => (
          <Fragment key={j}>
            {j > 0 ? <br /> : null}
            {inline(p, `${key}-${j}`)}
          </Fragment>
        ))}
      </p>,
    )
  }
  return <div className="space-y-3 text-sm leading-6 text-slate-800">{blocks}</div>
}
