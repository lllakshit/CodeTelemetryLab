import { NextResponse } from "next/server"
import { z } from "zod"
import { isValidMobileAdminCredentials, issueMobileToken } from "@/lib/mobile-auth"

export const runtime = "nodejs"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 })
  }

  if (!isValidMobileAdminCredentials(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = issueMobileToken(parsed.data.email)
  return NextResponse.json({
    token,
    user: {
      email: parsed.data.email.trim().toLowerCase(),
      role: "admin",
    },
  })
}
