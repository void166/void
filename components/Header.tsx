"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { services } from "@/lib/data/services";
import { primaryNav } from "@/lib/nav";
import LogoBadge from "./LogoBadge";

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
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-ink/70">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoBadge />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-wide">DDAM</span>
            <span className="text-[10px] tracking-wide text-fog">Dentsu Data Artist Mongol</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
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
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
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
              <div className="absolute left-1/2 top-full w-[36rem] -translate-x-1/2 pt-3">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-2 p-3 shadow-2xl shadow-black/50">
                  {services.map((service) => (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      className="group rounded-lg p-3 transition-colors hover:bg-ink-3"
                    >
                      <div className="text-sm font-semibold text-paper group-hover:text-brand-300">
                        {service.shortName}
                      </div>
                      <div className="mt-1 text-xs leading-snug text-fog">{service.tagline}</div>
                    </Link>
                  ))}
                  <Link
                    href="/services"
                    className="col-span-2 mt-1 flex items-center justify-between rounded-lg border-t border-line px-3 pt-3 text-xs font-medium text-brand-300 hover:text-brand-200"
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
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
          >
            Get in touch
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-paper lg:hidden"
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
          <nav className="container-page flex flex-col gap-1 py-4">
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
            <Link
              href="/contact"
              className="mt-2 rounded-md bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get in touch
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
      className={`rounded-md px-3 py-2 text-sm transition-colors ${active ? "text-paper" : "text-mist hover:text-paper"}`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, indent }: { href: string; children: React.ReactNode; indent?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-md py-2.5 text-sm text-paper hover:text-brand-300 ${indent ? "pl-6" : "px-3"}`}
    >
      {children}
    </Link>
  );
}
