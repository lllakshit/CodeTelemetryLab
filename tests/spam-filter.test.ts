import assert from "node:assert/strict"
import { test } from "node:test"
import { spamReason } from "../src/lib/spam-filter.ts"

const bot = (domain: string, path = "/prompt.txt") => ({
  fullName: "Free AI API",
  email: `api@${domain}`,
  phone: "15676623223",
  subject: "Free AI API",
  message: `Free AI API here: https://${domain} Prompt: https://${domain}${path}`,
})

test("the Free AI API bot is blocked whatever domain it uses next", () => {
  for (const domain of ["apifreeclaudekey.com", "llmfreeapis.com", "brand-new-domain.io"]) assert.ok(spamReason(bot(domain), {}), domain)
  // Each signal works alone, so changing one field does not get it through.
  assert.equal(spamReason({ email: "api@apifreeclaudekey.com", message: "hello" }, {}), "blocked email")
  assert.equal(spamReason({ email: "x@y.com", phone: "+1 567-662-3223", message: "hello" }, {}), "blocked phone")
  assert.equal(spamReason({ email: "x@y.com", fullName: "Sam", message: "Free  AI API for you" }, {}), "spam text")
  assert.equal(spamReason({ email: "x@y.com", fullName: "Sam", message: "see https://z.com/prompt" }, {}), "spam text")
})

test("LEAD_BLOCKLIST blocks extra addresses and whole domains", () => {
  const env = { LEAD_BLOCKLIST: "bad@x.com, @spam.io  other.net" }
  assert.ok(spamReason({ email: "Bad@X.com", message: "hi" }, env))
  assert.ok(spamReason({ email: "a@spam.io", message: "hi" }, env))
  assert.ok(spamReason({ email: "a@mail.other.net", message: "hi" }, env))
  assert.equal(spamReason({ email: "good@x.com", message: "hi" }, env), null)
  assert.equal(spamReason({ email: "a@notother.net", message: "hi" }, env), null)
})

test("real enquiries pass", () => {
  const real = [
    { fullName: "Kapil", email: "kapil@gmail.com", phone: "+91 98765 43210", message: "New feature for existing website" },
    { fullName: "Ana", email: "ana@acme.com", message: "We need an AI API integration for our CRM. Can you build a prompt library?" },
    { fullName: "Raj", email: "raj@startup.in", message: "Is your free consultation for AI agents still open? Docs: https://startup.in/prompts/guide" },
  ]
  for (const lead of real) assert.equal(spamReason(lead, {}), null, lead.message)
})
