import { createPublicKey, verify, type JsonWebKey } from "node:crypto"

/**
 * Verifies a GitHub Actions OIDC token, so the repository's workflow can hand the app a sender account
 * without any shared password. GitHub signs the token; we check the signature against GitHub's public keys
 * and that it was issued for this repository, branch, workflow and audience.
 */
export const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com"
export const GITHUB_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`

export type OidcExpectations = {
  audience: string
  repository: string
  /** Allowed git refs, e.g. ["refs/heads/main"]. */
  refs: string[]
  /** The workflow file that is allowed to call, e.g. ".github/workflows/outreach-sync.yml". */
  workflowFile: string
}

export type Jwks = { keys: Array<JsonWebKey & { kid?: string }> }
export type JwksLoader = (force?: boolean) => Promise<Jwks>

export type OidcResult = { ok: true; claims: Record<string, unknown> } | { ok: false; reason: string }

function decodePart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>
}

let cached: { at: number; jwks: Jwks } | null = null

/** `force` skips the cache, used when a token names a key we have not seen (GitHub rotated its keys). */
export const loadGithubJwks: JwksLoader = async (force = false) => {
  if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.jwks
  const response = await fetch(GITHUB_JWKS_URL, { cache: "no-store", signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`Could not load GitHub signing keys (${response.status}).`)
  const jwks = (await response.json()) as Jwks
  cached = { at: Date.now(), jwks }
  return jwks
}

export async function verifyGithubActionsToken(
  token: string,
  expected: OidcExpectations,
  loadJwks: JwksLoader = loadGithubJwks,
  now = Date.now(),
): Promise<OidcResult> {
  const parts = token.split(".")
  if (parts.length !== 3) return { ok: false, reason: "Malformed token." }

  let header: Record<string, unknown>
  let claims: Record<string, unknown>
  try {
    header = decodePart(parts[0])
    claims = decodePart(parts[1])
  } catch {
    return { ok: false, reason: "Malformed token." }
  }
  if (!header || typeof header !== "object" || !claims || typeof claims !== "object") {
    return { ok: false, reason: "Malformed token." }
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") return { ok: false, reason: "Unsupported token." }

  let jwks: Jwks
  try {
    jwks = await loadJwks()
  } catch {
    return { ok: false, reason: "Could not load GitHub signing keys." }
  }
  let jwk = jwks.keys.find((key) => key.kid === header.kid)
  if (!jwk) {
    try {
      jwk = (await loadJwks(true)).keys.find((key) => key.kid === header.kid)
    } catch {
      jwk = undefined
    }
  }
  if (!jwk) return { ok: false, reason: "Unknown signing key." }

  let valid = false
  try {
    valid = verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: "jwk" }),
      Buffer.from(parts[2], "base64url"),
    )
  } catch {
    valid = false
  }
  if (!valid) return { ok: false, reason: "Bad signature." }

  const seconds = Math.floor(now / 1000)
  const leeway = 60
  if (claims.iss !== GITHUB_OIDC_ISSUER) return { ok: false, reason: "Wrong issuer." }
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audiences.includes(expected.audience)) return { ok: false, reason: "Wrong audience." }
  if (typeof claims.exp !== "number" || claims.exp + leeway < seconds) return { ok: false, reason: "Token expired." }
  if (typeof claims.nbf === "number" && claims.nbf - leeway > seconds) return { ok: false, reason: "Token not valid yet." }
  if (claims.repository !== expected.repository || claims.repository_owner !== expected.repository.split("/")[0]) return { ok: false, reason: "Wrong repository." }
  if (typeof claims.ref !== "string" || !expected.refs.includes(claims.ref)) return { ok: false, reason: "Wrong branch." }
  const workflowRef = typeof claims.job_workflow_ref === "string" ? claims.job_workflow_ref : ""
  if (!workflowRef.startsWith(`${expected.repository}/${expected.workflowFile}@`)) {
    return { ok: false, reason: "Wrong workflow." }
  }
  return { ok: true, claims }
}
