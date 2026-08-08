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
      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            About Us
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-3xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Human intelligence, powered by data.
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Dentsu Data Artist Mongol LLC was established in {corporateProfile.founded} in{" "}
            {corporateProfile.headquarters}, as part of the Dentsu Group. Today we&apos;re{" "}
            {corporateProfile.headcount} strong.
          </p>
        </div>
      </section>

      <nav className="sticky top-[69px] z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="container-page flex gap-8 overflow-x-auto py-4">
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.16em] text-mist transition-colors hover:text-paper"
            >
              <span className="mr-2 text-fog">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="vision" className="scroll-mt-32 border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Vision & Mission & Values" title="What drives us" />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 60} className="h-full">
                <div className="h-full bg-ink p-7 transition-colors duration-300 hover:bg-white/[0.02]">
                  <div className="font-mono text-xs tracking-[0.25em] text-fog">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-4 text-base font-black uppercase tracking-wide text-paper">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="dentsu" className="scroll-mt-32 border-b border-line py-24">
        <Reveal className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="The Subsidiary Advantage" title={dentsuRelationship.heading} />
            <p className="mt-6 text-base leading-relaxed text-mist">{dentsuRelationship.body}</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {dentsuRelationship.benefits.map((benefit, i) => (
              <li key={benefit} className="flex items-start gap-4 p-5 transition-colors duration-300 hover:bg-white/[0.02]">
                <span className="mt-0.5 font-mono text-[11px] tracking-[0.2em] text-fog">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-paper">{benefit}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section id="leadership" className="scroll-mt-32 border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Leadership & Specialists"
              title={`Meet the team behind ${corporateProfile.headcount}`}
              description="Full leadership bios are being finalized — this section will be updated with our specialists' real profiles."
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {leadership.map((leader, i) => (
              <Reveal key={leader.id} delay={i * 60}>
                <LeadershipCard leader={leader} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="corporate-profile" className="scroll-mt-32 py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Corporate Profile" title="History & corporate data" />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Reveal>
              <h3 className="display-title text-lg text-paper">Our history</h3>
              <div className="mt-6">
                <Timeline />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <h3 className="display-title text-lg text-paper">Corporate data</h3>
              <div className="mt-6">
                <CorporateDataTable />
              </div>
            </Reveal>
          </div>

          <Reveal className="card-line mt-16 p-10">
            <div className="eyebrow flex items-center gap-3 text-mist">
              <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
              Our office
            </div>
            <h3 className="display-title mt-4 text-2xl">{office.heading}</h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-mist">{office.body}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
