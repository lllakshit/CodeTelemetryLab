import assert from "node:assert/strict"
import { generateKeyPairSync, sign, type JsonWebKey } from "node:crypto"
import { test } from "node:test"
import {
  GITHUB_OIDC_ISSUER,
  verifyGithubActionsToken,
  type OidcExpectations,
} from "../../src/lib/outreach/github-oidc.ts"

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
const jwk = { ...(publicKey.export({ format: "jwk" }) as JsonWebKey), kid: "test-key", alg: "RS256", use: "sig" }
const jwks = { keys: [jwk] }
const loader = async () => jwks

const expected: OidcExpectations = {
  audience: "codetelemetrylab-outreach-sync",
  repository: "lllakshit/CodeTelemetryLab",
  refs: ["refs/heads/main"],
  workflowFile: ".github/workflows/outreach-sync.yml",
}
const NOW = 1_800_000_000_000

function token(overrides: Record<string, unknown> = {}, kid = "test-key", key = privateKey) {
  const claims = {
    iss: GITHUB_OIDC_ISSUER,
    aud: expected.audience,
    exp: Math.floor(NOW / 1000) + 300,
    nbf: Math.floor(NOW / 1000) - 10,
    repository: expected.repository,
    repository_owner: "lllakshit",
    ref: "refs/heads/main",
    job_workflow_ref: `${expected.repository}/${expected.workflowFile}@refs/heads/main`,
    ...overrides,
  }
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url")
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), key).toString("base64url")
  return `${header}.${payload}.${signature}`
}

const check = (t: string) => verifyGithubActionsToken(t, expected, loader, NOW)

test("a correct token from the right repository, branch and workflow is accepted", async () => {
  assert.equal((await check(token())).ok, true)
})

test("each wrong claim is refused", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["audience", { aud: "something-else" }],
    ["issuer", { iss: "https://evil.example.com" }],
    ["repository", { repository: "someone/else" }],
    ["owner", { repository_owner: "someone" }],
    ["missing expiry", { exp: undefined }],
    ["branch", { ref: "refs/heads/feature" }],
    ["workflow", { job_workflow_ref: `${expected.repository}/.github/workflows/other.yml@refs/heads/main` }],
    ["expiry", { exp: Math.floor(NOW / 1000) - 3600 }],
    ["not-before", { nbf: Math.floor(NOW / 1000) + 3600 }],
  ]
  for (const [name, overrides] of cases) {
    assert.equal((await check(token(overrides))).ok, false, name)
  }
})

test("a token signed by another key is refused", async () => {
  const other = generateKeyPairSync("rsa", { modulusLength: 2048 })
  assert.equal((await check(token({}, "test-key", other.privateKey))).ok, false)
})

test("an unknown key id is refused", async () => {
  assert.equal((await check(token({}, "unknown"))).ok, false)
})

test("garbage is refused", async () => {
  for (const t of ["", "a.b", "a.b.c", "not-a-token"]) assert.equal((await check(t)).ok, false, t)
})

test("a tampered payload is refused", async () => {
  const [h, , s] = token().split(".")
  const forged = Buffer.from(JSON.stringify({ iss: GITHUB_OIDC_ISSUER, aud: expected.audience, repository: expected.repository, ref: "refs/heads/main", exp: 9999999999, job_workflow_ref: `${expected.repository}/${expected.workflowFile}@x` })).toString("base64url")
  assert.equal((await check(`${h}.${forged}.${s}`)).ok, false)
})

test("a failure to load GitHub's keys is a refusal, not a crash", async () => {
  const result = await verifyGithubActionsToken(token(), expected, async () => {
    throw new Error("network")
  }, NOW)
  assert.equal(result.ok, false)
})

test("a header or payload that is JSON null is refused without crashing", async () => {
  const bad = Buffer.from("null").toString("base64url")
  assert.equal((await check(`${bad}.${bad}.x`)).ok, false)
})

test("other algorithms are refused (none, HS256)", async () => {
  for (const alg of ["none", "HS256"]) {
    const header = Buffer.from(JSON.stringify({ alg, kid: "test-key" })).toString("base64url")
    const payload = Buffer.from(JSON.stringify({ iss: GITHUB_OIDC_ISSUER, aud: expected.audience })).toString("base64url")
    assert.equal((await check(`${header}.${payload}.`)).ok, false, alg)
    assert.equal((await check(`${header}.${payload}.sig`)).ok, false, alg)
  }
})

test("a missing key id is refused", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url")
  const payload = Buffer.from(JSON.stringify({ iss: GITHUB_OIDC_ISSUER })).toString("base64url")
  assert.equal((await check(`${header}.${payload}.sig`)).ok, false)
})

test("the audience may be a list that contains ours", async () => {
  assert.equal((await check(token({ aud: ["other", expected.audience] }))).ok, true)
  assert.equal((await check(token({ aud: ["other"] }))).ok, false)
})

test("an unknown key id triggers one fresh fetch, so a GitHub key rotation does not lock us out", async () => {
  const calls: boolean[] = []
  const rotating = async (force?: boolean) => {
    calls.push(Boolean(force))
    return force ? jwks : { keys: [] }
  }
  const result = await verifyGithubActionsToken(token(), expected, rotating, NOW)
  assert.equal(result.ok, true)
  assert.deepEqual(calls, [false, true])
})
