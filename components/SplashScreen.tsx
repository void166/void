"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile } from "@/lib/data/profile";

/**
 * Load splash: name reveals char by char while a counter runs 0→100,
 * then the whole screen slides up to unveil the site.
 * Shows once per browser session. A failsafe timer guarantees it
 * can never get stuck covering the page.
 */
export default function SplashScreen() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("splash-seen") === "1";
    } catch {
      // storage unavailable — just show the splash
    }
    if (seen) {
      queueMicrotask(() => setGone(true));
      return;
    }

    const overlay = overlayRef.current;
    const name = nameRef.current;
    if (!overlay || !name) return;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      try {
        sessionStorage.setItem("splash-seen", "1");
      } catch {
        // ignore
      }
      setGone(true);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tweens: gsap.core.Tween[] = [];
    /* failsafe: whatever happens, the splash leaves */
    const failsafe = window.setTimeout(finish, 4500);

    if (reduced) {
      tweens.push(gsap.to(overlay, { opacity: 0, duration: 0.4, delay: 0.4, onComplete: finish }));
    } else {
      const chars = Array.from(name.querySelectorAll<HTMLElement>(".splash-char"));
      const counter = { v: 0 };
      tweens.push(
        gsap.fromTo(
          chars,
          { yPercent: 115 },
          { yPercent: 0, duration: 0.8, ease: "power4.out", stagger: 0.055 }
        )
      );
      tweens.push(
        gsap.to(counter, {
          v: 100,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (countRef.current) {
              countRef.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
            }
          },
        })
      );
      if (barRef.current) {
        tweens.push(gsap.to(barRef.current, { scaleX: 1, duration: 1.5, ease: "power2.inOut" }));
      }
      /* exit: slide the whole cover up (transform — reliable everywhere) */
      tweens.push(
        gsap.to(overlay, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          delay: 1.85,
          onComplete: finish,
        })
      );
    }

    return () => {
      window.clearTimeout(failsafe);
      tweens.forEach((tw) => tw.kill());
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#030303] will-change-transform"
      aria-hidden
    >
      <div ref={nameRef} className="flex overflow-hidden">
        {profile.name.toUpperCase().split("").map((ch, i) => (
          <span
            key={i}
            className="splash-char inline-block text-[13vw] font-black uppercase leading-none tracking-tight text-paper sm:text-[9vw]"
          >
            {ch}
          </span>
        ))}
      </div>
      <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.35em] text-fog">
        {profile.role} — Portfolio
      </div>

      <div className="absolute bottom-10 left-6 right-6 sm:left-10 sm:right-10">
        <div className="flex items-end justify-between font-mono text-fog">
          <span className="text-[10px] uppercase tracking-[0.3em]">Loading experience</span>
          <span className="text-2xl text-accent">
            <span ref={countRef}>000</span>
            <span className="text-xs text-fog"> / 100</span>
          </span>
        </div>
        <div className="mt-3 h-px w-full bg-white/10">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-accent"
            style={{ transform: "scaleX(0)", boxShadow: "0 0 12px rgba(89,227,255,0.8)" }}
          />
        </div>
      </div>
    </div>
  );
}
