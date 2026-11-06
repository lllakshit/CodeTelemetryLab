import { isIP } from "node:net"

/** Addresses a server-side link check must never contact: private, loopback, link-local and similar. */
export function isPrivateAddress(address: string) {
  const ip = address.replace(/^\[|\]$/g, "").toLowerCase()
  const version = isIP(ip)
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  if (version === 6) {
    if (ip === "::" || ip === "::1") return true
    if (ip.startsWith("::ffff:")) return isPrivateAddress(ip.slice(7))
    return /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith("ff")
  }
  return false
}

/** Host-name level checks. The caller must also resolve the name and test every address with isPrivateAddress. */
export function isPublicHttpsUrl(raw: string) {
  try {
    const url = new URL(raw)
    if (url.protocol !== "https:" || url.port || url.username || url.password) return false
    const host = url.hostname.toLowerCase().replace(/\.$/, "")
    if (!host.includes(".") || isIP(host.replace(/^\[|\]$/g, ""))) return false
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) return false
    return true
  } catch {
    return false
  }
}
