import { redirect } from "next/navigation"
import { createLead } from "@/lib/cms"
import { sendContactNotification } from "@/lib/contact-email"
import { leadFromCapture, leadPayload, parseLeadFormData } from "@/lib/lead-capture"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const clientIp = getClientIp(request)
  if (isRateLimited(`contact:${clientIp}`, 5)) {
    return Response.json({ error: "Too many submissions. Please try again later." }, { status: 429 })
  }

  const formData = await request.formData()
  const parsed = parseLeadFormData(formData)

  if (!parsed.success) {
    console.warn("Invalid contact submission", parsed.error.flatten().fieldErrors)
    if (prefersHtml(request)) {
      redirect("/contact?error=invalid")
    }

    return Response.json({ error: "Invalid submission" }, { status: 400 })
  }

  if (parsed.data.fax) {
    redirect("/contact?sent=1")
  }

  const leadInput = leadPayload(leadFromCapture(parsed.data, request))
  const lead = await createLead(leadInput)

  try {
    await sendContactNotification({
      name: lead.fullName,
      email: lead.email,
      company: lead.companyName,
      projectType: lead.serviceInterestedIn,
      budget: lead.budget ?? "Not specified",
      message: lead.message,
    })
  } catch (error) {
    console.error("Failed to send contact notification", error)
  }

  redirect("/contact?sent=1")
}

function prefersHtml(request: Request) {
  const accept = request.headers.get("accept") ?? ""
  return accept.includes("text/html")
}
