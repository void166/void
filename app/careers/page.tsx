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
      <section className="border-b border-line py-20">
        <div className="container-page">
          <div className="eyebrow animate-fade-up text-brand-400">Careers</div>
          <h1
            className="animate-fade-up mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Help us humanize software.
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            We&apos;re a team of 50+ specialists building AI and data solutions for clients
            around the world, from our office in Ulaanbaatar. Have questions? Let&apos;s discuss
            how you can join our team.
          </p>
        </div>
      </section>

      <section className="border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Why DDAM" title="Culture & benefits" />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 60}>
                <div className="rounded-2xl border border-line bg-ink-2 p-6 transition-colors duration-300 hover:border-line-strong">
                  <h3 className="text-base font-semibold text-paper">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Open Roles" title="Available job opportunities" />
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {jobs.map((job, i) => (
              <Reveal key={job.slug} delay={(i % 2) * 80}>
                <JobCard job={job} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Apply" title="Send your CV" />
          </Reveal>
          <Reveal delay={100} className="mt-10 max-w-3xl">
            <CVUploadForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
