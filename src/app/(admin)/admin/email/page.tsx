import { SectionHeading } from "@/components/section-heading"
import { AdminEmailComposer } from "@/components/admin-email-composer"
import { adminSurface } from "@/lib/admin-ui"
import { listEmailLogs } from "@/lib/email-logs"
import { getOutboundEmailFrom } from "@/lib/outbound-email"

export default async function AdminEmailPage() {
  const [logs, fromAddress] = await Promise.all([listEmailLogs(40), Promise.resolve(getOutboundEmailFrom())])

  return (
    <div className="space-y-8">
      <div className={`${adminSurface} p-6`}>
        <SectionHeading
          eyebrow="Email"
          title="Send a personal outbound email."
          description="Private admin tool for founder-led outreach. Messages include the CodeTelemetryLab logo header automatically. Not connected to the public contact form or any marketing campaigns."
        />
      </div>

      <AdminEmailComposer initialLogs={logs} fromAddress={fromAddress} />
    </div>
  )
}
