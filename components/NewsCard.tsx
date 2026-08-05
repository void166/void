import type { NewsItem } from "@/lib/data/news";

const categoryColors: Record<NewsItem["category"], string> = {
  "Press Release": "text-brand-300 bg-brand-500/10",
  Event: "text-emerald-300 bg-emerald-500/10",
  Insight: "text-amber-300 bg-amber-500/10",
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const date = new Date(item.date);
  const formatted = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl hover:shadow-black/30">
      <div className="flex items-center gap-3">
        <span className={`eyebrow rounded-full px-2.5 py-1 ${categoryColors[item.category]}`}>{item.category}</span>
        <time dateTime={item.date} className="text-xs text-fog">
          {formatted}
        </time>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-paper">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mist">{item.excerpt}</p>
    </article>
  );
}
