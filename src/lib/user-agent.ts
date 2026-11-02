export type ParsedUserAgent = {
  deviceType: "desktop" | "mobile" | "tablet"
  browser: string
  os: string
  isBot: boolean
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|preview|monitor|uptime|curl|wget|python-requests|axios|go-http|node-fetch|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i

/** Small, dependency-free classifier: good enough for an internal journey report. */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = userAgent ?? ""
  const isBot = !ua || BOT_PATTERN.test(ua)

  const deviceType: ParsedUserAgent["deviceType"] = /ipad|tablet|kindle|silk/i.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)
      ? "mobile"
      : /android/i.test(ua)
        ? "tablet"
        : "desktop"

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /firefox|fxios/i.test(ua)
        ? "Firefox"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /safari/i.test(ua)
            ? "Safari"
            : "Other"

  const os = /windows/i.test(ua)
    ? "Windows"
    : /android/i.test(ua)
      ? "Android"
      : /iphone|ipad|ipod|ios/i.test(ua)
        ? "iOS"
        : /mac os|macintosh/i.test(ua)
          ? "macOS"
          : /linux|cros/i.test(ua)
            ? "Linux"
            : "Other"

  return { deviceType, browser, os, isBot }
}
