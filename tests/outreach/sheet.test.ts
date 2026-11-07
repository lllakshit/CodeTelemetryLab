import assert from "node:assert/strict"
import { deflateRawSync } from "node:zlib"
import { test } from "node:test"
import { bulkAttachments, parseBulkTable, parseCsv, parseXlsx, readSheetFile, sheetTemplateCsv } from "../../src/lib/outreach/sheet.ts"

const HEADER = "To,pitch deck,resume to be sent,message"

/** Builds a minimal .xlsx (a zip) the way spreadsheet apps do, so the reader is tested on the real container. */
function buildXlsx(files: Record<string, string>, deflate = true) {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const raw = encoder.encode(text)
    const data = deflate ? deflateRawSync(raw) : raw
    const method = deflate ? 8 : 0
    const local = Buffer.alloc(30 + nameBytes.length + data.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    Buffer.from(nameBytes).copy(local, 30)
    Buffer.from(data).copy(local, 30 + nameBytes.length)
    const entry = Buffer.alloc(46 + nameBytes.length)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(method, 10)
    entry.writeUInt32LE(data.length, 20)
    entry.writeUInt32LE(raw.length, 24)
    entry.writeUInt16LE(nameBytes.length, 28)
    entry.writeUInt32LE(offset, 42)
    Buffer.from(nameBytes).copy(entry, 46)
    locals.push(local)
    central.push(entry)
    offset += local.length
  }
  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(central.length, 8)
  end.writeUInt16LE(central.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...locals, directory, end]))
}

const WORKBOOK = `<workbook xmlns:r="r"><sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets></workbook>`
const WORKBOOK_RELS = `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`

const xlsxFiles = (sheet: string, extra: Record<string, string> = {}) => ({
  "xl/workbook.xml": WORKBOOK,
  "xl/_rels/workbook.xml.rels": WORKBOOK_RELS,
  "xl/sharedStrings.xml": `<sst><si><t>To</t></si><si><t>pitch deck</t></si><si><t>resume to be sent</t></si><si><t>message</t></si><si><t>a@x.com</t></si><si><t xml:space="preserve">Hi A,&amp; welcome</t></si><si><t>Resume</t></si></sst>`,
  "xl/worksheets/sheet1.xml": sheet,
  ...extra,
})

test("csv: quotes, line breaks inside a cell, escaped quotes and a BOM", () => {
  const table = parseCsv(`﻿${HEADER}\r\na@x.com,https://d.example/deck,,"Hi A,\n\nShe said ""hello""\n* one"\r\n`)
  assert.equal(table.length, 2)
  assert.equal(table[1][0].text, "a@x.com")
  assert.equal(table[1][3].text, 'Hi A,\n\nShe said "hello"\n* one')
})

test("csv: semicolon separated files from other regions", () => {
  const table = parseCsv("To;message\na@x.com;Hello there")
  assert.equal(table[1][1].text, "Hello there")
})

test("csv: blank lines are ignored", () => {
  assert.equal(parseCsv(`${HEADER}\n\n,,,\na@x.com,,,Hi\n`).length, 2)
})

test("xlsx: reads shared strings, entities and an empty cell between values", async () => {
  const sheet = `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
    <row r="2"><c r="A2" t="s"><v>4</v></c><c r="D2" t="s"><v>5</v></c></row>
  </sheetData></worksheet>`
  const table = await parseXlsx(buildXlsx(xlsxFiles(sheet)))
  assert.deepEqual(table[0].map((c) => c.text), ["To", "pitch deck", "resume to be sent", "message"])
  assert.deepEqual(table[1].map((c) => c.text), ["a@x.com", "", "", "Hi A,& welcome"])
})

