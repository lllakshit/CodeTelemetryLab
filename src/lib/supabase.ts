import { createClient } from "@supabase/supabase-js"

function firstDefined(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0)?.trim()
}

export function getSupabaseConfig() {
  const url = firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.API_URL,
  )
  const publishableKey = firstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.my_publishable_key,
  )
  const secretKey = firstDefined(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.my_secret_key,
  )

  return {
    url,
    publishableKey,
    secretKey,
    isConfigured: Boolean(url && secretKey),
  }
}

export function createSupabaseAdminClient() {
  const config = getSupabaseConfig()

  if (!config.url || !config.secretKey) {
    throw new Error("Missing Supabase server credentials.")
  }

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export function createSupabasePublicClient() {
  const config = getSupabaseConfig()

  if (!config.url || !config.publishableKey) {
    throw new Error("Missing Supabase public credentials.")
  }

  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export const SUPABASE_MEDIA_BUCKET = "media-assets"
