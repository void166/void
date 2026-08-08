import type { Metadata } from "next";
import NewsCard from "@/components/NewsCard";
import Reveal from "@/components/Reveal";
import { news } from "@/lib/data/news";

export const metadata: Metadata = {
  title: "News",
  description: "Press releases, event updates, and insights from Dentsu Data Artist Mongol.",
};

export default function NewsPage() {
  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            News
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-3xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Press releases, events &amp; insights
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Updates from our AI, data engineering, and digital marketing practice.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item, i) => (
              <Reveal key={item.slug} delay={(i % 3) * 80} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
