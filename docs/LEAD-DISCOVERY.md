# Lead discovery (admin → Leads → Prospects)

Each weekday the app looks at 30–50 fresh, public buying signals, skips every company we already know, and saves **at
most five** prospects that score **70/100 or more**. If only two qualify, it saves two. It never sends email: each
prospect has a **Write Email** button that opens `/admin/email` with the recipient (when a public one exists), subject
and draft filled in. Sending from there marks the prospect **Contacted**.

## Flow

1. **Sources** (`src/lib/lead-discovery/sources/`), all dated by the source itself:
   - Hacker News "Launch HN" posts (new products, mostly YC startups).
   - Hacker News monthly "Who is hiring?" comments (hiring engineers: an opportunity to investigate, not proof of need).
   - Startup-news RSS feeds per market: TechCrunch Fundraising, Crunchbase News, Tech Funding News, UKTN (UK),
     BetaKit (Canada), Inc42 (India), Wamda (UAE / MENA), StartupSmart (Australia).
   - Optional: Tavily (`TAVILY_API_KEY`) and Serper (`SERPER_API_KEY`) news search, with rotating ICP queries.
   - To add a source (for example a Google Maps / local-business adapter), implement `DiscoverySource` in
     `types.ts` and add it to `sources/index.ts`. Nothing else changes.
2. **De-duplication** before any page is read or token spent: saved prospects, domains screened in the last 60 days,
   inbound leads (website and email domain), everyone emailed from Email and Outreach.
3. **Pre-score** (`signals.ts`, no network): signal type, round size, ICP words, agency words, age.
4. **Enrichment** (`enrich.ts`): reads the evidence page; the company site must be a link in that evidence whose domain
   matches the company name (`website.ts`); then reads the site's home page and one contact/about page. A public email
   is kept only if it is on the company's own domain and is a business mailbox (not press, careers, billing, no-reply).
5. **Qualification** (`prompts.ts`, `qualify.ts`): Groq returns 0–10 sub-scores for pain, fit, timing and evidence plus
   counter-evidence flags. The code then:
   - recomputes the 100-point total with fixed weights (pain 25, fit 25, timing 20, contact 15, evidence 15);
   - computes **contact** itself from checked facts (contact page, public email, named decision-maker);
   - caps **evidence** by the signal's age;
   - rejects sellers of dev services, wrong buyers, already-solved needs, weak evidence, or no service fit;
   - keeps a decision-maker's name only if it appears word for word in the evidence or on the company site.
6. **Drafts** for the top five only: 90–150 words, grounded in the signal. A draft with an email address, a foreign
   link, a placeholder or spam words is replaced by a plain template built from verified fields.
7. **Save**: `prospects` (unique by domain), `prospect_screened` (every verdict, so rejects are not re-scored daily),
   `prospect_runs` (summary per run; only one run at a time).

## Schedule and endpoints

| What | Where | Auth |
| --- | --- | --- |
| Weekday run, 03:00 UTC (08:30 IST) | Vercel Cron in `vercel.json` → `GET /api/cron/discover-leads` | `Authorization: Bearer $CRON_SECRET` (sent by Vercel) |
| Run now | Prospects screen button → `POST /api/admin/prospects/discover` | Admin session |
| Pre-filled email | `/admin/email?prospectId=<id>` (also `?to=&subject=&body=`) | Admin session |

Runs take 1–4 minutes (function limit 300 s). On Groq's free tier the token-per-minute limit is the bottleneck: the run
waits for the limit to reset and stops scoring before its time budget runs out; anything not scored is tried another
day ("not scored in time" in the run summary).

## Configuration

| Variable | Needed | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Vercel, Production + Preview. Without it the screen shows a notice and runs return 503. |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile`. |
| `TAVILY_API_KEY`, `SERPER_API_KEY` | No | Extra search coverage. |
| `CRON_SECRET` | Already set | Same secret as the Supabase keepalive cron. |

Database: `supabase/migrations/20261123000000_lead_discovery.sql` (additive). Tables are service-role only (RLS on,
no grants to `anon` / `authenticated`).

## Manual run from a terminal

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.codetelemetrylab.me/api/cron/discover-leads
```
