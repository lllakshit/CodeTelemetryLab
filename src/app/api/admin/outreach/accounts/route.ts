import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { listAccounts, saveAccount, setDefaultAccount } from "@/lib/outreach/store"

const saveSchema = z.object({
  fromEmail: z.string().trim().toLowerCase().email("Enter a valid sender email"),
  displayName: z.string().trim().min(1, "Enter the sender name").max(120),
  apiKey: z.string().trim().max(300).optional(),
  signature: z.string().max(2000).optional(),
  makeDefault: z.boolean().optional(),
})

async function guard() {
  const session = await auth()
  return session?.user ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  try {
    return NextResponse.json({ accounts: await listAccounts() })
  } catch (error) {
    console.error("Outreach: could not load accounts", error)
    return NextResponse.json({ error: "Could not load accounts." }, { status: 500 })
  }
}

/** Adds an account or updates one (same sender email). The API key is only ever written, never returned. */
export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied

  const parsed = saveSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })
  }
  try {
    const account = await saveAccount({ ...parsed.data, source: "manual" })
    return NextResponse.json({ ok: true, account, accounts: await listAccounts() })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the account."
    console.error("Outreach: could not save the account", message)
    return NextResponse.json({ error: message.startsWith("An API key") ? message : "Could not save the account." }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const denied = await guard()
  if (denied) return denied

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  try {
    await setDefaultAccount(parsed.data.id)
    return NextResponse.json({ ok: true, accounts: await listAccounts() })
  } catch (error) {
    console.error("Outreach: could not change the default sender", error)
    return NextResponse.json({ error: "Could not change the default sender." }, { status: 500 })
  }
}
