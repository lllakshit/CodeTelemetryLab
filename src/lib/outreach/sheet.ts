/**
 * Reads the sheet someone uploads for a bulk send (CSV or Excel .xlsx) and turns each row into one email.
 * Pure functions with no framework imports. .xlsx files are read with the browser's built-in decompression,
 * so no spreadsheet library is needed.
 */

import type { OutreachAttachment } from "./attachments"

export type Cell = { text: string; link?: string }
export type Table = Cell[][]

export const MAX_SHEET_BYTES = 5 * 1024 * 1024
export const MAX_BULK_ROWS = 200

const cell = (text: string): Cell => ({ text })

/* ------------------------------------------------------------------ CSV */

export function parseCsv(input: string): Table {
  const text = input.replace(/^﻿/, "")
  // Spreadsheets export with a comma, a semicolon or a tab depending on the region: use the one the header line uses.
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ""
  const delimiter = [",", ";", "\t"]
    .map((candidate) => ({ candidate, count: firstLine.split(candidate).length - 1 }))
    .sort((a, b) => b.count - a.count)[0]
  const sep = delimiter && delimiter.count > 0 ? delimiter.candidate : ","

  const rows: Table = []
  let row: Cell[] = []
  let field = ""
  let quoted = false
  let touched = false

  const endField = () => {
    row.push(cell(field))
    field = ""
  }
  const endRow = () => {
    endField()
    if (row.some((item) => item.text.trim() !== "")) rows.push(row)
    row = []
    touched = false
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field === "") {
      quoted = true
      touched = true
    } else if (char === sep) {
      endField()
      touched = true
    } else if (char === "\r") {
      if (text[i + 1] === "\n") i++
      endRow()
    } else if (char === "\n") {
      endRow()
    } else {
      field += char
      touched = true
    }
  }
  if (touched || field !== "" || row.length > 0) endRow()
  return rows
}

/* ----------------------------------------------------------------- XLSX */

type ZipEntry = { method: number; compressedSize: number; offset: number }

function readZipDirectory(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error("This does not look like an Excel (.xlsx) file.")
  const count = view.getUint16(end + 10, true)
  let pointer = view.getUint32(end + 16, true)
  const decoder = new TextDecoder()
  const entries = new Map<string, ZipEntry>()
  for (let i = 0; i < count; i++) {
    if (view.getUint32(pointer, true) !== 0x02014b50) throw new Error("This Excel file is damaged.")
    const method = view.getUint16(pointer + 10, true)
    const compressedSize = view.getUint32(pointer + 20, true)
    const nameLength = view.getUint16(pointer + 28, true)
    const extraLength = view.getUint16(pointer + 30, true)
    const commentLength = view.getUint16(pointer + 32, true)
    const offset = view.getUint32(pointer + 42, true)
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength))
    entries.set(name, { method, compressedSize, offset })
    pointer += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

