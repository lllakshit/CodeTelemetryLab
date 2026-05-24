import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { getHomeContent } from "@/lib/cms"

const deliverables = [
  "Discovery and scope framing",
  "Information architecture",
  "Responsive implementation",
  "Database and API setup",
  "Admin-ready content model",
  "Launch support and handoff",
]

export default async function ServicesPage() {
  const home = await getHomeContent()

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Service packages that feel like engineering work, not a generic agency menu."
        description="The scope is intentionally practical: build the product surface, make the content editable, and leave room for expansion."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {home.services.map((service) => (
          <article key={service.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-blue-300">{service.notes}</p>
            <h3 className="mt-4 text-xl font-semibold text-white">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{service.description}</p>
            <ul className="mt-5 space-y-3">
              {deliverables.slice(0, 3).map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Delivery scope</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">What the first phase includes</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {deliverables.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.14),rgba(15,23,42,0.2))] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-100">Engagement rhythm</p>
          <p className="mt-3 text-xl font-semibold text-white">Short cycles, clear checkpoints</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The work is organized so you always know what is being built, what is under review, and what is next.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Start a conversation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
