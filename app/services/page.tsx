import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import ServiceMatrix from "@/components/ServiceMatrix";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI Solution Development, Data Engineering & Analytics, Proof of Concept & R&D, and Digital Marketing from Dentsu Data Artist Mongol.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            Services
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-3xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Four practices. One data-driven approach.
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            From proof of concept to full-scale AI systems, data pipelines, and
            performance marketing — we meet you wherever you are in the journey.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="What we do" title="Explore our services" />
          </Reveal>
          <div className="mt-12">
            <ServiceMatrix />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-24">
        <Reveal className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 border border-line p-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="display-title text-2xl">Not sure where to start?</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-mist">
                Tell us about your business problem and we&apos;ll recommend the right starting point — often a focused Proof of Concept.
              </p>
            </div>
            <Link href="/contact" className="btn-solid shrink-0">
              Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
