"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { primaryNav } from "@/lib/nav";
import { profile } from "@/lib/data/profile";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur supports-[backdrop-filter]:bg-ink/70">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="group flex shrink-0 items-baseline gap-3">
          <span className="text-lg font-black uppercase tracking-[0.28em] text-paper">
            {profile.name}
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-fog transition-colors group-hover:text-mist sm:inline">
            {profile.role}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[13px] tracking-[0.14em] transition-colors ${
                pathname === item.href ? "text-paper" : "text-mist hover:text-paper"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/#contact"
            className="rounded-full border border-line-strong px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper transition-colors hover:border-accent hover:text-accent"
          >
            Contact / Hire Me
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
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 font-mono text-sm tracking-[0.1em] text-paper hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/#contact" onClick={() => setMobileOpen(false)} className="btn-solid mt-3 text-center">
              Contact / Hire Me
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
