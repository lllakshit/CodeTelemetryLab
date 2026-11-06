import assert from "node:assert/strict"
import { test } from "node:test"
import {
  MAX_ATTACHMENTS,
  describeLink,
  formatBytes,
  planDelivery,
  toEmailAttachments,
  validateAttachments,
} from "../../src/lib/outreach/attachments.ts"

const drive = "https://drive.google.com/file/d/1SIGxVB3jksERpWx5vKhDRY0MoUMz_Ckh/view?usp=drive_link"

test("a Drive link is accepted and named after its provider when it has no file name", () => {
  const result = validateAttachments([{ kind: "link", name: "", url: drive }])
  assert.ok(result.ok)
  if (result.ok) {
    assert.equal(result.value.length, 1)
    assert.equal(result.value[0].kind, "link")
    assert.equal(result.value[0].name, "Google Drive link")
  }
})

test("a given name is kept", () => {
  const result = validateAttachments([{ kind: "link", name: "General Resume", url: drive }])
  assert.ok(result.ok && result.value[0].name === "General Resume")
})

test("at most five attachments", () => {
  const six = Array.from({ length: MAX_ATTACHMENTS + 1 }, () => ({ kind: "link", url: drive }))
  const result = validateAttachments(six)
  assert.ok(!result.ok)
  assert.equal(validateAttachments(six.slice(0, MAX_ATTACHMENTS)).ok, true)
})

test("links must be full https addresses", () => {
  for (const url of ["", "drive.google.com/x", "http://example.com/a", "javascript:alert(1)", "ftp://x.com/a"]) {
    assert.equal(validateAttachments([{ kind: "link", url }]).ok, false, url)
  }
})

test("an uploaded file needs a size and a storage path", () => {
  const base = { kind: "file", name: "deck.pdf", url: "https://files.example.com/deck.pdf" }
  assert.equal(validateAttachments([base]).ok, false)
  assert.equal(validateAttachments([{ ...base, size: 1000 }]).ok, false)
  assert.equal(validateAttachments([{ ...base, size: 1000, storagePath: "a/deck.pdf" }]).ok, true)
})

test("no list means no attachments, a non-list is rejected", () => {
  assert.deepEqual(validateAttachments(undefined), { ok: true, value: [] })
  assert.equal(validateAttachments("nope").ok, false)
})

test("files are attached until the combined size limit, then sent as links", () => {
  const file = (name: string, size: number) => ({
    kind: "file" as const,
    name,
    url: `https://files.example.com/${name}`,
    size,
    storagePath: name,
  })
  const plan = planDelivery(
    [
      { kind: "link", name: "Deck", url: drive },
      file("a.pdf", 8 * 1024 * 1024),
      file("b.pdf", 8 * 1024 * 1024),
      file("c.mp4", 400 * 1024 * 1024),
      file("d.pdf", 1024),
    ],
    20 * 1024 * 1024,
  )
  assert.deepEqual(plan.inline.map((item) => item.name), ["a.pdf", "b.pdf", "d.pdf"])
  assert.deepEqual(plan.links.map((item) => [item.name, item.reason]), [["Deck", "link"], ["c.mp4", "too-large"]])
})

test("links are described by provider", () => {
  assert.equal(describeLink(drive).provider, "Google Drive")
  assert.equal(describeLink("https://docs.google.com/presentation/d/abc/edit").provider, "Google Slides")
  assert.equal(describeLink("https://docs.google.com/document/d/abc/edit").provider, "Google Docs")
  assert.equal(describeLink("https://www.dropbox.com/s/x/file.pdf").provider, "Dropbox")
  assert.equal(describeLink("https://example.com/a").provider, "Link")
  assert.equal(describeLink("not a url").provider, "Link")
})

test("sizes read naturally", () => {
  assert.equal(formatBytes(500), "500 B")
  assert.equal(formatBytes(1536), "1.5 KB")
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB")
  assert.equal(formatBytes(400 * 1024 * 1024), "400 MB")
})

test("the email lists links by provider and big files with a note", () => {
  const plan = planDelivery(
    [
      { kind: "link", name: "Deck", url: drive },
      { kind: "file", name: "demo.mp4", url: "https://files.example.com/demo.mp4", size: 400 * 1024 * 1024, storagePath: "x/demo.mp4" },
      { kind: "file", name: "cv.pdf", url: "https://files.example.com/cv.pdf", size: 1024, storagePath: "x/cv.pdf" },
    ],
    20 * 1024 * 1024,
  )
  const view = toEmailAttachments(plan)
  assert.deepEqual(view.map((item) => [item.name, item.label]), [["Deck", "Google Drive"], ["demo.mp4", "File"]])
  assert.ok(view[1].note?.includes("400 MB"))
  assert.equal(view[0].note, undefined)
})

test("uploaded files must come from our own storage", () => {
  const prefix = "https://project.supabase.co/storage/v1/object/public/outreach-attachments/"
  const file = (url: string, storagePath = "abc/deck.pdf") => ({ kind: "file", name: "deck.pdf", url, size: 10, storagePath })
  assert.equal(validateAttachments([file(`${prefix}abc/deck.pdf`)], { fileUrlPrefix: prefix }).ok, true)
  assert.equal(validateAttachments([file("https://evil.example.com/abc/deck.pdf")], { fileUrlPrefix: prefix }).ok, false)
  assert.equal(validateAttachments([file(`${prefix}other/file.pdf`)], { fileUrlPrefix: prefix }).ok, false)
  assert.equal(validateAttachments([file(`${prefix}abc/../x.pdf`, "abc/../x.pdf")], { fileUrlPrefix: prefix }).ok, false)
})
