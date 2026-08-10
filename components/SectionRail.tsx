"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const TICKS = 21;

/**
 * Fixed left-edge ruler: tick marks + the current section's name riding
 * the scroll position, so the user always knows where they are.
 */
export default function SectionRail() {
  const pathname = usePathname();
  const [label, setLabel] = useState("HOME");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (pathname !== "/") return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setActive(Math.round(p * (TICKS - 1)));

      /* current section = last anchor above the viewport's upper third */
      const pos = window.scrollY + window.innerHeight * 0.35;
      let cur = "HOME";
      for (const id of ["about", "works", "contact"]) {
        const el = document.getElementById(id);
        if (el && pos >= el.getBoundingClientRect().top + window.scrollY) {
          cur = id.toUpperCase();
        }
      }
      setLabel(cur);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3.5 sm:flex"
      aria-hidden
    >
      {Array.from({ length: TICKS }).map((_, i) => (
        <div key={i} className="flex h-px items-center">
          <span
            className={`h-px transition-all duration-300 ${
              i === active
                ? "w-9 bg-paper"
                : i % 5 === 0
                  ? "w-6 bg-white/45"
                  : "w-3.5 bg-white/20"
            }`}
          />
          {i === active && (
            <span className="ml-4 font-mono text-[11px] font-bold tracking-[0.3em] text-paper">
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
