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
    <div className="rounded-2xl border border-line bg-ink-2 p-6 transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-lg font-bold text-white">
          {initials(leader.name)}
        </span>
        <div>
          <div className="text-base font-semibold text-paper">{leader.name}</div>
          <div className="text-sm text-mist">{leader.title}</div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-mist">{leader.bio}</p>
      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs font-medium text-brand-300 hover:text-brand-200">
          View full biography
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-mist">{leader.cv}</p>
      </details>
    </div>
  );
}
