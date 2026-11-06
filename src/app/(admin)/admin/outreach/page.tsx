import { AdminOutreachWorkspace } from "@/components/admin-outreach-workspace"
import { SectionHeading } from "@/components/section-heading"
import { EMAIL_FOOTER_LOGO_URL } from "@/lib/email-branding"
import { adminSurface } from "@/lib/admin-ui"
import { listAccounts, listMessages } from "@/lib/outreach/store"
import { BRAND_NAME, SITE_URL } from "@/lib/seo"
import { getSupabaseConfig } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function AdminOutreachPage() {
  const [accounts, messages] = await Promise.all([
    listAccounts().then(
      (value) => ({ value, failed: false }),
      (error) => {
        console.error("Outreach: could not load accounts", error)
        return { value: [] as Awaited<ReturnType<typeof listAccounts>>, failed: true }
      },
    ),
    listMessages(40).catch(() => []),
  ])
  const setupError = accounts.failed
    ? "The Outreach tables are not available yet. Apply the latest database migration, then reload."
    : null
  const config = getSupabaseConfig()

  return (
    <div className="space-y-8">
      <div className={`${adminSurface} p-6`}>
        <SectionHeading
          eyebrow="Outreach"
          title="Personal outreach emails."
          description="Write a personal email that goes out under your own name from your own address. It has its own Resend account, separate from the contact@ setup used by the Email page, and shows delivery status here."
        />
      </div>
      <AdminOutreachWorkspace
        initialAccounts={accounts.value}
        initialMessages={messages}
        brand={{ name: BRAND_NAME, siteUrl: SITE_URL, logoUrl: EMAIL_FOOTER_LOGO_URL }}
        storage={{ url: config.url, publishableKey: config.publishableKey }}
        setupError={setupError}
      />
    </div>
  )
}
