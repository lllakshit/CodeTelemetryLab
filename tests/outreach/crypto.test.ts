import assert from "node:assert/strict"
import { test } from "node:test"
import { decryptSecret, encryptSecret, lastFour } from "../../src/lib/outreach/crypto.ts"

const SECRET = "a-long-enough-server-secret-for-tests"

test("an encrypted key decrypts back to the original", () => {
  const token = encryptSecret("re_test_123456789", SECRET)
  assert.ok(token.startsWith("v1:"))
  assert.ok(!token.includes("re_test"))
  assert.equal(decryptSecret(token, SECRET), "re_test_123456789")
})

test("each encryption is different but both decrypt", () => {
  const a = encryptSecret("same", SECRET)
  const b = encryptSecret("same", SECRET)
  assert.notEqual(a, b)
  assert.equal(decryptSecret(a, SECRET), decryptSecret(b, SECRET))
})

test("a different server secret cannot decrypt", () => {
  const token = encryptSecret("re_test_key", SECRET)
  assert.throws(() => decryptSecret(token, "another-long-enough-server-secret!!"))
})

test("a changed value is rejected", () => {
  const token = encryptSecret("re_test_key", SECRET)
  const parts = token.split(":")
  parts[3] = Buffer.from("tampered-bytes").toString("base64")
  assert.throws(() => decryptSecret(parts.join(":"), SECRET))
})

test("a missing or short server secret is refused", () => {
  assert.throws(() => encryptSecret("x", ""))
  assert.throws(() => encryptSecret("x", "short"))
})

test("only the last four characters are kept for display", () => {
  assert.equal(lastFour("re_abcdef123456"), "3456")
  assert.equal(lastFour("abc"), "abc")
})
