# CodeTelemetryLab — Phase 1 Full Technical SEO Audit

**Branch:** `seo/foundation-complete-audit` (from `codex/phase-1-foundation`)  
**Production:** https://www.codetelemetrylab.me  
**Audit date:** 2026-07-22  
**Status:** Read-only complete. No code changes applied yet.

---

## Executive verdict

The site already has strong Next.js SEO primitives (metadataBase, robots, sitemap, Organization JSON-LD, service/FAQ schema, canonicals on most pages). Brand ranking for **"CodeTelemetryLab" / "CodeTelemetry Lab"** is weakened primarily by:

1. **Brand string mismatch** — site uses **CodeTelemetryLabs** (plural) while domain/email/search queries use **CodeTelemetryLab** (singular).
2. **Weak brand entity signals** — empty `sameAs`, no WebSite schema, homepage H1 without brand, no founder/Person EEAT.
3. **Competing / low-quality index surface** — ~200 thin city×service pages + ~50 templated blog posts dilute topical authority and crawl budget.
4. **Title duplication** on local pages (`… | CodeTelemetryLabs | CodeTelemetryLabs`).
5. **Friction-heavy contact form** and weak CTA copy hurt conversions once traffic arrives.

Apex → www 308 redirect is correctly configured on Vercel. Live sitemap currently returns 200 (earlier intermittent 500s remain a risk if CMS throws).

---

## Why other sites outrank the brand query

| Cause | In website control? | Evidence |
|---|---|---|
| Brand name in titles/schema is `CodeTelemetryLabs`, not `CodeTelemetryLab` | Yes | `layout.tsx`, `seo.ts`, footer, OG |
| No strong Knowledge Panel signals (`sameAs`, founder, Wikipedia/LinkedIn/GitHub) | Partially | `sameAs: []` in `organizationJsonLd` |
| Homepage title leads with generic services, brand only as suffix | Yes | Live title: `AI Development, Automation & Custom Software Agency \| CodeTelemetryLabs` |
| Homepage H1 is product copy without brand | Yes | CMS `heroTitle` |
| Preview/Vercel URLs and third-party WP plugin pages may still be indexed | Partially | External; site can add clearer brand + Organization + WebSite |
| Thin programmatic pages may cause quality filters that suppress brand trust | Yes | 200 local pages in sitemap |
| Missing legal pages / thin About EEAT | Yes | No privacy/terms routes |

---

## What already looks good

- `metadataBase`, title template, root OG/Twitter, favicon/apple icons
- `robots.ts`: Allow `/`, Disallow `/admin` + `/api`, Sitemap referenced
- Dynamic `sitemap.ts` with static + services + cities + local + blogs + projects; CMS failure fallback
- Apex → `www` 308 on production
- Organization + ProfessionalService JSON-LD sitewide
- Service + FAQPage schema on service and city×service pages
- Article / CreativeWork JSON-LD on blog/project details
- Canonicals on nearly all public templates
- Public pages mostly Server Components; fonts via `next/font`
- Admin gated via `proxy.ts` matcher `/admin/:path*` only
- MDX remaps `#` → `h2` (avoids dual H1)

---

## Site map (public)

| Route | Notes |
|---|---|
| `/` | Home |
| `/services`, `/services/[slug]` | 19 services |
| `/projects`, `/projects/[slug]` | Case studies (CMS) |
| `/blog`, `/blog/[slug]` | CMS + ~50 MDX posts |
| `/locations`, `/locations/[city]`, `/locations/[city]/[service]` | 20 cities × ~10 priority services ≈ **200** local pages |
| `/about`, `/contact` | Trust / conversion |
| `/admin/*`, `/api/*` | Private (robots disallowed) |
| `/feed.xml` | RSS; not advertised in `<head>` |

**Missing vs requested IA:** dedicated Resources hub, Legal (privacy/terms), WordPress Performance as first-class silo (may exist only as service slug).

---

## Finding register

### Critical

| ID | Finding | Impact |
|---|---|---|
| C1 | Brand identity = `CodeTelemetryLabs` everywhere; domain/search = `CodeTelemetryLab` | Exact-match brand SERP failure |
| C2 | ~200 templated city×service pages in sitemap | Doorway / thin-content risk; crawl dilution |
| C3 | Programmatic MDX blog (~50) + seed CMS posts share formulaic structure | Weak EEAT / topical authority |

### High

| ID | Finding | Impact |
|---|---|---|
| H1 | City×service titles include brand, then root template appends brand again | Duplicate title fragments |
| H2 | No `WebSite` (+ SearchAction) schema | Weak sitewide entity |
| H3 | `sameAs: []` — no LinkedIn/GitHub/X | Weak Knowledge Panel |
| H4 | Contact form requires budget + project type; 12+ visible fields; CTA = "Submit inquiry" | Conversion friction |
| H5 | No privacy/terms pages | Trust / compliance signal gap |

