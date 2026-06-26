import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createLead, listLeads } from "@/lib/cms"
import { leadFromCapture, leadPayload, parseLeadFormData, parseLeadJson } from "@/lib/lead-capture"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const leads = await listLeads({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  })

  return NextResponse.json({ leads })
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  if (isRateLimited(`leads:${clientIp}`, 5)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  const parsed = contentType.includes("application/json")
    ? parseLeadJson(await request.json())
    : parseLeadFormData(await request.formData())

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead submission" }, { status: 400 })
  }

  if (parsed.data.fax) {
    return NextResponse.json({ accepted: true })
  }

  const lead = await createLead(leadPayload(leadFromCapture(parsed.data, request)))
  return NextResponse.json({ lead }, { status: 201 })
}
