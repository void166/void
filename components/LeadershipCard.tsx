import type { Leader } from "@/lib/data/leadership";

function initials(name: string) {
  if (name === "TBD") return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LeadershipCard({ leader }: { leader: Leader }) {
  return (
    <div className="card-line p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-line-strong font-mono text-base font-bold tracking-widest text-paper">
          {initials(leader.name)}
        </span>
        <div>
          <div className="text-base font-black uppercase tracking-wide text-paper">{leader.name}</div>
          <div className="mt-0.5 font-mono text-xs tracking-[0.08em] text-mist">{leader.title}</div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-mist">{leader.bio}</p>
      <details className="group mt-4">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-mist hover:text-paper">
          View full biography
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-mist">{leader.cv}</p>
      </details>
    </div>
  );
}
