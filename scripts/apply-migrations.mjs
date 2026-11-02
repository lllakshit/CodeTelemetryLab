import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

/**
 * Applies new SQL files from supabase/migrations to the Supabase project through the Management API.
 *
 * - Files with a timestamp prefix <= BASELINE were applied by hand before this runner existed and are skipped.
 * - Applied files are recorded in public.ctl_migrations, so each file runs once.
 * - Migrations must be idempotent and additive (create ... if not exists), because there is no down step.
 * - Without SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF the script exits 0 and does nothing.
 */
const BASELINE = "20261101999999"
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
const ref = process.env.SUPABASE_PROJECT_REF?.trim()

if (!token || !ref) {
  console.log("SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF not set: skipping database migrations.")
  process.exit(0)
}

async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`Supabase query failed (${response.status}): ${body.slice(0, 500)}`)
  return body ? JSON.parse(body) : []
}

const dir = path.join(process.cwd(), "supabase", "migrations")
const files = (await readdir(dir))
  .filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .filter((name) => name.slice(0, 14) > BASELINE)
  .sort()

await query("create table if not exists public.ctl_migrations (name text primary key, applied_at timestamptz not null default now())")
const applied = new Set((await query("select name from public.ctl_migrations")).map((row) => row.name))

let ran = 0
for (const name of files) {
  if (applied.has(name)) continue
  console.log(`Applying ${name}…`)
  const sql = await readFile(path.join(dir, name), "utf8")
  await query(sql)
  await query(`insert into public.ctl_migrations (name) values ('${name.replace(/'/g, "''")}') on conflict do nothing`)
  ran += 1
}

console.log(ran ? `Applied ${ran} migration(s).` : "No new migrations to apply.")
