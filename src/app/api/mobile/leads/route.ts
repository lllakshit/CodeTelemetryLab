import { NextResponse } from "next/server"
import { getMobileSessionFromRequest, unauthorizedMobileResponse } from "@/lib/mobile-auth"
import { listLeads } from "@/lib/cms"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  const url = new URL(request.url)
  const leads = await listLeads({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  })

  const summary = {
    total: leads.length,
    newCount: leads.filter((lead) => lead.status === "New").length,
    activeCount: leads.filter((lead) => !["Lost", "Archived", "Won"].includes(lead.status)).length,
    wonCount: leads.filter((lead) => lead.status === "Won").length,
  }

  return NextResponse.json({ leads, summary, user: { email: session.email } })
}
