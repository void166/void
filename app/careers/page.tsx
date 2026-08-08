import type { Metadata } from "next";
import JobCard from "@/components/JobCard";
import CVUploadForm from "@/components/CVUploadForm";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { jobs, benefits } from "@/lib/data/jobs";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join Dentsu Data Artist Mongol — open roles, culture, and employee benefits.",
};

export default function CareersPage() {
  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            Careers
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-3xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Help us humanize software.
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            We&apos;re a team of 50+ specialists building AI and data solutions for clients
            around the world, from our office in Ulaanbaatar. Have questions? Let&apos;s discuss
            how you can join our team.
          </p>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Why DDAM" title="Culture & benefits" />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 60} className="h-full">
                <div className="h-full bg-ink p-7 transition-colors duration-300 hover:bg-white/[0.02]">
                  <div className="font-mono text-xs tracking-[0.25em] text-fog">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-4 text-base font-black uppercase tracking-wide text-paper">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Open Roles" title="Available job opportunities" />
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {jobs.map((job, i) => (
              <Reveal key={job.slug} delay={(i % 2) * 80}>
                <JobCard job={job} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Apply" title="Send your CV" />
          </Reveal>
          <Reveal delay={100} className="mt-12 max-w-3xl">
            <CVUploadForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
