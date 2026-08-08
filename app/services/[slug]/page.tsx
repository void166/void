import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, services } from "@/lib/data/services";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: service.name,
    description: service.valueProp,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const otherServices = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-page">
          <nav className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog">
            <Link href="/services" className="hover:text-mist">
              Services
            </Link>
            <span className="mx-2">/</span>
            <span className="text-mist">{service.name}</span>
          </nav>
          <div className="eyebrow animate-fade-up mt-8 flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            {service.shortName}
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-4xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {service.name}
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {service.valueProp}
          </p>
          <div className="animate-fade-up mt-10" style={{ animationDelay: "240ms" }}>
            <Link href="/contact" className="btn-solid">
              Discuss your project
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <Reveal className="container-page grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-2">
          <div className="bg-ink p-8">
            <div className="eyebrow text-fog">The problem</div>
            <p className="mt-4 text-base leading-relaxed text-paper">{service.problem}</p>
          </div>
          <div className="bg-ink p-8">
            <div className="eyebrow text-mist">Our solution</div>
            <p className="mt-4 text-base leading-relaxed text-paper">{service.solution}</p>
          </div>
        </Reveal>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <div className="eyebrow flex items-center gap-3 text-mist">
              <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
              Why choose us
            </div>
            <h2 className="display-title mt-4 text-3xl">Strengths &amp; USPs</h2>
          </Reveal>
          <ul className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
            {service.strengths.map((strength, i) => (
              <Reveal key={strength} delay={i * 60} className="h-full">
                <li className="flex h-full items-start gap-4 bg-ink p-6 transition-colors duration-300 hover:bg-white/[0.02]">
                  <span className="mt-0.5 font-mono text-[11px] tracking-[0.2em] text-fog">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-paper">{strength}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-page">
          <Reveal>
            <div className="eyebrow flex items-center gap-3 text-mist">
              <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
              How it works
            </div>
            <h2 className="display-title mt-4 text-3xl">Our approach</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {service.approach.map((step, i) => (
              <Reveal key={step.title} delay={i * 80} className="h-full">
                <div className="h-full bg-ink p-7 transition-colors duration-300 hover:bg-white/[0.02]">
                  <div className="font-mono text-sm tracking-[0.25em] text-mist">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-4 text-base font-black uppercase tracking-wide text-paper">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <h2 className="display-title text-2xl">Explore other services</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
            {otherServices.map((other, i) => (
              <Link
                key={other.slug}
                href={`/services/${other.slug}`}
                className="group bg-ink p-7 transition-colors duration-300 hover:bg-paper"
              >
                <span className="font-mono text-xs tracking-[0.25em] text-fog group-hover:text-black/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-4 text-base font-black uppercase tracking-wide text-paper group-hover:text-black">
                  {other.shortName}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-mist group-hover:text-black/60">{other.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
