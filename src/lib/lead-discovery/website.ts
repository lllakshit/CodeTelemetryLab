/** Choosing a company's own website from the links in its evidence. Pure. */
import { hostOf, isExcludedDomain, nameMatchesDomain, normalizeDomain } from "./domain.ts"

/**
 * The company's site among the evidence links, as an origin ("https://acme.ai/"), or null.
 * A link counts only if its domain is not a news/social/platform host, is not the evidence site itself, and either
 * matches the company name or is the only candidate link. The model never chooses the website.
 */
export function pickCompanyWebsite(links: string[], company: string | null, evidenceUrl: string): string | null {
  const evidenceDomain = normalizeDomain(evidenceUrl)
  const byDomain = new Map<string, string>()
  for (const link of links) {
    const domain = normalizeDomain(link)
    if (!domain || domain === evidenceDomain || isExcludedDomain(link)) continue
    if (!byDomain.has(domain)) byDomain.set(domain, link)
  }
  if (!byDomain.size) return null
  const entries = [...byDomain.entries()]
  const matched = company ? entries.find(([domain]) => nameMatchesDomain(company, domain)) : undefined
  const chosen = matched ?? (entries.length === 1 && !company ? entries[0] : undefined)
  if (!chosen) return null
  const host = hostOf(chosen[1])
  return host ? `https://${host}/` : null
}
