import { createSign } from "node:crypto"
import type { Lead } from "@/lib/store"
import { listMobileDeviceTokens, removeMobileDeviceToken } from "@/lib/mobile-device-store"

type FirebaseServerConfig = {
  clientEmail: string
  privateKey: string
  projectId: string
}

type AccessTokenCache = {
  accessToken: string
  expiresAt: number
}

let accessTokenCache: AccessTokenCache | null = null

function getFirebaseServerConfig(): FirebaseServerConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim()

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  }
}

function createServiceAccountJwt(config: FirebaseServerConfig) {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: "RS256",
    typ: "JWT",
  }
  const payload = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const signer = createSign("RSA-SHA256")
  signer.update(unsignedToken)
  signer.end()

  const signature = signer.sign(config.privateKey, "base64url")
  return `${unsignedToken}.${signature}`
}

async function getFirebaseAccessToken(config: FirebaseServerConfig) {
  if (accessTokenCache && Date.now() < accessTokenCache.expiresAt - 60_000) {
    return accessTokenCache.accessToken
  }

  const assertion = createServiceAccountJwt(config)
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to exchange Firebase access token: ${response.status} ${body}`)
  }

  const payload = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  accessTokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  }

  return payload.access_token
}

function notificationBodyForLead(lead: Lead) {
  const secondary = lead.companyName?.trim() || lead.email
  return `${lead.serviceInterestedIn} • ${secondary}`
}

async function sendLeadNotification(
  config: FirebaseServerConfig,
  accessToken: string,
  targetToken: string,
  lead: Lead,
) {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: targetToken,
          notification: {
            title: `New lead: ${lead.fullName}`,
            body: notificationBodyForLead(lead),
          },
          data: {
            leadId: lead.id,
            fullName: lead.fullName,
            serviceInterestedIn: lead.serviceInterestedIn,
            createdAt: lead.createdAt,
            status: lead.status,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "new_leads",
            },
          },
        },
      }),
    },
  )

  if (response.ok) {
    return
  }

  const text = await response.text()

  if (response.status === 404 || text.includes("UNREGISTERED") || text.includes("registration-token-not-registered")) {
    await removeMobileDeviceToken(targetToken)
    return
  }

  throw new Error(`Failed to send Firebase notification: ${response.status} ${text}`)
}

export async function notifyLeadCreated(lead: Lead) {
  const config = getFirebaseServerConfig()
  if (!config) {
    return
  }

  try {
    const devices = await listMobileDeviceTokens()
    if (!devices.length) {
      return
    }

    const accessToken = await getFirebaseAccessToken(config)
    await Promise.allSettled(
      devices.map((device) => sendLeadNotification(config, accessToken, device.token, lead)),
    )
  } catch (error) {
    console.error("Mobile lead notification failed", error)
  }
}