test("xlsx: stored (uncompressed) entries and inline strings also work", async () => {
  const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>To</t></is></c><c r="B1" t="inlineStr"><is><t>message</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>a@x.com</t></is></c><c r="B2"><v>42</v></c></row></sheetData></worksheet>`
  const table = await parseXlsx(buildXlsx(xlsxFiles(sheet), false))
  assert.equal(table[1][0].text, "a@x.com")
  assert.equal(table[1][1].text, "42")
})

test("xlsx: a hyperlinked word carries its real address, and HYPERLINK() formulas too", async () => {
  const sheet = `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
    <row r="2"><c r="A2" t="s"><v>4</v></c><c r="B2" t="s"><v>6</v></c><c r="C2" t="str"><f>HYPERLINK(&quot;https://drive.example/resume&quot;,&quot;Resume&quot;)</f><v>Resume</v></c><c r="D2" t="s"><v>5</v></c></row>
  </sheetData><hyperlinks><hyperlink ref="B2" r:id="rId9"/></hyperlinks></worksheet>`
  const rels = { "xl/worksheets/_rels/sheet1.xml.rels": `<Relationships><Relationship Id="rId9" Target="https://drive.example/deck" TargetMode="External"/></Relationships>` }
  const table = await parseXlsx(buildXlsx(xlsxFiles(sheet, rels)))
  const result = parseBulkTable(table, { defaultSubject: "Hello" })
  assert.equal(result.rows[0].deckUrl, "https://drive.example/deck")
  assert.equal(result.rows[0].resumeUrl, "https://drive.example/resume")
  assert.deepEqual(result.rows[0].problems, [])
})

test("xlsx: a file that is not a workbook is refused with a plain message", async () => {
  await assert.rejects(() => parseXlsx(new TextEncoder().encode("not a zip at all, just text padding".repeat(3))), /Excel/)
})

test("readSheetFile only accepts csv and xlsx", async () => {
  await assert.rejects(() => readSheetFile("leads.pdf", new Uint8Array(4)), /\.csv or \.xlsx/)
  const table = await readSheetFile("leads.csv", new TextEncoder().encode(`${HEADER}\na@x.com,,,Hi`))
  assert.equal(table.length, 2)
})

test("each valid row becomes one email with its two links", () => {
  const table = parseCsv(
    `${HEADER}\na@x.com,https://docs.google.com/presentation/d/1/edit,https://drive.google.com/file/d/2/view,Hi A\nB@Y.com;c@z.com,,https://drive.google.com/file/d/3/view,Hi B`,
  )
  const result = parseBulkTable(table, { defaultSubject: "Intro" })
  assert.deepEqual(result.fileProblems, [])
  assert.equal(result.rows.length, 2)
  assert.equal(result.rows[0].line, 2)
  assert.deepEqual(result.rows[0].problems, [])
  assert.deepEqual(bulkAttachments(result.rows[0]).map((a) => a.name), ["Pitch deck", "Resume"])
  assert.deepEqual(result.rows[1].to, ["b@y.com", "c@z.com"])
  assert.deepEqual(bulkAttachments(result.rows[1]).map((a) => a.name), ["Resume"])
})

test("headers are matched loosely and in any order", () => {
  const table = parseCsv("Message,  Resume To Be Sent ,TO,Pitch Deck\nHi,https://r.example/a,a@x.com,https://d.example/b")
  const [row] = parseBulkTable(table, { defaultSubject: "S" }).rows
  assert.equal(row.to[0], "a@x.com")
  assert.equal(row.resumeUrl, "https://r.example/a")
  assert.equal(row.deckUrl, "https://d.example/b")
  assert.deepEqual(row.problems, [])
})

test("a Subject column wins over the box, and the box fills the gaps", () => {
  const table = parseCsv("To,message,Subject\na@x.com,Hi,Own subject\nb@x.com,Hi,")
  const result = parseBulkTable(table, { defaultSubject: "Shared" })
  assert.equal(result.hasSubjectColumn, true)
  assert.deepEqual(result.rows.map((r) => r.subject), ["Own subject", "Shared"])
})

test("problems are reported per row instead of failing the whole sheet", () => {
  const table = parseCsv(
    `${HEADER}\nnot-an-email,,,Hi\na@x.com,http://insecure.example/x,,Hi\na@x.com,,,Hi again\nb@x.com,,,\nc@x.com,,,Hi`,
  )
  const rows = parseBulkTable(table, { defaultSubject: "S" }).rows
  assert.match(rows[0].problems.join(" "), /not a valid email/)
  assert.match(rows[1].problems.join(" "), /https/)
  assert.match(rows[2].problems.join(" "), /already in an earlier row/)
  assert.match(rows[3].problems.join(" "), /message is empty/)
  assert.deepEqual(rows[4].problems, [])
})

test("a missing subject is flagged on every row until one is given", () => {
  const rows = parseBulkTable(parseCsv(`${HEADER}\na@x.com,,,Hi`)).rows
  assert.match(rows[0].problems.join(" "), /No subject/)
})

test("missing columns are explained and nothing is sent", () => {
  const noTo = parseBulkTable(parseCsv("name,message\nA,Hi"))
  assert.match(noTo.fileProblems.join(" "), /"To" column/)
  assert.equal(noTo.rows.length, 0)
  const noAttach = parseBulkTable(parseCsv("To,message\na@x.com,Hi"), { defaultSubject: "S" })
  assert.match(noAttach.fileProblems.join(" "), /nothing would be attached/)
  assert.equal(noAttach.rows.length, 1)
})

test("a sheet over the row limit is cut and says so", () => {
  const lines = Array.from({ length: 205 }, (_, i) => `u${i}@x.com,,,Hi`)
  const result = parseBulkTable(parseCsv([HEADER, ...lines].join("\n")), { defaultSubject: "S" })
  assert.equal(result.rows.length, 200)
  assert.match(result.fileProblems.join(" "), /at most 200/)
})

test("the sample file has the right headers and parses cleanly", () => {
  const result = parseBulkTable(parseCsv(sheetTemplateCsv()), { defaultSubject: "Hello" })
  assert.deepEqual(result.fileProblems, [])
  assert.deepEqual(result.rows[0].problems, [])
})
