/** Domain helpers for de-duplication and for telling company sites apart from news, social and platform hosts. */

/** Two-label public suffixes we meet in our markets. A domain under one of these keeps three labels. */
const TWO_LEVEL_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "ltd.uk", "plc.uk", "me.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in", "ac.in", "gov.in",
  "co.ae", "com.ae", "net.ae", "org.ae", "ac.ae", "gov.ae",
  "co.nz", "com.sg", "com.br", "co.za", "com.mx", "co.jp", "com.cn", "com.hk", "co.il",
])

/**
 * Hosts that are never a prospect's own website: news and funding press, social networks, code hosting, job
 * boards, app stores, big tech, generic mail and shared hosting platforms. Matched on the registrable domain.
 */
const EXCLUDED = new Set([
  // News, funding press and directories
  "techcrunch.com", "crunchbase.com", "betakit.com", "uktech.news", "inc42.com", "wamda.com", "smartcompany.com.au",
  "techfundingnews.com", "ycombinator.com", "venturebeat.com", "theverge.com", "wired.com", "forbes.com",
  "bloomberg.com", "reuters.com", "wsj.com", "ft.com", "cnbc.com", "businessinsider.com", "axios.com",
  "techradar.com", "zdnet.com", "sifted.eu", "eu-startups.com", "yourstory.com", "entrackr.com", "economictimes.com",
  "indiatimes.com", "livemint.com", "moneycontrol.com", "thenationalnews.com", "gulfnews.com", "afr.com",
  "startupdaily.net", "pitchbook.com", "dealroom.co", "cbinsights.com", "prnewswire.com", "businesswire.com",
  "globenewswire.com", "accesswire.com", "einpresswire.com", "producthunt.com", "wikipedia.org", "archive.org",
  "nytimes.com", "theguardian.com", "bbc.co.uk", "bbc.com", "cnn.com", "fortune.com", "fastcompany.com",
  "inc.com", "entrepreneur.com", "hbr.org", "arstechnica.com", "engadget.com", "thenextweb.com", "siliconangle.com",
  "geekwire.com", "techinasia.com", "tech.eu", "finextra.com", "fintechfutures.com", "medianama.com",
  // Social, blogging, video
  "twitter.com", "x.com", "linkedin.com", "lnkd.in", "facebook.com", "instagram.com", "threads.net", "tiktok.com",
  "youtube.com", "youtu.be", "vimeo.com", "medium.com", "substack.com", "reddit.com", "discord.com", "discord.gg",
  "t.me", "telegram.org", "whatsapp.com", "bsky.app", "mastodon.social", "quora.com", "pinterest.com",
  // Code, docs, platforms and shared hosting
  "github.com", "github.io", "gitlab.com", "bitbucket.org", "githubusercontent.com", "npmjs.com", "pypi.org",
  "huggingface.co", "arxiv.org", "notion.site", "notion.so", "vercel.app", "netlify.app", "herokuapp.com",
  "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "wordpress.com", "wixsite.com", "squarespace.com",
  "webflow.io", "framer.website", "framer.ai", "carrd.co", "bubbleapps.io", "replit.app", "glitch.me", "fly.dev",
  "onrender.com", "railway.app", "readthedocs.io", "gitbook.io", "google.com", "docs.google.com", "goo.gl",
  "forms.gle", "bit.ly", "t.co", "tinyurl.com", "linktr.ee", "calendly.com", "cal.com", "typeform.com",
  "zoom.us", "loom.com", "figma.com", "canva.com", "dropbox.com",
  // Job boards and applicant tracking
  "lever.co", "greenhouse.io", "ashbyhq.com", "workable.com", "wellfound.com", "angel.co", "glassdoor.com",
  "indeed.com", "naukri.com", "monster.com", "ziprecruiter.com", "workatastartup.com", "jobs.lever.co",
  "breezy.hr", "recruitee.com", "teamtailor.com", "bamboohr.com", "smartrecruiters.com", "personio.com",
  "myworkdayjobs.com", "rippling.com", "join.com", "hnhiring.com", "remoteok.com", "weworkremotely.com",
  // Big tech and app stores
  "apple.com", "microsoft.com", "amazon.com", "amazon.in", "aws.amazon.com", "meta.com", "openai.com",
  "anthropic.com", "nvidia.com", "ibm.com", "oracle.com", "salesforce.com", "sap.com", "adobe.com", "intel.com",
  "play.google.com", "apps.apple.com", "chromewebstore.google.com",
  // Generic mail
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com",
  "proton.me", "protonmail.com", "aol.com", "zoho.com", "yandex.com", "gmx.com", "mail.com",
])

