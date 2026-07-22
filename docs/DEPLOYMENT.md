# Deployment environments

## URLs

| Environment | Git branch | URL |
|---|---|---|
| Production | `main` | https://www.codetelemetrylab.me |
| Staging | `Staging` | https://staging.codetelemetrylab.me |
| Preview | any PR / feature branch | Unique `*.vercel.app` URL from the Vercel check |

## Flow

1. Open a PR **into `Staging`** (not `main`).
2. Vercel posts a Preview URL on the PR; GitHub Actions runs lint + build.
3. Merge the PR into `Staging` → Vercel deploys that commit to **https://staging.codetelemetrylab.me**.
4. Verify Staging.
5. Open a PR from `Staging` → `main` and merge → Vercel deploys **Production** (https://www.codetelemetrylab.me).

## Notes

- The Vercel project is on the **Hobby** plan, so Staging uses a **branch domain** on the Preview environment (not a Pro custom environment). Behavior is the same for this workflow: a stable staging URL tied to the `Staging` branch.
- Production branch in Vercel is **`main`**. GitHub default branch is also `main`.
- Staging domain `staging.codetelemetrylab.me` is attached to the `Staging` git branch and verified.
- Staging-only env overrides: `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` → `https://staging.codetelemetrylab.me` (Preview + git branch `Staging`).
- If `staging.codetelemetrylab.me` fails to resolve, add a DNS `CNAME` for `staging` → `cname.vercel-dns.com` at your domain registrar (apex is already verified on Vercel).
- Do not change Vercel deploy YAML / project settings unless DevOps asks.
