import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

const DEFAULT_ADMIN_EMAIL = "admin@codetelemetrylabs.com"
const DEFAULT_ADMIN_PASSWORD = "admin1234"
const DEV_PLACEHOLDER_PASSWORDS = new Set(["change-this-password"])
const DEV_TOKEN_SECRET = "codetelemetrylabs-mobile-dev-secret"
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

export type MobileSession = {
  email: string
  exp: number
  iat: number
  role: "admin"
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim()
}

function resolveAdminEmail() {
  return firstNonEmpty(process.env.ADMIN_EMAIL) ?? DEFAULT_ADMIN_EMAIL
}

function resolveAdminPassword() {
  const configuredPassword = firstNonEmpty(process.env.ADMIN_PASSWORD)

  if (!configuredPassword) {
    return DEFAULT_ADMIN_PASSWORD
  }

  if (process.env.NODE_ENV !== "production" && DEV_PLACEHOLDER_PASSWORDS.has(configuredPassword)) {
    return DEFAULT_ADMIN_PASSWORD
  }

  return configuredPassword
}

function getMobileTokenSecret() {
  return (
    firstNonEmpty(process.env.MOBILE_TOKEN_SECRET, process.env.NEXTAUTH_SECRET) ??
    (process.env.NODE_ENV === "production" ? undefined : DEV_TOKEN_SECRET)
  )
}

function signPayload(payloadBase64: string) {
  const secret = getMobileTokenSecret()
  if (!secret) {
    throw new Error("Mobile token secret is not configured.")
  }

  return createHmac("sha256", secret).update(payloadBase64).digest("base64url")
}

export function isValidMobileAdminCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === resolveAdminEmail().toLowerCase() &&
    password === resolveAdminPassword()
  )
}

export function issueMobileToken(email: string) {
  const now = Math.floor(Date.now() / 1000)
  const session: MobileSession = {
    email: email.trim().toLowerCase(),
    exp: now + TOKEN_TTL_SECONDS,
    iat: now,
    role: "admin",
  }

  const payloadBase64 = Buffer.from(JSON.stringify(session)).toString("base64url")
  const signature = signPayload(payloadBase64)
  return `${payloadBase64}.${signature}`
}

export function verifyMobileToken(token: string): MobileSession | null {
  const [payloadBase64, signature] = token.split(".")
  if (!payloadBase64 || !signature) {
    return null
  }

  const expectedSignature = signPayload(payloadBase64)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const session = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as MobileSession
    if (!session.email || !session.exp || session.role !== "admin") {
      return null
    }

    if (session.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return session
  } catch {
    return null
  }
}

function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? ""
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null
  }

  return token.trim()
}

export function getMobileSessionFromRequest(request: Request) {
  const token = extractBearerToken(request)
  return token ? verifyMobileToken(token) : null
}

export function unauthorizedMobileResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}
