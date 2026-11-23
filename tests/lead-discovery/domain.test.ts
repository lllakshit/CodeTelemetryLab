import assert from "node:assert/strict"
import { test } from "node:test"
import { hostOf, isExcludedDomain, nameMatchesDomain, normalizeDomain } from "../../src/lib/lead-discovery/domain.ts"
import { pickCompanyWebsite } from "../../src/lib/lead-discovery/website.ts"

test("normalizeDomain reduces URLs, hosts and emails to the registrable domain", () => {
  assert.equal(normalizeDomain("https://www.Acme.ai/pricing?x=1"), "acme.ai")
  assert.equal(normalizeDomain("app.eu.acme.io"), "acme.io")
  assert.equal(normalizeDomain("founder@mail.acme.co.uk"), "acme.co.uk")
  assert.equal(normalizeDomain("https://shop.acme.com.au/"), "acme.com.au")
  assert.equal(normalizeDomain("acme.co.in"), "acme.co.in")
  assert.equal(normalizeDomain("localhost"), null)
  assert.equal(normalizeDomain("http://192.168.1.1/admin"), null)
  assert.equal(normalizeDomain(""), null)
  assert.equal(hostOf("WWW.example.com."), "example.com")
})

test("news, social, platform, job-board and big-tech hosts are never a company site", () => {
  for (const host of [
    "https://techcrunch.com/2026/11/20/x",
    "https://news.ycombinator.com/item?id=1",
    "https://github.com/acme/acme",
    "https://jobs.lever.co/acme/123",
    "https://acme.vercel.app",
    "https://www.linkedin.com/company/acme",
    "https://apps.apple.com/app/id1",
    "gmail.com",
  ]) {
    assert.equal(isExcludedDomain(host), true, host)
  }
  assert.equal(isExcludedDomain("https://acme.ai"), false)
})

test("company names match their domains loosely but not randomly", () => {
  assert.equal(nameMatchesDomain("Acme AI", "acme.ai"), true)
  assert.equal(nameMatchesDomain("Acme", "getacme.com"), true)
  assert.equal(nameMatchesDomain("Simple Analytics", "simpleanalytics.com"), true)
  assert.equal(nameMatchesDomain("Pomerado", "pomerado.com"), true)
  assert.equal(nameMatchesDomain("Acme", "zebra.io"), false)
  assert.equal(nameMatchesDomain("AB", "ab.com"), false)
})

test("the company website is only taken from evidence links that match the name", () => {
  const links = [
    "https://techcrunch.com/tag/seed/",
    "https://twitter.com/acmeai",
    "https://www.sequoiacap.com/",
    "https://www.acme.ai/product",
  ]
  assert.equal(pickCompanyWebsite(links, "Acme AI", "https://techcrunch.com/2026/11/20/acme"), "https://acme.ai/")
  // An investor's site is not the company's, even if it is the only other link.
  assert.equal(pickCompanyWebsite(["https://www.sequoiacap.com/"], "Acme AI", "https://techcrunch.com/x"), null)
  assert.equal(pickCompanyWebsite([], "Acme", "https://techcrunch.com/x"), null)
})
