"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "@/lib/data/profile";

/** Full-screen closing section: color burst + huge type + magnetic email. */
export default function ContactFinale() {
  const emailRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    /* magnetic pull is a hover effect — on touch it just makes the button
       jump around under a scrolling finger */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = emailRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.2,
        y: (e.clientY - (r.top + r.height / 2)) * 0.3,
        duration: 0.4,
        ease: "power3.out",
      });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section
      id="contact"
      className="relative flex min-h-svh scroll-mt-20 flex-col items-center justify-center overflow-hidden py-24"
      style={{
        background:
          "radial-gradient(80% 70% at 15% 20%, #14434d 0%, transparent 60%), radial-gradient(90% 80% at 85% 85%, #3d0b33 0%, transparent 65%), #050505",
      }}
    >
      {/* backdrop word */}
      <div
        className="text-outline pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[26vw] font-black uppercase leading-none opacity-[0.14]"
        aria-hidden
      >
        HELLO
      </div>

      <div className="container-page relative text-center">
        <div className="eyebrow flex items-center justify-center gap-3 text-accent">
          <span className="inline-block h-px w-6 bg-accent" aria-hidden />
          {profile.availability}
          <span className="inline-block h-px w-6 bg-accent" aria-hidden />
        </div>
        <h2 className="display-title mx-auto mt-6 max-w-4xl text-5xl sm:text-7xl">
          Let&apos;s build something together.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist">
          Have an idea, a product, or a weird experiment that needs a developer who cares about the
          details? My inbox is open.
        </p>

        <a
          ref={emailRef}
          href={`mailto:${profile.email}`}
          className="btn-solid mt-10 inline-block !px-10 !py-4 text-sm"
        >
          {profile.email}
        </a>

        <div className="mt-12 flex items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em]">
          {profile.socials.map((s) => (
            <a key={s.label} href={s.href} className="text-mist transition-colors hover:text-accent">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
