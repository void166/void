import CrystalHero from "@/components/CrystalHero";
import Marquee from "@/components/Marquee";
import SectionDeck from "@/components/SectionDeck";
import WorksShowcase from "@/components/WorksShowcase";
import ContactFinale from "@/components/ContactFinale";

export default function Home() {
  return (
    <>
      {/* 01 — glass hero */}
      {/* svh: sized to the small viewport so mobile browser chrome never hides the bottom */}
      <section className="relative h-[calc(100svh-69px)] min-h-[600px] w-full overflow-hidden bg-[#050505]">
        <CrystalHero />
      </section>

      <Marquee items={["React", "Node.js", "Three.js", "TypeScript", "Next.js"]} />

      {/* 02 — about / stack / journey: switching color worlds */}
      <SectionDeck />

      <Marquee items={["Selected Works", "Digital Exhibition", "Scroll Slowly", "Est. 2025"]} />

      {/* 03 — cinematic project exhibition */}
      <WorksShowcase />

      {/* 04 — contact finale */}
      <ContactFinale />
    </>
  );
}
