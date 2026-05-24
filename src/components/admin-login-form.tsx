"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export function AdminLoginForm({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const email = String(formData.get("email") || "")
        const password = String(formData.get("password") || "")

        await signIn("credentials", {
          email,
          password,
          callbackUrl: "/admin/dashboard",
        })
        setLoading(false)
      }}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Admin email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
          placeholder="admin@codetelemetrylabs.com"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Password</span>
        <input
          name="password"
          type="password"
          required
          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
          placeholder="Admin password"
        />
      </label>
      {error ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Invalid credentials. Check the admin email and password.
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
