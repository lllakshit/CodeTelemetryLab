type DiagramProps = {
  className?: string
}

export function ProcessFlowDiagram({ className }: DiagramProps) {
  return (
    <svg
      viewBox="0 0 720 220"
      className={className}
      role="img"
      aria-label="Delivery process from discovery through maintenance"
    >
      <rect width="720" height="220" rx="24" fill="#F8FBFF" />
      {[
        { x: 24, label: "Discover", sub: "Scope & constraints" },
        { x: 156, label: "Architect", sub: "Boundaries & data" },
        { x: 288, label: "Build", sub: "Vertical slices" },
        { x: 420, label: "Harden", sub: "Test & review" },
        { x: 552, label: "Operate", sub: "Monitor & iterate" },
      ].map((step, index) => (
        <g key={step.label}>
          <rect x={step.x} y="58" width="120" height="104" rx="18" fill="#FFFFFF" stroke="#D7E3F4" />
          <text x={step.x + 60} y="98" textAnchor="middle" fill="#0064E0" fontSize="12" fontWeight="700">
            {String(index + 1).padStart(2, "0")}
          </text>
          <text x={step.x + 60} y="124" textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="600">
            {step.label}
          </text>
          <text x={step.x + 60} y="146" textAnchor="middle" fill="#64748B" fontSize="11">
            {step.sub}
          </text>
          {index < 4 ? (
            <path
              d={`M${step.x + 124} 110 H${step.x + 152}`}
              stroke="#93C5FD"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          ) : null}
        </g>
      ))}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#93C5FD" />
        </marker>
      </defs>
    </svg>
  )
}

export function SystemLayersDiagram({ className }: DiagramProps) {
  return (
    <svg
      viewBox="0 0 720 260"
      className={className}
      role="img"
      aria-label="System layers from interface to data and integrations"
    >
      <rect width="720" height="260" rx="24" fill="#F8FBFF" />
      {[
        { y: 28, label: "Interfaces", detail: "Web apps, portals, admin consoles" },
        { y: 84, label: "Application services", detail: "Auth, domain rules, validation, jobs" },
        { y: 140, label: "Data & events", detail: "Postgres, object storage, audit logs" },
        { y: 196, label: "Integrations", detail: "CRM, email, payments, model APIs" },
      ].map((layer) => (
        <g key={layer.label}>
          <rect x="40" y={layer.y} width="640" height="48" rx="14" fill="#FFFFFF" stroke="#D7E3F4" />
          <text x="64" y={layer.y + 22} fill="#0F172A" fontSize="14" fontWeight="600">
            {layer.label}
          </text>
          <text x="64" y={layer.y + 40} fill="#64748B" fontSize="12">
            {layer.detail}
          </text>
        </g>
      ))}
    </svg>
  )
}
