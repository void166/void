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
      <section className="border-b border-line py-20">
        <div className="container-page">
          <div className="eyebrow animate-fade-up text-brand-400">Services</div>
          <h1
            className="animate-fade-up mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Four practices. One data-driven approach.
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            From proof of concept to full-scale AI systems, data pipelines, and
            performance marketing — we meet you wherever you are in the journey.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="What we do" title="Explore our services" />
          </Reveal>
          <div className="mt-10">
            <ServiceMatrix />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20">
        <Reveal className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-ink-2 p-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Not sure where to start?</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-mist">
                Tell us about your business problem and we&apos;ll recommend the right starting point — often a focused Proof of Concept.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/20"
            >
              Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
