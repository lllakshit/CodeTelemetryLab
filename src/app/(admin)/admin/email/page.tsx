import { SectionHeading } from "@/components/section-heading"
import { AdminEmailComposer, type ComposerPrefill } from "@/components/admin-email-composer"
import { adminSurface } from "@/lib/admin-ui"
import { listEmailLogs } from "@/lib/email-logs"
import { getProspect } from "@/lib/lead-discovery/store"
import { getOutboundEmailFrom } from "@/lib/outbound-email"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/**
 * Pre-fill from a discovered prospect (?prospectId=...) or from plain ?to=&subject=&body= parameters. Everything stays
 * editable and nothing is sent until Send is pressed.
 */
async function loadPrefill(params: Record<string, string | string[] | undefined>): Promise<ComposerPrefill | null> {
  const prospectId = first(params.prospectId) ?? first(params.leadId)
  if (prospectId) {
    const prospect = UUID.test(prospectId)
      ? await getProspect(prospectId).catch((error) => {
          console.error("Email: could not load prospect", error)
          return null
        })
      : null
    if (prospect) {
      return {
        to: prospect.contactEmail ? [prospect.contactEmail] : [],
        subject: prospect.draftSubject,
        body: prospect.draftBody,
        prospect: { id: prospect.id, company: prospect.company, status: prospect.status, contactRoute: prospect.contactRoute },
      }
    }
    return { to: [], subject: "", body: "", missingProspect: true }
  }
  const to = (first(params.to) ?? "")
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => EMAIL.test(value))
    .slice(0, 20)
  const subject = (first(params.subject) ?? "").slice(0, 300)
  const body = (first(params.body) ?? "").slice(0, 20000)
  return to.length || subject || body ? { to, subject, body } : null
}

export default async function AdminEmailPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {}
  const [logs, fromAddress, prefill] = await Promise.all([listEmailLogs(40), Promise.resolve(getOutboundEmailFrom()), loadPrefill(params)])

  return (
    <div className="space-y-8">
      <div className={`${adminSurface} p-6`}>
        <SectionHeading
          eyebrow="Email"
          title="Send a personal outbound email."
          description="Private admin tool for founder-led outreach. Messages include a light logo and site links in the footer. Not connected to the public contact form or any marketing campaigns."
        />
      </div>

      <AdminEmailComposer key={prefill?.prospect?.id ?? "compose"} initialLogs={logs} fromAddress={fromAddress} prefill={prefill} />
    </div>
  )
}
