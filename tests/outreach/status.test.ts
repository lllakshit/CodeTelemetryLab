import assert from "node:assert/strict"
import { test } from "node:test"
import { describeStatus, isFinalStatus, normalizeResendEvent } from "../../src/lib/outreach/status.ts"

test("Resend events map to our statuses", () => {
  assert.equal(normalizeResendEvent("delivered"), "delivered")
  assert.equal(normalizeResendEvent("delivery_delayed"), "delayed")
  assert.equal(normalizeResendEvent("Bounced"), "bounced")
  assert.equal(normalizeResendEvent("suppressed"), "bounced")
  assert.equal(normalizeResendEvent("something_new"), null)
  assert.equal(normalizeResendEvent(undefined), null)
})

test("only settled states stop polling", () => {
  for (const s of ["delivered", "opened", "clicked", "bounced", "complained", "canceled", "failed"]) {
    assert.equal(isFinalStatus(s), true, s)
  }
  for (const s of ["queued", "scheduled", "sent", "delayed"]) assert.equal(isFinalStatus(s), false, s)
})

test("labels and tones", () => {
  assert.equal(describeStatus("bounced").tone, "bad")
  assert.equal(describeStatus("delivered").tone, "good")
  assert.equal(describeStatus("sent").tone, "pending")
  assert.equal(describeStatus("delivered").label, "Delivered")
})
