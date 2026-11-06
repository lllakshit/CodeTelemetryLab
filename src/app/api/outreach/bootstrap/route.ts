import { NextResponse } from "next/server"
import { z } from "zod"
import { verifyGithubActionsToken } from "@/lib/outreach/github-oidc"
import { listAccounts, saveAccount } from "@/lib/outreach/store"

/** Must match the audience requested in .github/workflows/outreach-sync.yml. */
const AUDIENCE = "codetelemetrylab-outreach-sync"
const REPOSITORY = "lllakshit/CodeTelemetryLab"
const WORKFLOW_FILE = ".github/workflows/outreach-sync.yml"

const schema = z.object({
  fromEmail: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().min(8).max(300),
  signature: z.string().max(2000).optional(),
})

/**
 * Lets the repository's own workflow hand the app a sender account (its Resend key lives in a GitHub secret).
 * No shared password: the call must carry a GitHub-signed token for this repository, the main branch and
 * this one workflow. The key is encrypted before it is stored and never logged.
 */
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const verified = await verifyGithubActionsToken(token, {
    audience: AUDIENCE,
    repository: REPOSITORY,
    refs: ["refs/heads/main"],
    workflowFile: WORKFLOW_FILE,
  })
  if (!verified.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  try {
    const existing = (await listAccounts()).find((account) => account.fromEmail === parsed.data.fromEmail)
    // A key someone set in the admin screen wins over the GitHub secret, so a later run cannot bring back an old key.
    if (existing && existing.source === "manual") {
      return NextResponse.json({ ok: true, id: existing.id, keyLast4: existing.keyLast4, created: false, skipped: true })
    }
    const account = await saveAccount({
      fromEmail: parsed.data.fromEmail,
      displayName: existing ? existing.displayName : parsed.data.displayName,
      apiKey: parsed.data.apiKey,
      // A signature written in the admin screen is never overwritten by a later sync.
      signature: existing ? undefined : parsed.data.signature,
      source: "github",
    })
    return NextResponse.json({ ok: true, id: account.id, keyLast4: account.keyLast4, created: !existing })
  } catch (error) {
    console.error("Outreach: bootstrap failed", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Could not store the account." }, { status: 500 })
  }
}