/** Lower-cased host of a URL, bare domain or email address, without "www." or a trailing dot. */
export function hostOf(input: string | null | undefined): string | null {
  if (!input) return null
  let raw = String(input).trim().toLowerCase()
  if (!raw) return null
  if (raw.includes("@") && !raw.includes("/")) raw = raw.slice(raw.lastIndexOf("@") + 1)
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(raw)) raw = `https://${raw}`
  try {
    const host = new URL(raw).hostname.replace(/\.$/, "").replace(/^www\d?\./, "")
    if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return null
    return host
  } catch {
    return null
  }
}

/** Registrable domain ("app.acme.co.uk" -> "acme.co.uk"), used as the de-duplication key. */
export function normalizeDomain(input: string | null | undefined): string | null {
  const host = hostOf(input)
  if (!host) return null
  const labels = host.split(".").filter(Boolean)
  if (labels.length < 2) return null
  const lastTwo = labels.slice(-2).join(".")
  if (TWO_LEVEL_SUFFIXES.has(lastTwo)) return labels.length >= 3 ? labels.slice(-3).join(".") : null
  return lastTwo
}

/** True when the host can never be a prospect's own website. */
export function isExcludedDomain(input: string | null | undefined): boolean {
  const host = hostOf(input)
  const domain = normalizeDomain(input)
  if (!host || !domain) return true
  if (EXCLUDED.has(domain) || EXCLUDED.has(host)) return true
  // Any sub-host of an excluded domain ("jobs.lever.co", "blog.medium.com").
  for (const part of host.split(".").map((_, index, all) => all.slice(index).join("."))) {
    if (EXCLUDED.has(part)) return true
  }
  return false
}

/** Letters and digits only, for loose name matching ("Acme AI" ~ "acmeai.com"). */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "")
}

/** First label of a registrable domain ("acme.co.uk" -> "acme"). */
export function domainLabel(domain: string): string {
  return domain.split(".")[0] ?? domain
}

/**
 * Does a company name plausibly own this domain? Used to pick the company's site among an article's links, so a
 * site is only chosen when the name and the domain agree (never on the model's word).
 */
export function nameMatchesDomain(company: string, domain: string): boolean {
  const name = slug(company.replace(/\b(inc|ltd|llc|limited|corp|corporation|gmbh|pvt|private|technologies|technology|labs?|hq|app)\b\.?/gi, " "))
  const label = slug(domainLabel(domain))
  if (name.length < 3 || label.length < 3) return false
  if (label === name) return true
  // "Acme AI" -> acme.ai, "Rivet HQ" -> rivet.dev: the name without a product suffix equals the label.
  const core = name.replace(/(ai|hq|app|io|labs?|tech|inc|co)$/, "")
  if (core.length >= 3 && core === label) return true
  if (label.startsWith(name) || name.startsWith(label)) return Math.min(label.length, name.length) >= 5 && Math.abs(label.length - name.length) <= 4
  // "getacme", "acmehq", "tryacme", "useacme", "joinacme"
  const stripped = label.replace(/^(get|try|use|join|go|hey|with|meet)/, "").replace(/(hq|app|ai|io|labs?|inc|co|tech|team)$/, "")
  return stripped.length >= 3 && (stripped === name || (stripped.length >= 4 && name.startsWith(stripped)))
}
