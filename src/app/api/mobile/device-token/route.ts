import { NextResponse } from "next/server"
import { z } from "zod"
import { getMobileSessionFromRequest, unauthorizedMobileResponse } from "@/lib/mobile-auth"
import { registerMobileDeviceToken, removeMobileDeviceToken } from "@/lib/mobile-device-store"

export const runtime = "nodejs"

const deviceTokenSchema = z.object({
  token: z.string().min(20),
  platform: z.literal("android"),
  packageName: z.string().max(200).optional().nullable(),
  deviceName: z.string().max(200).optional().nullable(),
  appVersion: z.string().max(80).optional().nullable(),
})

const unregisterSchema = z.object({
  token: z.string().min(20),
})

export async function POST(request: Request) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  const payload = await request.json().catch(() => null)
  const parsed = deviceTokenSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid device token payload" }, { status: 400 })
  }

  const device = await registerMobileDeviceToken({
    ...parsed.data,
    userEmail: session.email,
  })

  return NextResponse.json({ device })
}

export async function DELETE(request: Request) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  const payload = await request.json().catch(() => null)
  const parsed = unregisterSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid device token payload" }, { status: 400 })
  }

  const removed = await removeMobileDeviceToken(parsed.data.token)
  return NextResponse.json({ removed })
}
