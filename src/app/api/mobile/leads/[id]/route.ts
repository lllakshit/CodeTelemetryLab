import { NextResponse } from "next/server"
import { z } from "zod"
import { getMobileSessionFromRequest, unauthorizedMobileResponse } from "@/lib/mobile-auth"
import { getLeadById, updateLead } from "@/lib/cms"
import { leadStatuses } from "@/lib/store"

export const runtime = "nodejs"

const updateLeadSchema = z.object({
  status: z.enum(leadStatuses).optional(),
  notes: z.string().max(5000).optional().nullable(),
  assignedTeamMember: z.string().max(160).optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  const { id } = await params
  const lead = await getLeadById(id)
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  return NextResponse.json({ lead })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getMobileSessionFromRequest(request)
  if (!session) {
    return unauthorizedMobileResponse()
  }

  const payload = await request.json().catch(() => null)
  const parsed = updateLeadSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead update" }, { status: 400 })
  }

  const { id } = await params
  const lead = await updateLead(id, {
    status: parsed.data.status,
    notes: parsed.data.notes ?? undefined,
    assignedTeamMember: parsed.data.assignedTeamMember ?? undefined,
  })

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  return NextResponse.json({ lead })
}
