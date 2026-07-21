import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { AdminLoginForm } from "@/components/admin-login-form"
import { DesignMark } from "@/components/design-mark"
import { adminSurface, adminSurfaceSoft } from "@/lib/admin-ui"

export const metadata: Metadata = {
  title: "Admin login",
  description:
    "Secure sign-in for the CodeTelemetryLab admin dashboard, CMS controls, blog editing, and project management.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; email?: string; password?: string }>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={`${adminSurface} p-6 sm:p-8`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Protected admin access
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Sign in to manage blogs, projects, homepage content, and media.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The first phase uses a simple authenticated admin surface so content can be updated without editing code.
          </p>
          <div className={`${adminSurfaceSoft} mt-8 p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">What you can manage</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Homepage copy and structured content blocks</li>
              <li>Blog publishing, SEO metadata, and article body content</li>
              <li>Project case studies, screenshots, and media assets</li>
            </ul>
          </div>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
            Back to public site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className={`${adminSurface} p-6 sm:p-8`}>
          <div className="mb-6">
            <DesignMark />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">Admin sign-in</p>
          <AdminLoginForm
            error={resolvedSearchParams?.error}
            initialEmail={resolvedSearchParams?.email}
            initialPassword={resolvedSearchParams?.password}
          />
        </div>
      </div>
    </main>
  )
}
