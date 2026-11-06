import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto"

/**
 * Encrypts API keys before they are stored in the database.
 * The AES key is derived from a server secret (NEXTAUTH_SECRET), so the database alone never reveals a key.
 * Format: v1:<iv>:<auth tag>:<ciphertext>, each part base64.
 */
const INFO = "codetelemetry-outreach-api-key-v1"

function deriveKey(secret: string) {
  if (!secret || secret.length < 16) throw new Error("The server secret used to protect API keys is missing or too short.")
  return Buffer.from(hkdfSync("sha256", secret, "outreach", INFO, 32))
}

export function encryptSecret(plain: string, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptSecret(token: string, secret: string) {
  const [version, iv, tag, data] = token.split(":")
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unsupported encrypted value.")
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
}

export function lastFour(value: string) {
  const trimmed = value.trim()
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4)
}
