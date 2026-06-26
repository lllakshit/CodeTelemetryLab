import { auth } from "@/auth"
import { listLeads } from "@/lib/cms"

const headers = [
  "Full Name",
  "Company",
  "Email",
  "Phone",
  "Country",
  "Budget",
  "Timeline",
  "Service",
  "Subject",
  "Message",
  "Preferred Contact",
  "Website",
  "Status",
  "Notes",
  "Assigned Team Member",
  "Source",
  "Referrer",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "Created At",
  "Updated At",
]

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const leads = await listLeads({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  })

  const rows = leads.map((lead) => [
    lead.fullName,
    lead.companyName,
    lead.email,
    lead.phone,
    lead.country,
    lead.budget,
    lead.timeline,
    lead.serviceInterestedIn,
    lead.subject,
    lead.message,
    lead.preferredContactMethod,
    lead.websiteUrl,
    lead.status,
    lead.notes,
    lead.assignedTeamMember,
    lead.source,
    lead.referrer,
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.createdAt,
    lead.updatedAt,
  ])

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codetelemetrylabs-leads.csv"`,
    },
  })
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  return `"${text.replaceAll('"', '""')}"`
}
