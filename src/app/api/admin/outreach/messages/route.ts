import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { listMessages, refreshOutreachStatuses } from "@/lib/outreach/store"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    if (new URL(request.url).searchParams.get("refresh") === "1") await refreshOutreachStatuses()
    return NextResponse.json({ messages: await listMessages(50) })
  } catch (error) {
    console.error("Outreach: could not load messages", error)
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 })
  }
}
