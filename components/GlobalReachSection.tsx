const regions = [
  { name: "Mongolia", role: "Headquarters & delivery team", stat: "50+ specialists" },
  { name: "Japan", role: "Core digital marketing market", stat: "Performance campaigns" },
  { name: "Global", role: "Dentsu Group client network", stat: "Group companies worldwide" },
];

export default function GlobalReachSection() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="card-line relative overflow-hidden p-8">
        <svg viewBox="0 0 400 220" className="w-full text-line-strong" fill="none">
          <g stroke="currentColor" strokeWidth="1">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="220" opacity="0.4" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 44} x2="400" y2={i * 44} opacity="0.4" />
            ))}
          </g>
          <rect x="286" y="66" width="8" height="8" className="fill-paper" />
          <rect x="86" y="106" width="8" height="8" className="fill-paper" />
          <path
            d="M90 110 C 160 60, 220 60, 290 70"
            className="stroke-paper"
            strokeWidth="1"
            strokeDasharray="4 4"
            fill="none"
          />
          <text x="90" y="132" textAnchor="middle" className="fill-mist font-mono text-[10px] uppercase tracking-widest">
            Mongolia
          </text>
          <text x="290" y="52" textAnchor="middle" className="fill-mist font-mono text-[10px] uppercase tracking-widest">
            Japan
          </text>
        </svg>
        <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-[0.05em] text-fog">
          Illustrative map — DDAM&apos;s Ulaanbaatar team delivers projects for Dentsu group companies and clients across the Japanese market and beyond.
        </p>
      </div>

      <div className="space-y-6">
        {regions.map((region, i) => (
          <div key={region.name} className="flex items-start gap-4 border-b border-line pb-6 last:border-0 last:pb-0">
            <span className="mt-1 font-mono text-xs tracking-[0.2em] text-fog">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="text-base font-black uppercase tracking-wide text-paper">{region.name}</div>
              <div className="mt-1 text-sm text-mist">{region.role}</div>
              <div className="eyebrow mt-1 text-fog">{region.stat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
