import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  budgetOptions,
  contactFaqs,
  contactHeading,
  contactLead,
  contactMethodOptions,
  includeHints,
  inquirySteps,
  projectTypeOptions,
  responseNotes,
  timelineOptions,
} from "../../src/components/contact3d/contact-data.ts"

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")

test("the contact copy is the wording that was already on the live page", () => {
  assert.equal(contactHeading, "Send a brief. Get a grounded reply.")
  assert.match(contactLead, /^Name, email, and a short description of the problem are enough\./)
  assert.equal(includeHints.length, 4)
  assert.equal(responseNotes.length, 3)
  assert.equal(contactFaqs.length, 3)
  assert.deepEqual(
    contactFaqs.map((f) => f.q),
    ["What happens after I submit?", "What should I expect on a discovery call?", "Do you sign NDAs?"],
  )
})

test("the inquiry flow has five steps, matching the five cards drawn in the scene", () => {
  assert.equal(inquirySteps.length, 5)
  const scene = read("src/components/contact3d/contact-scene.ts")
  const cards = [...scene.matchAll(/\{ n: "0\d", c:/g)]
  assert.equal(cards.length, inquirySteps.length)
})

test("the form keeps every field name the contact API reads", () => {
  const page = read("src/app/(site)/contact/page.tsx")
  const names = [
    "source",
    "referrer",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
    "fax",
    "name",
    "email",
    "message",
    "company",
    "phone",
    "country",
    "projectType",
    "budget",
    "timeline",
    "preferredContactMethod",
    "websiteUrl",
    "subject",
  ]
  for (const name of names) assert.match(page, new RegExp(`name="${name}"`), `missing field ${name}`)
  assert.match(page, /action="\/api\/contact"/)
  assert.match(page, /method="post"/)
})

test("the form still posts to a route that accepts every option the page offers", () => {
  // Options are plain strings; the API stores them as text. Guard against an empty or duplicated option list.
  for (const list of [projectTypeOptions, budgetOptions, timelineOptions, contactMethodOptions]) {
    assert.ok(list.length > 0)
    assert.equal(new Set(list).size, list.length)
  }
  assert.equal(projectTypeOptions.length, 19)
})

test("the page keeps one h1, the title and description, and the sent and error states", () => {
  const page = read("src/app/(site)/contact/page.tsx")
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1)
  assert.match(page, /title: "Contact \| Send a Project Brief"/)
  assert.match(page, /Expect a real engineering response within one business day\./)
  assert.match(page, /resolvedSearchParams\?\.sent === "1"/)
  assert.match(page, /resolvedSearchParams\?\.error === "invalid"/)
})
