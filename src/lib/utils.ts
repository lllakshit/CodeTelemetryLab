import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function requestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export function filenameFromUrl(value: string) {
  const cleaned = value.split("#")[0]?.split("?")[0] ?? value

  try {
    const url = new URL(cleaned, "http://local.test")
    const parts = url.pathname.split("/").filter(Boolean)
    return decodeURIComponent(parts.at(-1) || cleaned)
  } catch {
    const parts = cleaned.split("/").filter(Boolean)
    return parts.at(-1) || cleaned
  }
}
