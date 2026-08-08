"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data/profile";
import { shapeSegment } from "@/lib/three/worksShowcase";

/**
 * Pinned deck of full-screen panels that switch with works-style
 * choreography. Each panel owns a color world — the background
 * gradient morphs between them as you scroll.
 */

type Panel = {
  id: string;
  eyebrow: string;
  word: string;
  accent: string;
  glowA: string;
  glowB: string;
  content: ReactNode;
};

function buildPanels(): Panel[] {
  return [
    {
      id: "about",
      eyebrow: "About",
      word: "ABOUT",
      accent: "#a06bff",
      glowA: "#2a0b52",
      glowB: "#0b0322",
      content: (
        <div className="grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <h2 className="display-title text-4xl sm:text-6xl" data-no-split>
              Hi, I&apos;m {profile.name}.
            </h2>
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-mist">
              {profile.fullName}
            </div>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg">{profile.bio}</p>
            <div className="mt-10 grid grid-cols-3 gap-px border border-white/15 bg-white/15">
              {profile.stats.map((s) => (
                <div key={s.label} className="bg-black/40 p-5 backdrop-blur-sm">
                  <div className="text-3xl font-black" style={{ color: "var(--panel-accent)" }}>
                    {s.value}
                  </div>
                  <div className="eyebrow mt-2 text-mist">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* current status card */}
          <div className="border border-white/15 bg-black/40 backdrop-blur-sm">
            {[
              { k: "Currently", v: profile.work.role, sub: `${profile.work.company} · ${profile.work.since}` },
              { k: "Education", v: profile.education.degree, sub: `${profile.education.school} · ${profile.education.years}` },
              { k: "Base", v: profile.location, sub: "Working across time zones" },
              { k: "Email", v: profile.email, sub: "Always open to interesting problems" },
            ].map((row) => (
              <div key={row.k} className="border-b border-white/10 p-5 last:border-0">
                <div className="eyebrow" style={{ color: "var(--panel-accent)" }}>
                  {row.k}
                </div>
                <div className="mt-1.5 font-bold text-paper">{row.v}</div>
                <div className="mt-0.5 font-mono text-[11px] tracking-[0.05em] text-mist">{row.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "stack",
      eyebrow: "Stack",
      word: "STACK",
      accent: "#b6ff4d",
      glowA: "#1d3a05",
      glowB: "#071203",
      content: (
        <div className="w-full max-w-3xl">
          <h2 className="display-title text-4xl sm:text-6xl" data-no-split>
            Tools I ship with.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-px border border-white/15 bg-white/15 sm:grid-cols-2">
            {profile.stack.map((s, i) => (
              <div key={s.name} className="group flex items-baseline justify-between gap-4 bg-black/40 px-5 py-4 backdrop-blur-sm">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-fog">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bold uppercase tracking-wide text-paper">{s.name}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--panel-accent)" }}>
                  {s.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "journey",
      eyebrow: "Journey",
      word: "PATH",
      accent: "#ff9e4d",
      glowA: "#43210a",
      glowB: "#120702",
      content: (
        <div className="max-w-3xl">
          <h2 className="display-title text-4xl sm:text-6xl" data-no-split>
            Short story, steep curve.
          </h2>
          <ol className="mt-10 space-y-6 border-l border-white/20 pl-8">
            {profile.journey.map((j) => (
              <li key={j.title} className="relative">
                <span
                  className="absolute -left-[37px] top-1.5 h-2.5 w-2.5"
                  style={{ background: "var(--panel-accent)" }}
                />
                <div className="font-mono text-xs tracking-[0.25em]" style={{ color: "var(--panel-accent)" }}>
                  {j.year}
                </div>
                <div className="mt-1 text-lg font-black uppercase tracking-wide text-paper">{j.title}</div>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-mist">{j.text}</p>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
  ];
}

export default function SectionDeck() {
  const panels = useRef(buildPanels()).current;
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const wordCurRef = useRef<HTMLDivElement | null>(null);
  const wordNextRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [seg, setSeg] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);
    const segments = panels.length - 1;
    let lastSeg = 0;
    const lerpColor = (a: string, b: string, t: number) => gsap.utils.interpolate(a, b, t);

    /* initial panel states */
    panelRefs.current.forEach((el, idx) => {
      if (el) gsap.set(el, { opacity: idx === 0 ? 1 : 0, y: idx === 0 ? 0 : 90 });
    });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const global = Math.min(0.99999, self.progress) * segments;
        const i = Math.min(segments - 1, Math.floor(global));
        const tt = shapeSegment(global - i);
        const a = panels[i];
        const b = panels[Math.min(i + 1, panels.length - 1)];

        /* morph the color world */
        if (bgRef.current) {
          const g1 = lerpColor(a.glowA, b.glowA, tt);
          const g2 = lerpColor(a.glowB, b.glowB, tt);
          const ac = lerpColor(a.accent, b.accent, tt);
          bgRef.current.style.background = `radial-gradient(90% 80% at 18% 12%, ${g1} 0%, transparent 60%), radial-gradient(100% 90% at 85% 88%, ${g2} 0%, transparent 65%), #050505`;
          bgRef.current.style.setProperty("--panel-accent", ac);
        }

        /* giant word swap */
        if (wordCurRef.current) {
          gsap.set(wordCurRef.current, {
            opacity: (1 - smooth(tt, 0.05, 0.4)) * 0.16,
            xPercent: -6 - tt * 10,
          });
        }
        if (wordNextRef.current) {
          gsap.set(wordNextRef.current, {
            opacity: smooth(tt, 0.6, 0.92) * 0.16,
            xPercent: 6 - tt * 10,
          });
        }

        /* panel choreography */
        panelRefs.current.forEach((el, idx) => {
          if (!el) return;
          if (idx === i) {
            gsap.set(el, {
              opacity: 1 - smooth(tt, 0.15, 0.55),
              y: -tt * 80,
              scale: 1 + tt * 0.04,
              pointerEvents: tt < 0.5 ? "auto" : "none",
            });
          } else if (idx === i + 1) {
            gsap.set(el, {
              opacity: smooth(tt, 0.5, 0.88),
              y: (1 - tt) * 90,
              scale: 0.96 + tt * 0.04,
              pointerEvents: tt >= 0.5 ? "auto" : "none",
            });
          } else {
            gsap.set(el, { opacity: 0, pointerEvents: "none" });
          }
        });

        if (i !== lastSeg) {
          lastSeg = i;
          setSeg(i);
        }
      },
    });

    return () => st.kill();
  }, [panels]);

  /* reduced motion: plain stacked sections */
  if (reduced) {
    return (
      <>
        {panels.map((p) => (
          <section key={p.id} id={p.id} className="border-b border-line py-24 scroll-mt-20">
            <div className="container-page">{p.content}</div>
          </section>
        ))}
      </>
    );
  }

  const cur = panels[seg];
  const nxt = panels[Math.min(seg + 1, panels.length - 1)];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative"
      style={{ height: `${panels.length * 110}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* morphing color world */}
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{ background: "#050505", ["--panel-accent" as string]: panels[0].accent }}
        >
          {/* giant backdrop words */}
          <div
            ref={wordCurRef}
            className="text-outline pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[24vw] font-black uppercase leading-none"
            style={{ opacity: 0.16 }}
          >
            {cur.word}
          </div>
          <div
            ref={wordNextRef}
            className="text-outline pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[24vw] font-black uppercase leading-none"
            style={{ opacity: 0 }}
          >
            {nxt.word}
          </div>

          {/* panels */}
          {panels.map((p, idx) => (
            <div
              key={p.id}
              ref={(el) => {
                panelRefs.current[idx] = el;
              }}
              className="absolute inset-0 flex items-center will-change-transform"
            >
              <div className="container-page pt-16">
                <div className="eyebrow flex items-center gap-3" style={{ color: p.accent }}>
                  <span className="inline-block h-px w-6" style={{ background: p.accent }} aria-hidden />
                  {p.eyebrow}
                </div>
                <div className="mt-6">{p.content}</div>
              </div>
            </div>
          ))}

          {/* deck progress */}
          <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 font-mono text-[11px] tracking-[0.25em] sm:flex sm:right-10">
            {panels.map((p, i) => (
              <span key={p.id} style={{ color: i === seg ? p.accent : "rgba(255,255,255,0.25)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function smooth(t: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}
