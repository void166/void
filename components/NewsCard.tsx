import type { NewsItem } from "@/lib/data/news";

export default function NewsCard({ item }: { item: NewsItem }) {
  // alche-style date: 2026 08 01
  const formatted = item.date.replaceAll("-", " ");

  return (
    <article className="card-line group flex h-full flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <time dateTime={item.date} className="font-mono text-[11px] tracking-[0.2em] text-fog">
          {formatted}
        </time>
        <span className="eyebrow border border-line px-2 py-0.5 text-fog">
          {item.category}
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold leading-snug text-paper underline-offset-4 group-hover:underline">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mist">{item.excerpt}</p>
      <span className="mt-auto pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-fog transition-colors group-hover:text-paper">
        Read &rarr;
      </span>
    </article>
  );
}
