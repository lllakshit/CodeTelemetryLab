import { getContactNotificationFrom, getContactNotificationTo } from "@/lib/contact"

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

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0a1317; line-height: 1.6;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">New CodeTelemetryLab inquiry</h1>
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
      <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
      <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(companyLine)}</p>
      <p style="margin: 0 0 8px;"><strong>Project type:</strong> ${escapeHtml(submission.projectType)}</p>
      <p style="margin: 0 0 8px;"><strong>Budget:</strong> ${escapeHtml(submission.budget)}</p>
      <div style="margin-top: 20px; padding: 16px; border: 1px solid #dee3e9; border-radius: 16px; background: #f8fafc;">
        <p style="margin: 0 0 8px; font-weight: 700;">Message</p>
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(submission.message)}</p>
      </div>
    </div>
  `.trim()

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
