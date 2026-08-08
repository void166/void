import { timeline } from "@/lib/data/timeline";

export default function Timeline() {
  return (
    <ol className="relative border-l border-line pl-8">
      {timeline.map((entry) => (
        <li key={entry.year} className="mb-10 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 border border-ink bg-paper" />
          <div className="font-mono text-xs tracking-[0.25em] text-mist">{entry.year}</div>
          <h3 className="mt-1.5 text-lg font-black uppercase tracking-wide text-paper">{entry.title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist">{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}
