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
      <section className="border-b border-line py-20">
        <div className="container-page">
          <nav className="text-xs text-fog">
            <Link href="/services" className="hover:text-mist">
              Services
            </Link>
            <span className="mx-2">/</span>
            <span className="text-mist">{service.name}</span>
          </nav>
          <div className="eyebrow animate-fade-up mt-6 text-brand-400">{service.shortName}</div>
          <h1
            className="animate-fade-up mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            {service.name}
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {service.valueProp}
          </p>
          <div className="animate-fade-up mt-8" style={{ animationDelay: "240ms" }}>
            <Link
              href="/contact"
              className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/20"
            >
              Discuss your project
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-20">
        <Reveal className="container-page grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-ink-2 p-8 transition-colors duration-300 hover:border-line-strong">
            <div className="eyebrow text-fog">The problem</div>
            <p className="mt-4 text-base leading-relaxed text-paper">{service.problem}</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink-2 p-8 transition-colors duration-300 hover:border-brand-500/50">
            <div className="eyebrow text-brand-400">Our solution</div>
            <p className="mt-4 text-base leading-relaxed text-paper">{service.solution}</p>
          </div>
        </Reveal>
      </section>

      <section className="border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <div className="eyebrow text-brand-400">Why choose us</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Strengths &amp; USPs</h2>
          </Reveal>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {service.strengths.map((strength, i) => (
              <Reveal key={strength} delay={i * 60} className="h-full">
                <li className="flex h-full items-start gap-3 rounded-xl border border-line bg-ink-2 p-5 transition-colors duration-300 hover:border-line-strong">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <span className="text-sm leading-relaxed text-paper">{strength}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line py-20">
        <div className="container-page">
          <Reveal>
            <div className="eyebrow text-brand-400">How it works</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Our approach</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.approach.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="rounded-2xl border border-line bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-xl hover:shadow-black/30">
                  <div className="font-mono text-sm text-brand-400">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 text-base font-semibold text-paper">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <h2 className="text-2xl font-bold">Explore other services</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {otherServices.map((other) => (
              <Link
                key={other.slug}
                href={`/services/${other.slug}`}
                className="rounded-2xl border border-line bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-xl hover:shadow-black/30"
              >
                <div className="text-base font-semibold text-paper">{other.shortName}</div>
                <p className="mt-2 text-sm leading-relaxed text-mist">{other.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
