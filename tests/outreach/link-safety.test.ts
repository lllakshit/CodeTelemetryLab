import assert from "node:assert/strict"
import { test } from "node:test"
import { isPrivateAddress, isPublicHttpsUrl } from "../../src/lib/outreach/link-safety.ts"

test("private, loopback and link-local addresses are blocked", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
    assert.equal(isPrivateAddress(ip), true, ip)
  }
})

test("public addresses are allowed", () => {
  for (const ip of ["8.8.8.8", "142.250.80.46", "172.32.0.1", "2607:f8b0:4005:80a::200e"]) {
    assert.equal(isPrivateAddress(ip), false, ip)
  }
})

test("only plain public https host names pass the first check", () => {
  assert.equal(isPublicHttpsUrl("https://drive.google.com/file/d/1/view"), true)
  for (const url of [
    "http://drive.google.com/x",
    "https://localhost/x",
    "https://localhost./x",
    "https://127.0.0.1/x",
    "https://[::1]/x",
    "https://intranet/x",
    "https://host.internal/x",
    "https://printer.local/x",
    "https://example.com:8443/x",
    "https://user:pw@example.com/x",
    "not a url",
  ]) {
    assert.equal(isPublicHttpsUrl(url), false, url)
  }
})
