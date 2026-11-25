import assert from "node:assert/strict"
import { test } from "node:test"
import { decryptToken, encryptToken, pkcePair, tokenKey } from "../../src/lib/search-console/crypto.ts"
import { addDays, comparePeriods, syncRange, windows } from "../../src/lib/search-console/dates.ts"
import { authorizeUrl, emailFromIdToken, redirectUri } from "../../src/lib/search-console/google.ts"

test("token encryption round-trips and rejects a different key or tampering", () => {
  const key = tokenKey({ SEARCH_CONSOLE_TOKEN_KEY: "a".repeat(40) })!
  const other = tokenKey({ NEXTAUTH_SECRET: "b".repeat(40) })!
  const sealed = encryptToken("1//refresh-token", key)
  assert.match(sealed, /^v1\./)
  assert.equal(decryptToken(sealed, key), "1//refresh-token")
  assert.equal(decryptToken(sealed, other), null)
  const parts = sealed.split(".")
  parts[3] = Buffer.from("tampered").toString("base64url")
  assert.equal(decryptToken(parts.join("."), key), null)
  assert.equal(tokenKey({}), null)
  assert.notEqual(encryptToken("x", key), encryptToken("x", key), "fresh IV each time")
})

test("PKCE pair and authorize URL ask for offline read-only access", () => {
  const { verifier, challenge, state } = pkcePair()
  assert.ok(verifier.length >= 43 && challenge.length === 43 && state.length > 20)
  const url = new URL(authorizeUrl({ clientId: "cid", clientSecret: "s" }, { redirectUri: "https://x.test/cb", state, challenge }))
  assert.equal(url.searchParams.get("access_type"), "offline")
  assert.equal(url.searchParams.get("code_challenge_method"), "S256")
  assert.match(url.searchParams.get("scope")!, /webmasters\.readonly/)
  assert.doesNotMatch(url.searchParams.get("scope")!, /auth\/webmasters( |$)/, "never the write scope")
  assert.equal(redirectUri("https://www.codetelemetrylab.me/", {}), "https://www.codetelemetrylab.me/api/admin/search-console/callback")
  assert.equal(redirectUri("https://preview.vercel.app", { GOOGLE_OAUTH_REDIRECT_URI: "https://fixed/cb" }), "https://fixed/cb")
})

test("id token email is read, junk is ignored", () => {
  const payload = Buffer.from(JSON.stringify({ email: "me@example.com" })).toString("base64url")
  assert.equal(emailFromIdToken(`h.${payload}.s`), "me@example.com")
  assert.equal(emailFromIdToken("nope"), null)
  assert.equal(emailFromIdToken(undefined), null)
})

test("sync range, windows and compare periods", () => {
  assert.deepEqual(syncRange(10, "2026-11-26"), { from: "2026-11-17", to: "2026-11-26" })
  assert.equal(syncRange(9999, "2026-11-26").from, addDays("2026-11-26", -485))
  const parts = windows("2026-01-01", "2026-03-15", 30)
  assert.deepEqual(parts[0], { from: "2026-02-14", to: "2026-03-15" })
  assert.equal(parts.at(-1)!.from, "2026-01-01")
  const covered = parts.reduce((sum, p) => sum + (Date.parse(p.to) - Date.parse(p.from)) / 86_400_000 + 1, 0)
  assert.equal(covered, 74, "every day exactly once")
  assert.deepEqual(comparePeriods("2026-11-23", 28), {
    current: { from: "2026-10-27", to: "2026-11-23" },
    previous: { from: "2026-09-29", to: "2026-10-26" },
  })
})
