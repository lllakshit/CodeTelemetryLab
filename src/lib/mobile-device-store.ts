import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type MobileDeviceRecord = {
  id: string
  token: string
  platform: "android"
  packageName: string | null
  deviceName: string | null
  appVersion: string | null
  userEmail: string
  createdAt: string
  updatedAt: string
  lastSeenAt: string
}

type MobileDeviceStore = {
  devices: MobileDeviceRecord[]
}

const storePath = path.join(process.cwd(), "data", "mobile-device-store.json")

function emptyStore(): MobileDeviceStore {
  return { devices: [] }
}

async function ensureStoreDir() {
  await mkdir(path.dirname(storePath), { recursive: true })
}

async function readStore(): Promise<MobileDeviceStore> {
  try {
    const raw = await readFile(storePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<MobileDeviceStore>
    return {
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
    }
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: MobileDeviceStore) {
  await ensureStoreDir()
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8")
}

export async function registerMobileDeviceToken(input: {
  token: string
  platform: "android"
  packageName?: string | null
  deviceName?: string | null
  appVersion?: string | null
  userEmail: string
}) {
  const store = await readStore()
  const timestamp = new Date().toISOString()
  const normalizedToken = input.token.trim()

  const existing = store.devices.find((device) => device.token === normalizedToken)
  const device: MobileDeviceRecord = existing
    ? {
        ...existing,
        platform: input.platform,
        packageName: input.packageName ?? existing.packageName ?? null,
        deviceName: input.deviceName ?? existing.deviceName ?? null,
        appVersion: input.appVersion ?? existing.appVersion ?? null,
        userEmail: input.userEmail,
        updatedAt: timestamp,
        lastSeenAt: timestamp,
      }
    : {
        id: randomUUID(),
        token: normalizedToken,
        platform: input.platform,
        packageName: input.packageName ?? null,
        deviceName: input.deviceName ?? null,
        appVersion: input.appVersion ?? null,
        userEmail: input.userEmail,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastSeenAt: timestamp,
      }

  const devices = existing
    ? store.devices.map((entry) => (entry.token === normalizedToken ? device : entry))
    : [device, ...store.devices]

  await writeStore({ devices })
  return device
}

export async function listMobileDeviceTokens() {
  const store = await readStore()
  return store.devices
}

export async function removeMobileDeviceToken(token: string) {
  const store = await readStore()
  const normalizedToken = token.trim()
  const next = store.devices.filter((device) => device.token !== normalizedToken)

  if (next.length === store.devices.length) {
    return false
  }

  await writeStore({ devices: next })
  return true
}
