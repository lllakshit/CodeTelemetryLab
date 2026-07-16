import { NextResponse } from "next/server"
import { createSupabaseAdminClient, getSupabaseConfig } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getErrorDetail(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) }
  }

  const maybeError = error as { code?: string; message?: string; name?: string }
  return {
    code: maybeError.code ?? null,
    message: maybeError.message || maybeError.name || "Unknown Supabase keepalive error",
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured." },
      { status: 500 },
    )
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const config = getSupabaseConfig()
  if (!config.url || !config.secretKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase URL or service role key is not configured." },
      { status: 500 },
    )
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { count, error } = await supabase
      .from("homepage_content")
      .select("key", { count: "exact", head: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      count: count ?? 0,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getErrorDetail(error) },
      { status: 502 },
    )
  }
}
