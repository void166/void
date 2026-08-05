const regions = [
  { name: "Mongolia", role: "Headquarters & delivery team", stat: "50+ specialists" },
  { name: "Japan", role: "Core digital marketing market", stat: "Performance campaigns" },
  { name: "Global", role: "Dentsu Group client network", stat: "Group companies worldwide" },
];

export default function GlobalReachSection() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-2 p-8">
        <svg viewBox="0 0 400 220" className="w-full text-line-strong" fill="none">
          <g stroke="currentColor" strokeWidth="1">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="220" opacity="0.4" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 44} x2="400" y2={i * 44} opacity="0.4" />
            ))}
          </g>
          <circle cx="290" cy="70" r="5" className="fill-brand-400" />
          <circle cx="90" cy="110" r="5" className="fill-brand-400" />
          <path
            d="M90 110 C 160 60, 220 60, 290 70"
            className="stroke-brand-400"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />
          <text x="90" y="132" textAnchor="middle" className="fill-paper text-[11px]">
            Mongolia
          </text>
          <text x="290" y="52" textAnchor="middle" className="fill-paper text-[11px]">
            Japan
          </text>
        </svg>
        <p className="mt-4 text-xs text-fog">
          Illustrative map — DDAM&apos;s Ulaanbaatar team delivers projects for Dentsu group companies and clients across the Japanese market and beyond.
        </p>
      </div>

      <div className="space-y-6">
        {regions.map((region) => (
          <div key={region.name} className="flex items-start gap-4 border-b border-line pb-6 last:border-0 last:pb-0">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
            <div>
              <div className="text-base font-semibold text-paper">{region.name}</div>
              <div className="mt-1 text-sm text-mist">{region.role}</div>
              <div className="eyebrow mt-1 text-fog">{region.stat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
