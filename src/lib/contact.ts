export const CONTACT_DISPLAY_EMAIL = "contact@codetelemetrylab.me"

export function getContactNotificationTo() {
  return process.env.CONTACT_NOTIFICATION_TO?.trim() || CONTACT_DISPLAY_EMAIL
}

export function getContactNotificationFrom() {
  return (
    process.env.CONTACT_NOTIFICATION_FROM?.trim() ||
    `CodeTelemetryLab <${CONTACT_DISPLAY_EMAIL}>`
  )
}
