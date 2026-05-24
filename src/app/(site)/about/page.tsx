import { SectionHeading } from "@/components/section-heading"

const values = [
  {
    title: "Mission",
    text: "Build software that is reliable enough for production and readable enough for handoff.",
  },
  {
    title: "Engineering philosophy",
    text: "Reduce the problem to a stable release path, then expand the system only after the foundation is trustworthy.",
  },
  {
    title: "Quality standard",
    text: "Clear typography, disciplined spacing, predictable data flow, and admin surfaces that match the public site quality.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="About"
        title="A human-built agency profile with enough substance to feel believable."
        description="The company story is intentionally restrained. It focuses on engineering discipline, delivery clarity, and the type of partnership the site is trying to attract."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {values.map((item) => (
          <article key={item.title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Workflow</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">How we work</h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              The project begins with a scoped brief, content inventory, and delivery assumptions that match the
              real release target.
            </p>
            <p>
              After that, the build moves in small checkpoints so the public site and admin system stay aligned while
              the content model matures.
            </p>
            <p>
              The handoff includes documentation, environment notes, and a clear path for later phases such as
              client portals or automation systems.
            </p>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(15,23,42,0.22))] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-100">Working style</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-200">
            <li>Remote-friendly for USA and Canada clients</li>
            <li>Practical handoff documentation</li>
            <li>Transparent delivery checkpoints</li>
            <li>Production-ready architecture from day one</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
