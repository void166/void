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
      <section className="border-b border-line py-20">
        <div className="container-page">
          <div className="eyebrow animate-fade-up text-brand-400">Contact</div>
          <h1
            className="animate-fade-up mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Let&apos;s build something together.
          </h1>
          <p
            className="animate-fade-up mt-5 max-w-2xl text-base leading-relaxed text-mist sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Have a project in mind, a partnership idea, or a question about working with us?
            Reach out — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="space-y-8">
            <div>
              <div className="eyebrow text-fog">Email</div>
              <a href={`mailto:${contact.email}`} className="mt-2 block text-lg font-medium text-paper transition-colors hover:text-brand-300">
                {contact.email}
              </a>
            </div>
            <div>
              <div className="eyebrow text-fog">Phone</div>
              <a href={contact.phoneHref} className="mt-2 block text-lg font-medium text-paper transition-colors hover:text-brand-300">
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
              <div className="mt-4 flex h-48 items-center justify-center rounded-xl border border-line bg-ink-2 text-xs text-fog">
                Map placeholder — Altan Joloo Tower, Ulaanbaatar
              </div>
            </div>
            <div className="rounded-xl border border-line bg-ink-2 p-5 transition-colors duration-300 hover:border-line-strong">
              <div className="text-sm font-semibold text-paper">Looking to join the team instead?</div>
              <Link href="/careers" className="mt-2 inline-block text-sm font-medium text-brand-300 hover:text-brand-200">
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