async function readZipText(bytes: Uint8Array, entries: Map<string, ZipEntry>, name: string): Promise<string | null> {
  const entry = entries.get(name)
  if (!entry) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const nameLength = view.getUint16(entry.offset + 26, true)
  const extraLength = view.getUint16(entry.offset + 28, true)
  const start = entry.offset + 30 + nameLength + extraLength
  const data = bytes.subarray(start, start + entry.compressedSize)
  if (entry.method === 0) return new TextDecoder().decode(data)
  if (entry.method !== 8) throw new Error("This Excel file uses a compression type that is not supported.")
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
  return new TextDecoder().decode(await new Response(stream).arrayBuffer())
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

/** All the text inside one <si> or <is> block, skipping phonetic hints. */
function textOf(xml: string) {
  const clean = xml.replace(/<rPh[\s\S]*?<\/rPh>/g, "")
  return [...clean.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join("")
}

function columnIndex(reference: string) {
  let index = 0
  for (const char of reference.replace(/[^A-Za-z]/g, "").toUpperCase()) index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

function attr(tag: string, name: string) {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(tag)
  return match ? decodeXml(match[1]) : undefined
}

function relationships(xml: string | null) {
  const map = new Map<string, string>()
  for (const match of (xml ?? "").matchAll(/<Relationship\s[^>]*>/g)) {
    const id = attr(match[0], "Id")
    const target = attr(match[0], "Target")
    if (id && target) map.set(id, target)
  }
  return map
}

export async function parseXlsx(bytes: Uint8Array): Promise<Table> {
  const entries = readZipDirectory(bytes)
  const workbook = await readZipText(bytes, entries, "xl/workbook.xml")
  if (!workbook) throw new Error("This does not look like an Excel (.xlsx) file.")

  // The first sheet in the workbook, whatever its file is called.
  const firstSheet = /<sheet\s[^>]*>/.exec(workbook)?.[0]
  const sheetRelId = firstSheet ? attr(firstSheet, "r:id") : undefined
  const workbookRels = relationships(await readZipText(bytes, entries, "xl/_rels/workbook.xml.rels"))
  const target = (sheetRelId && workbookRels.get(sheetRelId)) || "worksheets/sheet1.xml"
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`
  const sheet = await readZipText(bytes, entries, sheetPath)
  if (!sheet) throw new Error("The first sheet of this Excel file could not be read.")

  const sharedXml = await readZipText(bytes, entries, "xl/sharedStrings.xml")
  const shared = sharedXml ? [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) => textOf(match[1])) : []

  const fileName = sheetPath.split("/").pop() ?? ""
  const sheetRels = relationships(await readZipText(bytes, entries, `xl/worksheets/_rels/${fileName}.rels`))
  const links = new Map<string, string>()
  for (const match of sheet.matchAll(/<hyperlink\s[^>]*>/g)) {
    const ref = attr(match[0], "ref")
    const id = attr(match[0], "r:id")
    const url = id ? sheetRels.get(id) : attr(match[0], "location")
    if (ref && url) links.set(ref.split(":")[0].toUpperCase(), url)
  }

  const table: Table = []
  for (const rowMatch of sheet.matchAll(/<row\s[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(attr(rowMatch[0], "r")) || table.length + 1
    const cells: Cell[] = []
    for (const cellMatch of (rowMatch[1] ?? "").matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const reference = attr(cellMatch[1], "r") ?? ""
      const type = attr(cellMatch[1], "t")
      const inner = cellMatch[2] ?? ""
      const value = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]
      let text = ""
      if (type === "s") text = shared[Number(value)] ?? ""
      else if (type === "inlineStr") text = textOf(inner)
      else if (value !== undefined) text = decodeXml(value)
      let link = links.get(reference.toUpperCase())
      const formula = /<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/.exec(inner)?.[1]
      const fromFormula = formula ? /HYPERLINK\(\s*&quot;([^&]+)&quot;/i.exec(formula)?.[1] : undefined
      if (!link && fromFormula) link = decodeXml(fromFormula)
      const index = reference ? columnIndex(reference) : cells.length
      while (cells.length < index) cells.push(cell(""))
      cells[index] = link ? { text, link } : cell(text)
    }
    while (table.length < rowNumber - 1) table.push([])
    table[rowNumber - 1] = cells
  }
  return table.filter((row) => row.some((item) => item.text.trim() !== ""))
}

export async function readSheetFile(name: string, bytes: Uint8Array): Promise<Table> {
  if (bytes.length > MAX_SHEET_BYTES) throw new Error("This file is too large. Keep it under 5 MB.")
  const lower = name.toLowerCase()
  if (lower.endsWith(".xlsx")) return parseXlsx(bytes)
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) return parseCsv(new TextDecoder().decode(bytes))
  throw new Error("Upload a .csv or .xlsx file. In Google Sheets use File → Download → CSV or Excel.")
}

/* ------------------------------------------------------------ Row mapping */

export type BulkRow = {
  /** The row number in the sheet, counting the header as row 1. */
  line: number
  to: string[]
  subject: string
  message: string
  deckUrl: string
  resumeUrl: string
  problems: string[]
}

export type BulkParse = { rows: BulkRow[]; fileProblems: string[]; hasSubjectColumn: boolean }

const HEADERS = {
  to: ["to", "toemail", "email", "emailto", "recipient", "recipientemail", "recipients"],
  deck: ["pitchdeck", "deck", "pitchdeckurl", "pitchdecklink", "investordeck"],
  resume: ["resumetobesent", "resume", "resumeurl", "resumelink", "cv"],
  message: ["message", "body", "emailbody", "messagebody", "email"],
  subject: ["subject", "subjectline"],
} as const

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/

function findColumn(headers: string[], names: readonly string[], taken: Set<number>) {
  for (const name of names) {
    const index = headers.findIndex((header, position) => header === name && !taken.has(position))
    if (index >= 0) return index
  }
  return -1
}

function checkLink(value: string, label: string, problems: string[]) {
  if (!value) return ""
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") throw new Error("not https")
    return url.toString()
  } catch {
    problems.push(`${label} must be a full link that starts with https://`)
    return ""
  }
}

export function parseBulkTable(table: Table, options: { defaultSubject?: string } = {}): BulkParse {
  const fileProblems: string[] = []
  if (table.length === 0) return { rows: [], fileProblems: ["The sheet is empty."], hasSubjectColumn: false }

  const headers = table[0].map((item) => normalise(item.text))
  const taken = new Set<number>()
  // "email" can be either the recipient or the body: the recipient claims it first.
  const toIndex = findColumn(headers, HEADERS.to, taken)
  if (toIndex >= 0) taken.add(toIndex)
  const messageIndex = findColumn(headers, HEADERS.message, taken)
  if (messageIndex >= 0) taken.add(messageIndex)
  const deckIndex = findColumn(headers, HEADERS.deck, taken)
  const resumeIndex = findColumn(headers, HEADERS.resume, taken)
  const subjectIndex = findColumn(headers, HEADERS.subject, taken)

  if (toIndex < 0) fileProblems.push('The first row needs a "To" column.')
  if (messageIndex < 0) fileProblems.push('The first row needs a "message" column.')
  if (deckIndex < 0 && resumeIndex < 0) fileProblems.push('The first row has no "pitch deck" or "resume to be sent" column, so nothing would be attached.')
  if (toIndex < 0 || messageIndex < 0) return { rows: [], fileProblems, hasSubjectColumn: false }

  const defaultSubject = (options.defaultSubject ?? "").trim()
  const dataRows = table.slice(1)
  if (dataRows.length > MAX_BULK_ROWS) {
    fileProblems.push(`The sheet has ${dataRows.length} rows. Send at most ${MAX_BULK_ROWS} at a time.`)
  }

  const seen = new Set<string>()
  const rows: BulkRow[] = dataRows.slice(0, MAX_BULK_ROWS).map((cells, offset) => {
    const problems: string[] = []
    const text = (index: number) => (index >= 0 ? (cells[index]?.text ?? "").trim() : "")
    // A cell that shows a word like "Resume" but is a hyperlink carries the real address in the link.
    const linkOf = (index: number) => {
      if (index < 0) return ""
      const item = cells[index]
      const shown = (item?.text ?? "").trim()
      return /^https?:\/\//i.test(shown) ? shown : (item?.link ?? shown)
    }

    const to = text(toIndex)
      .split(/[,;\n]+/)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
    if (to.length === 0) problems.push("No recipient in the To column.")
    else if (to.length > 20) problems.push("Too many recipients in one cell (at most 20).")
    for (const address of to) {
      if (!EMAIL.test(address)) problems.push(`"${address}" is not a valid email address.`)
    }
    const key = to.join(",")
    if (to.length > 0 && seen.has(key)) problems.push("This recipient is already in an earlier row, so this row is skipped.")
    else if (to.length > 0) seen.add(key)

    const message = text(messageIndex)
    if (!message) problems.push("The message is empty.")
    else if (message.length > 20000) problems.push("The message is too long.")

    const subject = (subjectIndex >= 0 ? text(subjectIndex) : "") || defaultSubject
    if (!subject) problems.push("No subject: add one in the Subject box above or a Subject column.")
    else if (subject.length > 300) problems.push("The subject is too long.")

    const deckUrl = checkLink(linkOf(deckIndex), "The pitch deck", problems)
    const resumeUrl = checkLink(linkOf(resumeIndex), "The resume", problems)

    return { line: offset + 2, to, subject, message, deckUrl, resumeUrl, problems }
  })

  return { rows, fileProblems, hasSubjectColumn: subjectIndex >= 0 }
}

/** A small example file with the right headers, offered as a download on the bulk screen. */
export function sheetTemplateCsv() {
  const sample = [
    ["To", "pitch deck", "resume to be sent", "message"],
    [
      "jane@example.com",
      "https://docs.google.com/presentation/d/your-deck-id/edit",
      "https://drive.google.com/file/d/your-resume-id/view",
      '"Hi Jane,\n\nA short personal note goes here.\n\n* A bullet starts with a star\n* Links can be pasted as they are"',
    ],
  ]
  return sample.map((line) => line.join(",")).join("\r\n")
}

/** The pitch deck and resume of one row as link attachments (the server checks them again when sending). */
export function bulkAttachments(row: Pick<BulkRow, "deckUrl" | "resumeUrl">): OutreachAttachment[] {
  const items: OutreachAttachment[] = []
  if (row.deckUrl) items.push({ kind: "link", name: "Pitch deck", url: row.deckUrl })
  if (row.resumeUrl) items.push({ kind: "link", name: "Resume", url: row.resumeUrl })
  return items
}
