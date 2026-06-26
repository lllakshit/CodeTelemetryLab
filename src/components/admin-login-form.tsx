"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { adminAccentButton, adminInputClassName } from "@/lib/admin-ui"

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
        <span className="font-medium text-slate-700">Admin email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initialEmail ?? ""}
          className={adminInputClassName()}
          placeholder="admin@codetelemetrylabs.com"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue={initialPassword ?? ""}
          className={adminInputClassName()}
          placeholder="Admin password"
        />
      </label>
      {initialEmail || initialPassword ? (
        <p className="rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Local dev shortcut detected. Credentials from the URL have been prefilled.
        </p>
      ) : null}
      {localError ? (
        <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {localError}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className={`${adminAccentButton} w-full disabled:cursor-not-allowed disabled:opacity-70`}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
