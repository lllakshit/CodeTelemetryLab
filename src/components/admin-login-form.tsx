"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

async function submitCredentials({
  email,
  password,
}: {
  email: string
  password: string
}) {
  return signIn("credentials", {
    email,
    password,
    redirect: false,
    redirectTo: "/admin/dashboard",
  })
}

export function AdminLoginForm({
  error,
  initialEmail,
  initialPassword,
}: {
  error?: string
  initialEmail?: string
  initialPassword?: string
}) {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(
    error ? "Invalid credentials. Check the admin email and password." : null,
  )
  const router = useRouter()
  const attemptedAutoLogin = useRef(false)

  useEffect(() => {
    const canAutoLogin =
      Boolean(initialEmail && initialPassword) &&
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      process.env.NODE_ENV !== "production"

    if (!canAutoLogin || attemptedAutoLogin.current) return

    attemptedAutoLogin.current = true
    setLoading(true)
    setLocalError(null)

    void submitCredentials({
      email: initialEmail ?? "",
      password: initialPassword ?? "",
    }).then((result) => {
      if (result?.error) {
        setLocalError("Invalid credentials. Check the admin email and password.")
        setLoading(false)
        return
      }

      const nextUrl = new URL(result?.url || "/admin/dashboard", window.location.origin)
      router.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
      router.refresh()
    })
  }, [initialEmail, initialPassword, router])

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        setLocalError(null)

        const formData = new FormData(event.currentTarget)
        const email = String(formData.get("email") || "")
        const password = String(formData.get("password") || "")

        const result = await submitCredentials({ email, password })

        if (result?.error) {
          setLocalError("Invalid credentials. Check the admin email and password.")
          setLoading(false)
          return
        }

        const nextUrl = new URL(result?.url || "/admin/dashboard", window.location.origin)
        router.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
        router.refresh()
      }}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Admin email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initialEmail ?? ""}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
          placeholder="admin@codetelemetrylabs.com"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue={initialPassword ?? ""}
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
          placeholder="Admin password"
        />
      </label>
      {initialEmail || initialPassword ? (
        <p className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          Local dev shortcut detected. Credentials from the URL have been prefilled.
        </p>
      ) : null}
      {localError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {localError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
