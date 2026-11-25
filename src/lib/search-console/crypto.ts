import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

/**
 * AES-256-GCM for the stored Google refresh token. Key: SEARCH_CONSOLE_TOKEN_KEY, or (fallback) a key derived from
 * NEXTAUTH_SECRET so the feature still works if the dedicated key is not set. Changing the key means reconnecting.
 * Format: "v1.<iv b64url>.<tag b64url>.<ciphertext b64url>".
 */
function keyFrom(secret: string) {
  return createHash("sha256").update(`ctl-search-console:${secret}`).digest()
}

export function tokenKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const secret = env.SEARCH_CONSOLE_TOKEN_KEY?.trim() || env.NEXTAUTH_SECRET?.trim() || env.AUTH_SECRET?.trim()
  return secret ? keyFrom(secret) : null
}

export function encryptToken(plain: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".")
}

/** Returns null when the value was encrypted with another key or is damaged. */
export function decryptToken(value: string, key: Buffer): string | null {
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== "v1") return null
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1], "base64url"))
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"))
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

/** PKCE verifier + S256 challenge, and an unguessable state value for the OAuth round trip. */
export function pkcePair() {
  const verifier = randomBytes(32).toString("base64url")
  const challenge = createHash("sha256").update(verifier).digest("base64url")
  return { verifier, challenge, state: randomBytes(18).toString("base64url") }
}
