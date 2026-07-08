import { NextResponse } from "next/server"
import { getMobileSessionFromRequest, unauthorizedMobileResponse } from "@/lib/mobile-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  return NextResponse.json({
    user: {
      email: session.email,
      role: session.role,
    },
  })
}
