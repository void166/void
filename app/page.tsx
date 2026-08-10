import HeroAboutStage from "@/components/HeroAboutStage";
import Marquee from "@/components/Marquee";
import WorksShowcase from "@/components/WorksShowcase";
import ContactFinale from "@/components/ContactFinale";

export default function Home() {
  return (
    <>
      {/* 01+02 — one continuous stage: glass hero dissolving into about */}
      <HeroAboutStage />

      {/* 03 — cinematic project exhibition, handed off directly from about */}
      <WorksShowcase />

      <Marquee items={["React", "Node.js", "Three.js", "TypeScript", "Next.js"]} />

      {/* 04 — contact finale */}
      <ContactFinale />
    </>
  );
}
