import { getContactNotificationFrom, getContactNotificationTo } from "@/lib/contact"
import { escapeEmailHtml, wrapBrandedEmailHtml } from "@/lib/email-branding"

type ContactSubmission = {
  name: string
  email: string
  company?: string | null
  projectType: string
  budget: string
  message: string
}

export async function sendContactNotification(submission: ContactSubmission) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = getContactNotificationFrom()
  const to = getContactNotificationTo()

  if (!apiKey || !from || !to) {
    return {
      delivered: false,
      skipped: true,
    }
  }

  const companyLine = submission.company?.trim() ? submission.company.trim() : "Not provided"

  const html = wrapBrandedEmailHtml(
    `
      <h1 style="font-size: 20px; margin: 0 0 16px; font-weight: 600;">New CodeTelemetryLab inquiry</h1>
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeEmailHtml(submission.name)}</p>
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeEmailHtml(submission.email)}</p>
      <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeEmailHtml(companyLine)}</p>
      <p style="margin: 0 0 8px;"><strong>Project type:</strong> ${escapeEmailHtml(submission.projectType)}</p>
      <p style="margin: 0 0 8px;"><strong>Budget:</strong> ${escapeEmailHtml(submission.budget)}</p>
      <div style="margin-top: 20px; padding: 16px; border: 1px solid #dee3e9; border-radius: 16px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
        <p style="margin: 0; white-space: pre-wrap;">${escapeEmailHtml(submission.message)}</p>
      </div>
    `.trim(),
    { preheader: `New inquiry from ${submission.name}` },
  )

  const text = [
    "New CodeTelemetryLab inquiry",
    "",
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Company: ${companyLine}`,
    `Project type: ${submission.projectType}`,
    `Budget: ${submission.budget}`,
    "",
    "Message:",
    submission.message,
  ].join("\n")

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: submission.email,
      subject: `New inquiry from ${submission.name}`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend request failed: ${response.status} ${errorText}`)
  }

  return {
    delivered: true,
    skipped: false,
  }
}

