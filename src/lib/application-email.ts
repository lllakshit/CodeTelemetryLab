import { getContactNotificationFrom, getContactNotificationTo } from "@/lib/contact"
import { escapeEmailHtml, wrapBrandedEmailHtml } from "@/lib/email-branding"
import type { JobApplication } from "@/lib/applications"
import { absoluteUrl } from "@/lib/seo"

/** Best-effort email to the team inbox. The application is already saved, so a failure here is only logged. */
export async function sendApplicationNotification(application: JobApplication) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = getContactNotificationFrom()
  const to = getContactNotificationTo()

  if (!apiKey || !from || !to) return { delivered: false, skipped: true }

  const adminUrl = absoluteUrl(`/admin/applications/${application.id}`)
  const rows: Array<[string, string | null]> = [
    ["Role", application.jobTitle],
    ["Name", application.fullName],
    ["Email", application.email],
    ["Phone", application.phone],
    ["Location", application.location],
    ["Current company", application.currentCompany],
    ["Experience", application.yearsExperience],
    ["Notice period", application.noticePeriod],
    ["LinkedIn", application.linkedinUrl],
    ["Portfolio", application.portfolioUrl],
  ]

  const html = wrapBrandedEmailHtml(
    `
      <h1 style="font-size: 20px; margin: 0 0 16px; font-weight: 600;">New job application</h1>
      ${rows
        .filter(([, value]) => value)
        .map(
          ([label, value]) =>
            `<p style="margin: 0 0 8px;"><strong>${escapeEmailHtml(label)}:</strong> ${escapeEmailHtml(value ?? "")}</p>`,
        )
        .join("")}
      <p style="margin: 20px 0 0;"><a href="${escapeEmailHtml(adminUrl)}">Open in the admin Applications section</a></p>
    `.trim(),
    { preheader: `${application.fullName} applied for ${application.jobTitle}` },
  )

  const text = [
    "New job application",
    "",
    ...rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    "",
    `Admin: ${adminUrl}`,
  ].join("\n")

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: application.email,
      subject: `Application: ${application.jobTitle} — ${application.fullName}`,
      html,
      text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend request failed: ${response.status} ${await response.text()}`)
  }

  return { delivered: true, skipped: false }
}
