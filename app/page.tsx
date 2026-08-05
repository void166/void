import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import SectionHeading from "@/components/SectionHeading";
import ServiceMatrix from "@/components/ServiceMatrix";
import NewsCard from "@/components/NewsCard";
import GlobalReachSection from "@/components/GlobalReachSection";
import GroupNetworkSection from "@/components/GroupNetworkSection";
import Reveal from "@/components/Reveal";
import { news } from "@/lib/data/news";

export default function Home() {
  const latestNews = news.slice(0, 3);

  return (
    <>
      <section className="w-full overflow-hidden bg-[#060606]">
        <div className="container-page grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <div className="py-16 lg:py-24">
            <div className="eyebrow animate-fade-up text-brand-400">
              AI &middot; Data &middot; Digital Marketing
            </div>
            <h1
              className="animate-fade-up mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              We build the data and AI backbone behind smarter decisions.
            </h1>
            <p
              className="animate-fade-up mt-5 max-w-lg text-base leading-relaxed text-mist sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Dentsu Data Artist Mongol delivers AI solutions, data engineering, and
              performance marketing — backed by 50+ specialists and the global reach
              of the Dentsu Group.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap gap-4" style={{ animationDelay: "240ms" }}>
              <Link
                href="/contact"
                className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/20"
              >
                Get in touch
              </Link>
              <Link
                href="/services"
                className="rounded-md border border-line-strong px-6 py-3 text-sm font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-300"
              >
                Explore services
              </Link>
            </div>
          </div>
          <div className="relative h-[60vh] min-h-[420px] w-full lg:h-[80vh] lg:min-h-[560px]">
            <HeroScene />
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Latest Updates" title="News &amp; insights from DDAM" />
            <Link href="/news" className="text-sm font-medium text-brand-300 hover:text-brand-200">
              View all news &rarr;
            </Link>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {latestNews.map((item, i) => (
              <Reveal key={item.slug} delay={i * 80}>
                <NewsCard item={item} />
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
          <div className="mt-10">
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
          <Reveal delay={120} className="mt-10">
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
          <Reveal delay={120} className="mt-10">
            <GroupNetworkSection />
          </Reveal>
        </div>
      </section>
    </>
  );
}
