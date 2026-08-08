"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const DEFAULT_ITEMS = ["AI Solutions", "Data Engineering", "Digital Marketing", "PoC / R&D"];

/**
 * Infinite marquee band. The whole band skews with scroll velocity,
 * so fast scrolling visibly "drags" the type — alche-style.
 */
export default function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  const skewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = skewRef.current;
    if (!el) return;

    let lastY = window.scrollY;
    let lastT = performance.now();
    let idleTimer = 0;

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      const v = ((window.scrollY - lastY) / dt) * 1000; // px per second
      lastY = window.scrollY;
      lastT = now;
      const skew = gsap.utils.clamp(-9, 9, v * 0.006);
      gsap.to(el, { skewX: skew, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        gsap.to(el, { skewX: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      }, 90);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idleTimer);
    };
  }, []);

  const half = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span
            className={`px-6 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl ${
              i % 2 === 0 ? "text-paper" : "text-outline-accent"
            }`}
          >
            {item}
          </span>
          <span className="font-mono text-lg text-accent" aria-hidden>
            +
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-line py-6" aria-hidden>
      <div ref={skewRef} className="will-change-transform">
        <div className="marquee-track">
          {half}
          {half}
        </div>
      </div>
    </div>
  );
}
