import type { Metadata } from "next";
import Timeline from "@/components/Timeline";
import CorporateDataTable from "@/components/CorporateDataTable";
import LeadershipCard from "@/components/LeadershipCard";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { corporateProfile, values, dentsuRelationship, office } from "@/lib/data/corporate";
import { leadership } from "@/lib/data/leadership";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Vision, values, our relationship with the Dentsu Group, leadership, and corporate profile of Dentsu Data Artist Mongol LLC.",
};

const sections = [
  { id: "vision", label: "Vision & Values" },
  { id: "dentsu", label: "Dentsu Relationship" },
  { id: "leadership", label: "Leadership" },
  { id: "corporate-profile", label: "Corporate Profile" },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line py-20">
        <div className="container-page">
          <div className="eyebrow animate-fade-up text-brand-400">About Us</div>
          <h1
            className="animate-fade-up mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Human intelligence, powered by data.
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Dentsu Data Artist Mongol LLC was established in {corporateProfile.founded} in{" "}
            {corporateProfile.headquarters}, as part of the Dentsu Group. Today we&apos;re{" "}
            {corporateProfile.headcount} strong.
          </p>
        </div>
      </section>

      <nav className="sticky top-[73px] z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="container-page flex gap-6 overflow-x-auto py-4 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap text-mist transition-colors hover:text-brand-300">
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="vision" className="scroll-mt-32 border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Vision & Mission & Values" title="What drives us" />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 60}>
                <div className="rounded-2xl border border-line bg-ink-2 p-6 transition-colors duration-300 hover:border-line-strong">
                  <h3 className="text-base font-semibold text-paper">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="dentsu" className="scroll-mt-32 border-b border-line py-20">
        <Reveal className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="The Subsidiary Advantage" title={dentsuRelationship.heading} />
            <p className="mt-6 text-base leading-relaxed text-mist">{dentsuRelationship.body}</p>
          </div>
          <ul className="space-y-4">
            {dentsuRelationship.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 rounded-xl border border-line bg-ink-2 p-5 transition-colors duration-300 hover:border-line-strong"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span className="text-sm leading-relaxed text-paper">{benefit}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section id="leadership" className="scroll-mt-32 border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Leadership & Specialists"
              title={`Meet the team behind ${corporateProfile.headcount}`}
              description="Full leadership bios are being finalized — this section will be updated with our specialists' real profiles."
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {leadership.map((leader, i) => (
              <Reveal key={leader.id} delay={i * 60}>
                <LeadershipCard leader={leader} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="corporate-profile" className="scroll-mt-32 py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Corporate Profile" title="History & corporate data" />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Reveal>
              <h3 className="text-lg font-semibold text-paper">Our history</h3>
              <div className="mt-6">
                <Timeline />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h3 className="text-lg font-semibold text-paper">Corporate data</h3>
              <div className="mt-6">
                <CorporateDataTable />
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-16 rounded-2xl border border-line bg-ink-2 p-10">
            <div className="eyebrow text-brand-400">Our office</div>
            <h3 className="mt-3 text-2xl font-bold">{office.heading}</h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-mist">{office.body}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
