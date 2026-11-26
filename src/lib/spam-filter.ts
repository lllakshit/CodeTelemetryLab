/**
 * Blocks known spam on the public lead forms. Pure: safe to unit test.
 *
 * The "Free AI API" bot (17 leads, 22-26 Nov 2026) used a new domain and a new IP for every send, so blocking one
 * address or IP stops nothing. It is matched on what never changes: the "Free AI API" name/message, a link to a
 * "prompt" file meant for AI tools that read the inbox, and its fixed phone number.
 *
 * Extra addresses or whole domains can be blocked without a deploy of code: set LEAD_BLOCKLIST in Vercel to a
 * comma-separated list such as "spam@x.com, badsite.com" and redeploy.
 */

const BLOCKED_EMAILS = new Set(["api@apifreeclaudekey.com"])
const BLOCKED_PHONES = new Set(["15676623223"])

/** Messages that are "free AI API" offers or carry a prompt file for AI readers (prompt-injection). */
const SPAM_TEXT = [/\bfree\s+ai\s+api\b/i, /https?:\/\/[^\s]+\/prompt(?:\.txt)?(?:[\s?#]|$)/i]

export type SpamCheckInput = { fullName?: string | null; email?: string | null; phone?: string | null; subject?: string | null; message?: string | null }

function blocklist(env: Record<string, string | undefined>) {
  return (env.LEAD_BLOCKLIST ?? "")
    .split(/[,\s]+/)
    .map((entry) => entry.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean)
}

/** Returns why a submission is spam, or null when it is fine. */
export function spamReason(input: SpamCheckInput, env: Record<string, string | undefined> = process.env): string | null {
  const email = (input.email ?? "").trim().toLowerCase()
  const domain = email.split("@")[1] ?? ""
  if (BLOCKED_EMAILS.has(email)) return "blocked email"
  for (const entry of blocklist(env)) {
    if (entry.includes("@") ? email === entry : domain === entry || domain.endsWith(`.${entry}`)) return "blocked by LEAD_BLOCKLIST"
  }
  const phone = (input.phone ?? "").replace(/\D/g, "")
  if (phone && BLOCKED_PHONES.has(phone)) return "blocked phone"
  const text = [input.fullName, input.subject, input.message].filter(Boolean).join("\n")
  if (SPAM_TEXT.some((pattern) => pattern.test(text))) return "spam text"
  return null
}
