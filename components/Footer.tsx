import Link from "next/link";
import { legalNav, primaryNav } from "@/lib/nav";
import { profile } from "@/lib/data/profile";
import LogoBadge from "./LogoBadge";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <LogoBadge size="sm" />
            <span className="text-sm font-black uppercase tracking-[0.28em]">{profile.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            {profile.role} based in {profile.location}. {profile.tagline}
          </p>
          <div className="mt-5 flex gap-2">
            {profile.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="flex h-8 w-8 items-center justify-center border border-line font-mono text-xs text-mist transition-colors hover:border-accent hover:text-accent"
                aria-label={s.label}
              >
                {s.label[0]}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow text-fog">Explore</div>
          <ul className="mt-4 space-y-2.5 font-mono text-[13px] tracking-[0.08em]">
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
          <div className="eyebrow text-fog">Stack</div>
          <ul className="mt-4 space-y-2.5 font-mono text-[13px] tracking-[0.08em] text-mist">
            {profile.stack.slice(0, 5).map((s) => (
              <li key={s.name}>{s.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="eyebrow text-fog">Contact</div>
          <ul className="mt-4 space-y-2.5 font-mono text-[13px] tracking-[0.05em] text-mist">
            <li>
              <a href={`mailto:${profile.email}`} className="transition-colors hover:text-accent">
                {profile.email}
              </a>
            </li>
            <li className="leading-relaxed">{profile.location}</li>
            <li className="text-accent">{profile.availability}</li>
          </ul>
        </div>
      </div>

      {/* giant outlined wordmark */}
      <div className="container-page overflow-hidden pb-4" aria-hidden>
        <div className="text-outline select-none whitespace-nowrap text-[clamp(4rem,13vw,12rem)] font-black uppercase leading-none tracking-tight">
          {profile.name}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 font-mono text-[11px] tracking-[0.08em] text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {profile.name}. Built with Next.js, Three.js &amp; too much coffee.
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
