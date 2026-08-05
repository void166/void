import Link from "next/link";
import { services } from "@/lib/data/services";
import { contact } from "@/lib/data/contact";
import { legalNav, primaryNav } from "@/lib/nav";
import LogoBadge from "./LogoBadge";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoBadge size="sm" />
            <span className="text-sm font-bold tracking-wide">DDAM</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            Dentsu Data Artist Mongol LLC — AI solutions, data engineering, analytics, and
            digital marketing, built by 50+ specialists as part of the Dentsu Group.
          </p>
          <div className="mt-5 flex gap-3">
            {contact.social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-xs text-mist transition-colors hover:border-brand-500 hover:text-brand-300"
                aria-label={s.label}
              >
                {s.label[0]}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow text-fog">Explore</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mist transition-colors hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow text-fog">Services</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="text-mist transition-colors hover:text-paper">
                  {service.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow text-fog">Contact</div>
          <ul className="mt-4 space-y-2.5 text-sm text-mist">
            <li>
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-paper">
                {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className="transition-colors hover:text-paper">
                {contact.phone}
              </a>
            </li>
            <li className="leading-relaxed">{contact.addressLines.join(" ")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} Dentsu Data Artist Mongol LLC. Proud member of the{" "}
            <span className="text-mist">Dentsu Group</span>.
          </p>
          <div className="flex gap-5">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-mist">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
