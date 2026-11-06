/** Maps Resend's `last_event` onto the statuses the admin screens show. */

export type DeliveryStatus =
  | "queued"
  | "scheduled"
  | "sent"
  | "delayed"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "canceled"
  | "failed"

const KNOWN: Record<string, DeliveryStatus> = {
  queued: "queued",
  scheduled: "scheduled",
  sent: "sent",
  delivery_delayed: "delayed",
  delivered: "delivered",
  opened: "opened",
  clicked: "clicked",
  bounced: "bounced",
  complained: "complained",
  canceled: "canceled",
  failed: "failed",
  suppressed: "bounced",
}

export function normalizeResendEvent(event: unknown): DeliveryStatus | null {
  if (typeof event !== "string") return null
  return KNOWN[event.trim().toLowerCase()] ?? null
}

/** Once a message is in one of these states there is nothing more to learn from polling. */
export function isFinalStatus(status: string) {
  return ["delivered", "opened", "clicked", "bounced", "complained", "canceled", "failed"].includes(status)
}

export type StatusTone = "good" | "pending" | "bad"

export function describeStatus(status: string): { label: string; tone: StatusTone; hint: string } {
  switch (status) {
    case "delivered":
      return { label: "Delivered", tone: "good", hint: "Accepted by the recipient's mail server." }
    case "opened":
      return { label: "Opened", tone: "good", hint: "Delivered and opened." }
    case "clicked":
      return { label: "Clicked", tone: "good", hint: "Delivered and a link was clicked." }
    case "sent":
      return { label: "Sent", tone: "pending", hint: "Handed to the mail network. Delivery not confirmed yet." }
    case "queued":
    case "scheduled":
      return { label: "Queued", tone: "pending", hint: "Waiting to be sent." }
    case "delayed":
      return { label: "Delayed", tone: "pending", hint: "The recipient's server is slow. It will retry." }
    case "bounced":
      return { label: "Bounced", tone: "bad", hint: "The address does not exist or the server refused it." }
    case "complained":
      return { label: "Marked as spam", tone: "bad", hint: "The recipient reported the message as spam." }
    case "canceled":
      return { label: "Canceled", tone: "bad", hint: "The send was canceled." }
    default:
      return { label: "Failed", tone: "bad", hint: "The message could not be sent." }
  }
}
