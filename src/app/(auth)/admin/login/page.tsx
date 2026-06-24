import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { AdminLoginForm } from "@/components/admin-login-form"

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; email?: string; password?: string }
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Protected admin access
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
            Sign in to manage blogs, projects, homepage content, and media.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            The first phase uses a simple authenticated admin surface so content can be updated without editing code.
          </p>
          <Link href="/" className="mt-8 inline-flex text-sm font-medium text-blue-300">
            Back to public site
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Admin sign-in</p>
          <AdminLoginForm
            error={searchParams?.error}
            initialEmail={searchParams?.email}
            initialPassword={searchParams?.password}
          />
        </div>
      </div>
    </main>
  )
}
