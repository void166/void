import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { contact } from "@/lib/data/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Dentsu Data Artist Mongol — address, email, and phone.",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow animate-fade-up flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            Contact
          </div>
          <h1
            className="display-title animate-fade-up mt-6 max-w-3xl text-4xl sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Let&apos;s build something together.
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Have a project in mind, a partnership idea, or a question about working with us?
            Reach out — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="space-y-8">
            <div>
              <div className="eyebrow text-fog">Email</div>
              <a
                href={`mailto:${contact.email}`}
                className="mt-2 block font-mono text-lg text-paper underline-offset-4 transition-colors hover:underline"
              >
                {contact.email}
              </a>
            </div>
            <div>
              <div className="eyebrow text-fog">Phone</div>
              <a
                href={contact.phoneHref}
                className="mt-2 block font-mono text-lg text-paper underline-offset-4 transition-colors hover:underline"
              >
                {contact.phone}
              </a>
            </div>
            <div>
              <div className="eyebrow text-fog">Our location</div>
              <p className="mt-2 max-w-xs text-base leading-relaxed text-paper">
                {contact.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <div className="card-line mt-4 flex h-48 items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-fog">
                Map placeholder — Altan Joloo Tower, Ulaanbaatar
              </div>
            </div>
            <div className="card-line p-5">
              <div className="text-sm font-bold uppercase tracking-wide text-paper">
                Looking to join the team instead?
              </div>
              <Link
                href="/careers"
                className="mt-2 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-paper"
              >
                View open careers &rarr;
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
