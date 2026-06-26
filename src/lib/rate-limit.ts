const buckets = new Map<string, number[]>()

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return (
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  )
}

export function isRateLimited(key: string, limit = 5, windowMs = 1000 * 60 * 15) {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs)

  if (recent.length >= limit) {
    buckets.set(key, recent)
    return true
  }

  recent.push(now)
  buckets.set(key, recent)
  return false
}