### Medium

| ID | Finding | Impact |
|---|---|---|
| M1 | `/projects` index missing `alternates.canonical` | Index inconsistency |
| M2 | Blog: no Person author UI/schema; TOC/FAQ schema absent; frontmatter `canonical` (apex) unused | EEAT + consistency |
| M3 | Blog `[slug]` uses `force-dynamic` | TTFB / CWV cost |
| M4 | MDX uses raw `<img>` with empty-alt fallback | A11y + image SEO |
| M5 | Homepage service cards not linked to `/services/[slug]` | Internal linking / crawl |
| M6 | Case studies often use stock/Unsplash visuals | Weak proof / EEAT |
| M7 | Admin login lacks meta `noindex` | Defense in depth |
| M8 | RSS not in metadata `alternates.types` | Discoverability |
| M9 | Breadcrumb JSON-LD helper unused and drops relative `item` URLs | Rich results gap |
| M10 | Twitter cards incomplete on some location pages | Social consistency |

### Low

| ID | Finding |
|---|---|
| L1 | `buildPageMetadata` defined but unused — inconsistent patterns |
| L2 | Email brand OK (`@codetelemetrylab.me`) vs admin defaults mentioning `codetelemetrylabs.com` |
| L3 | Sitemap does not list `/feed.xml` (optional) |

---

## Live production checks (2026-07-22)

| Check | Result |
|---|---|
| `https://codetelemetrylab.me` | **308** → `https://www.codetelemetrylab.me/` |
| `/robots.txt` | 200 — Allow `/`, Disallow `/admin`, `/api`, Sitemap URL present |
| `/sitemap.xml` | 200 XML (~79KB); earlier WebFetch saw intermittent 500 |
| Homepage `<title>` | `AI Development, Automation & Custom Software Agency \| CodeTelemetryLabs` |
| Homepage canonical | `https://www.codetelemetrylab.me` |

---

## Robots.txt assessment (Phase 2 preview)

Current generation is **acceptable**:

```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://www.codetelemetrylab.me/sitemap.xml
```

Improvements to consider (not yet applied):

- Prefer `/admin/` and `/api/` trailing-slash form for clarity
- Explicitly disallow `/admin/login` is redundant if `/admin` prefixes match
- Never disallow CSS/JS/images (currently correct — do not change)

---

## Sitemap assessment (Phase 3 preview)

- Dynamic Next.js `sitemap.ts` present and comprehensive
- Includes home, services, projects, about, blog, contact, locations, city, local, posts, projects
- **Does not** include legal pages (none exist)
- **Includes** all 200 local pages — primary quality risk
- CMS failure path still emits static + programmatic URLs (good)

---

## Contact form CRO audit (Phase 10 preview)

**Required today:** Name, Email, Service, Budget, Message  
**Also shown:** Company, Phone, Country, Timeline, Preferred contact, Website, Subject  

Recommendation: primary step = Name + Email + Message only; move rest to optional accordion / step 2; CTA → **"Book Free Consultation"** or **"Let's Discuss Your Project"**.

---

## Proposed implementation order (after this audit)

| Iteration | Scope | Risk |
|---|---|---|
| **A** | Brand lock: display name strategy, WebSite schema, sameAs hooks, fix double titles, projects canonical, RSS link, admin noindex, breadcrumb helper | Low |
| **B** | robots/sitemap polish; legal stubs; homepage internal links; contact form CRO | Low–Med |
| **C** | Local page strategy (fewer URLs or unique content); blog author/TOC/FAQ scaffolding | Med |
| **D** | Case study depth, a11y/perf, Search Console title/CTR pass | Med |

**Brand naming decision required before Iteration A:**

- **Option 1 (recommended for brand SERP):** Public brand = **CodeTelemetryLab** (match domain + search). Keep “Labs” only in logo asset filenames if needed.
- **Option 2:** Legal/public brand stays **CodeTelemetryLabs**, but titles/schema include alternateName `CodeTelemetryLab` + `CodeTelemetry Lab`.

---

## Success criteria mapping

| Goal | Current gap |
|---|---|
| Brand #1 for CodeTelemetryLab | C1, H2, H3, homepage H1/title |
| Crawlability / indexing | C2, sitemap size, orphan local depth |
| EEAT / authority | C3, M2, M6, no founder |
| Conversions | H4 |
| CWV | M3, M4 |
| Accessibility | M4 + focus/contrast pass pending |

---

## Next step

Await confirmation of **brand naming Option 1 vs 2**, then implement **Iteration A** on `seo/foundation-complete-audit` with an explanation of each change before code is applied.
