import { timeline } from "@/lib/data/timeline";

export default function Timeline() {
  return (
    <ol className="relative border-l border-line pl-8">
      {timeline.map((entry) => (
        <li key={entry.year} className="mb-10 last:mb-0">
          <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-ink bg-brand-400" />
          <div className="eyebrow text-brand-400">{entry.year}</div>
          <h3 className="mt-1 text-lg font-semibold text-paper">{entry.title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist">{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}
