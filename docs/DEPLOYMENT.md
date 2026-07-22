# Deployment environments

## URLs

| Environment | Git branch | URL |
|---|---|---|
| Production | `main` | https://www.codetelemetrylab.me |
| Staging (Vercel — use this now) | `Staging` | https://code-telemetry-git-9fd5c4-llakshitmathur239-gmailcoms-projects.vercel.app |
| Staging (custom domain) | `Staging` | https://staging.codetelemetrylab.me — needs DNS (see below) |
| Preview | any PR / feature branch | Unique `*.vercel.app` URL from the Vercel check |

The Staging **Vercel branch alias** updates automatically whenever `Staging` deploys. Prefer that URL until DNS for `staging.codetelemetrylab.me` is fixed.

## Fix `staging.codetelemetrylab.me` DNS

Vercel already has the domain attached and verified, but the registrar has **no DNS record** for `staging` (www works; staging does not).

At your DNS provider for `codetelemetrylab.me`, add:

| Type | Name | Value |
|---|---|---|
| CNAME | `staging` | `cname.vercel-dns.com` |

After DNS propagates, https://staging.codetelemetrylab.me will work.

## Flow

1. Open a PR **into `Staging`** (not `main`).
2. Vercel posts a Preview URL on the PR; GitHub Actions runs lint + build.
3. Merge into `Staging` → deploys to the Staging Vercel branch URL (and custom domain once DNS exists).
4. Verify Staging.
5. Open a PR from `Staging` → `main` and merge → Production at https://www.codetelemetrylab.me.

## Notes

- Hobby plan: Staging is a Preview branch domain (stable alias), not a Pro custom environment.
- Production branch in Vercel is `main`. GitHub default branch is `main`.
- Staging env overrides: `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` for git branch `Staging`.
- Do not change Vercel deploy YAML / project settings unless DevOps asks.
