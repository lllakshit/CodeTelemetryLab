/**
 * Enrichment: read the evidence page, find the company's own site among its links, then read the site's home page
 * and one contact/about page for a public business email. Nothing here is guessed: every value comes from a page.
 */
import { hostOf, isExcludedDomain, nameMatchesDomain, normalizeDomain } from "./domain.ts"
import { fetchPublicPage } from "./fetch-page.ts"
import { clip, extractEmails, extractLinks, htmlToText, metaContent, pageTitle, pickPublicEmail } from "./html.ts"
import type { Candidate } from "./types.ts"
import { pickCompanyWebsite } from "./website.ts"

export type Enriched = {
  candidate: Candidate
  website: string
  domain: string
  /** Evidence text the model sees (article body or HN text). */
  sourceText: string
  /** Company home page text the model sees. */
  siteText: string
  contactPageUrl: string | null
  publicEmail: string | null
}

export type EnrichFailure = { candidate: Candidate; reason: "evidence_unreachable" | "no_website" | "site_unreachable"; domain?: string }

const CONTACT_PATH = /\/(contact|contact-us|about|about-us|company|team|get-in-touch|talk-to-us)\/?$/i

/** The article body: the longest run of text, without menus and footers. */
function articleText(html: string): string {
  const article = /<article\b[\s\S]*?<\/article>/i.exec(html)?.[0] ?? /<main\b[\s\S]*?<\/main>/i.exec(html)?.[0] ?? html
  return htmlToText(article)
}

/** Links inside the article body only, so sidebar and footer links are never taken for the company's site. */
function articleLinks(html: string, url: string): string[] {
  const article = /<article\b[\s\S]*?<\/article>/i.exec(html)?.[0] ?? /<main\b[\s\S]*?<\/main>/i.exec(html)?.[0] ?? html
  return extractLinks(article, url)
}

export async function enrichCandidate(candidate: Candidate, signal: AbortSignal): Promise<Enriched | EnrichFailure> {
  let sourceText = candidate.text ?? ""
  let links = candidate.linkedUrls
  if (!sourceText) {
    const page = await fetchPublicPage(candidate.evidenceUrl, { signal, timeoutMs: 9000, maxBytes: 800_000, accept: /text\/html|application\/xhtml/i })
    if (!page) return { candidate, reason: "evidence_unreachable" }
    sourceText = articleText(page.body)
    links = [...candidate.linkedUrls, ...articleLinks(page.body, page.url)]
  }

  const directHost = candidate.websiteUrl ? hostOf(candidate.websiteUrl) : null
  const website = directHost ? `https://${directHost}/` : pickCompanyWebsite(links, candidate.companyHint, candidate.evidenceUrl)
  let domain = website ? normalizeDomain(website) : null
  if (!website || !domain) return { candidate, reason: "no_website" }

  const home = (await fetchPublicPage(website, { signal, timeoutMs: 8000, maxBytes: 500_000, accept: /text\/html|application\/xhtml/i })) ??
    (await fetchPublicPage(`https://www.${domain}/`, { signal, timeoutMs: 8000, maxBytes: 500_000, accept: /text\/html|application\/xhtml/i }))
  if (!home) return { candidate, reason: "site_unreachable", domain }

  // A redirect to another domain (acme.ai -> acme.com) makes the final domain the company's; a redirect to a
  // platform (link-in-bio page, app store) means there is no real company site.
  const finalDomain = normalizeDomain(home.url)
  if (!finalDomain || isExcludedDomain(home.url)) return { candidate, reason: "no_website", domain }
  if (finalDomain !== domain) {
    // acme.ai -> acme.com is fine; a redirect to a parked page or another company's site is not.
    if (!candidate.companyHint || !nameMatchesDomain(candidate.companyHint, finalDomain)) return { candidate, reason: "no_website", domain }
    domain = finalDomain
  }

  const homeLinks = extractLinks(home.body, home.url)
  const contactPageUrl = homeLinks.find((link) => normalizeDomain(link) === domain && CONTACT_PATH.test(new URL(link).pathname.replace(/\/+$/, "/"))) ?? null
  let emails = extractEmails(home.body)
  if (contactPageUrl) {
    const contact = await fetchPublicPage(contactPageUrl, { signal, timeoutMs: 7000, maxBytes: 400_000, accept: /text\/html|application\/xhtml/i })
    if (contact) emails = [...emails, ...extractEmails(contact.body)]
  }

  const description = metaContent(home.body, "description") ?? metaContent(home.body, "og:description") ?? ""
  const siteText = clip(`${pageTitle(home.body) ?? ""}. ${description}. ${htmlToText(home.body)}`, 1400)

  return {
    candidate,
    website: `https://${new URL(home.url).hostname}/`,
    domain,
    sourceText: clip(sourceText, 2200),
    siteText,
    contactPageUrl,
    publicEmail: pickPublicEmail(emails, domain),
  }
}
