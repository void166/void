import Link from "next/link";
import CrystalHero from "@/components/CrystalHero";
import SectionHeading from "@/components/SectionHeading";
import ServiceMatrix from "@/components/ServiceMatrix";
import GlobalReachSection from "@/components/GlobalReachSection";
import GroupNetworkSection from "@/components/GroupNetworkSection";
import Reveal from "@/components/Reveal";
import { news } from "@/lib/data/news";

export default function Home() {
  const latestNews = news.slice(0, 3);

  return (
    <>
      <section className="relative h-[calc(100vh-69px)] min-h-[600px] w-full overflow-hidden bg-[#050505]">
        <CrystalHero />
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            AI &middot; Data &middot; Digital Marketing
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-4xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            We build the data &amp; AI backbone behind smarter decisions.
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Dentsu Data Artist Mongol delivers AI solutions, data engineering, and
            performance marketing — backed by 50+ specialists and the global reach
            of the Dentsu Group.
          </p>
          <div className="animate-fade-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
            <Link href="/contact" className="btn-solid">
              Get in touch
            </Link>
            <Link href="/services" className="btn-ghost">
              Explore services
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Latest Updates" title="News" />
            <Link
              href="/news"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist transition-colors hover:text-paper"
            >
              View all news &rarr;
            </Link>
          </Reveal>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {latestNews.map((item, i) => (
              <Reveal key={item.slug} delay={i * 80}>
                <Link
                  href="/news"
                  className="group grid grid-cols-1 items-baseline gap-2 py-6 transition-colors hover:bg-white/[0.03] sm:grid-cols-[10rem_1fr_auto] sm:gap-6"
                >
                  <time dateTime={item.date} className="font-mono text-[11px] tracking-[0.25em] text-fog">
                    {item.date.replaceAll("-", " ")}
                  </time>
                  <span className="text-base font-bold leading-snug text-paper underline-offset-4 group-hover:underline sm:text-lg">
                    {item.title}
                  </span>
                  <span className="hidden font-mono text-xs text-fog transition-colors group-hover:text-paper sm:block">
                    &rarr;
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="What we do"
              title="Core competencies"
              description="Four practices, one goal: turning data and AI into a measurable business advantage."
            />
          </Reveal>
          <div className="mt-12">
            <ServiceMatrix />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Global Reach"
              title="Local team, global network"
              description="Based in Ulaanbaatar, working across the Japanese market and Dentsu's global client base."
            />
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <GlobalReachSection />
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Group Network"
              title="Part of something bigger"
              description="DDAM operates as part of the Dentsu Group, alongside sister companies across data, media, and technology."
            />
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <GroupNetworkSection />
          </Reveal>
        </div>
      </section>
    </>
  );
}
