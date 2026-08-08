"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { services } from "@/lib/data/services";
import { primaryNav } from "@/lib/nav";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setServicesOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur supports-[backdrop-filter]:bg-ink/70">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="group flex shrink-0 items-baseline gap-3">
          <span className="text-lg font-black uppercase tracking-[0.28em] text-paper">
            DDAM
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-fog transition-colors group-hover:text-mist sm:inline">
            Dentsu Data Artist Mongol
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link
              href="/services"
              onFocus={() => setServicesOpen(true)}
              className={`flex items-center gap-1.5 font-mono text-[13px] tracking-[0.14em] transition-colors ${
                pathname.startsWith("/services") ? "text-paper" : "text-mist hover:text-paper"
              }`}
              aria-expanded={servicesOpen}
            >
              Services
              <svg width="10" height="6" viewBox="0 0 10 6" className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {servicesOpen && (
              <div className="absolute left-1/2 top-full w-[36rem] -translate-x-1/2 pt-4">
                <div className="grid grid-cols-2 border border-line-strong bg-ink shadow-2xl shadow-black/60">
                  {services.map((service, i) => (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      className="group border border-line/50 p-4 transition-colors hover:bg-paper"
                    >
                      <div className="font-mono text-[10px] tracking-[0.2em] text-fog group-hover:text-black/50">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-1.5 text-sm font-bold uppercase tracking-wide text-paper group-hover:text-black">
                        {service.shortName}
                      </div>
                      <div className="mt-1 text-xs leading-snug text-fog group-hover:text-black/60">
                        {service.tagline}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/services"
                    className="col-span-2 flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-paper"
                  >
                    View all services
                    <span aria-hidden>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {primaryNav.slice(1).map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="rounded-full border border-line-strong px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-white/10"
          >
            Contact / Recruit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center border border-line text-paper lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            {mobileOpen ? (
              <path d="M1 1l16 12M17 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-ink lg:hidden">
          <nav className="container-page flex flex-col py-4">
            <MobileLink href="/">Home</MobileLink>
            <div className="py-1">
              <div className="eyebrow px-3 py-2 text-fog">Services</div>
              {services.map((service) => (
                <MobileLink key={service.slug} href={`/services/${service.slug}`} indent>
                  {service.shortName}
                </MobileLink>
              ))}
            </div>
            {primaryNav.slice(1).map((item) => (
              <MobileLink key={item.href} href={item.href}>
                {item.label}
              </MobileLink>
            ))}
            <Link href="/contact" className="btn-solid mt-3 text-center">
              Contact / Recruit
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`font-mono text-[13px] tracking-[0.14em] transition-colors ${
        active ? "text-paper" : "text-mist hover:text-paper"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, indent }: { href: string; children: React.ReactNode; indent?: boolean }) {
  return (
    <Link
      href={href}
      className={`block py-2.5 font-mono text-sm tracking-[0.1em] text-paper hover:text-white ${indent ? "pl-6" : "px-3"}`}
    >
      {children}
    </Link>
  );
}
