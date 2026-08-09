"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { works } from "@/lib/data/works";
import { createWorksShowcase, shapeSegment, type WorksApi } from "@/lib/three/worksShowcase";

/**
 * Immersive, pinned project exhibition.
 * DOM handles text/navigation; WebGL handles glass, planes, background.
 * One scroll timeline drives everything — index + local progress.
 *
 * Runs at every viewport size; reduced motion / missing WebGL fall
 * back to an elegant list.
 */
export default function WorksShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const titleCurRef = useRef<HTMLDivElement | null>(null);
  const titleNextRef = useRef<HTMLDivElement | null>(null);
  const indexNumRef = useRef<HTMLSpanElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<WorksApi | null>(null);
  const [segment, setSegment] = useState(0);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.WebGLRenderingContext
    ) {
      setFallback(true);
      return;
    }

    const host = canvasHostRef.current;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!host || !section || !sticky) return;

    try {
      apiRef.current = createWorksShowcase(host, works);
    } catch (err) {
      console.error("[WorksShowcase] WebGL init failed:", err);
      setFallback(true);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const segments = works.length - 1;
    let lastShown = 0;
    let lastSegment = 0;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        apiRef.current?.setProgress(p);

        const global = Math.min(0.99999, p) * segments;
        const i = Math.min(segments - 1, Math.floor(global));
        const tt = shapeSegment(global - i);

        /* DOM choreography mirrors the scene */
        if (titleCurRef.current) {
          gsap.set(titleCurRef.current, {
            opacity: 1 - smooth(tt, 0.08, 0.42),
            y: tt * -46,
            x: tt * -22,
          });
        }
        if (titleNextRef.current) {
          gsap.set(titleNextRef.current, {
            opacity: smooth(tt, 0.58, 0.92),
            y: (1 - tt) * 52,
            x: (1 - tt) * 20,
          });
        }
        if (hintRef.current) {
          gsap.set(hintRef.current, { opacity: Math.max(0, 1 - p * 14) });
        }

        /* text blocks bind to the segment (outgoing = i, incoming = i+1) */
        if (i !== lastSegment) {
          lastSegment = i;
          setSegment(i);
        }
        /* rail + counter show the project that visually dominates */
        const shown = tt > 0.5 ? i + 1 : i;
        if (shown !== lastShown) {
          lastShown = shown;
        }
        if (indexNumRef.current) {
          indexNumRef.current.textContent = String(shown + 1).padStart(2, "0");
        }
        if (railRef.current) {
          const ticks = railRef.current.children;
          for (let k = 0; k < ticks.length; k++) {
            (ticks[k] as HTMLElement).style.opacity = k === shown ? "1" : "0.28";
          }
        }
      },
    });

    /* subtle mouse influence + custom cursor — hover devices only */
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      const rect = sticky.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      apiRef.current?.setPointer(nx, ny);
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          duration: 0.5,
          ease: "power3.out",
        });
      }
    };
    const onLeave = () => {
      apiRef.current?.setPointer(0, 0);
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 0, duration: 0.3 });
    };
    const onEnter = () => {
      if (fine && cursorRef.current) gsap.to(cursorRef.current, { opacity: 1, duration: 0.3 });
    };
    sticky.addEventListener("pointermove", onMove);
    sticky.addEventListener("pointerleave", onLeave);
    sticky.addEventListener("pointerenter", onEnter);

    return () => {
      st.kill();
      sticky.removeEventListener("pointermove", onMove);
      sticky.removeEventListener("pointerleave", onLeave);
      sticky.removeEventListener("pointerenter", onEnter);
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  /* ---------- list fallback: reduced motion / no WebGL ---------- */
  if (fallback) {
    return (
      <section id="works" className="scroll-mt-20 border-b border-line py-24">
        <div className="container-page">
          <div className="eyebrow flex items-center gap-3 text-mist">
            <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
            Selected Works
          </div>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {works.map((w, i) => (
              <a key={w.slug} href={w.href} className="group grid grid-cols-1 gap-4 py-8 sm:grid-cols-[6rem_1fr_16rem]">
                <span className="font-mono text-xs tracking-[0.25em] text-fog">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="display-title block text-2xl text-paper underline-offset-4 group-hover:underline" data-no-split>
                    {w.title}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-mist">{w.description}</span>
                </span>
                <span
                  className="h-24 w-full border border-line sm:h-auto"
                  style={{
                    background: `linear-gradient(135deg, ${w.visual.colC} 0%, ${w.visual.colB} 60%, ${w.visual.colA} 130%)`,
                  }}
                  aria-hidden
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const cur = works[Math.min(segment, works.length - 1)];
  const nxt = works[Math.min(segment + 1, works.length - 1)];

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative"
      style={{ height: `${works.length * 120}svh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden bg-[#020202]">
        {/* WebGL stage */}
        <div ref={canvasHostRef} className="absolute inset-0" />

        {/* ------- DOM overlay ------- */}
        {/* section label — below the sticky site header */}
        <div className="eyebrow pointer-events-none absolute left-6 top-24 flex items-center gap-3 text-mist sm:left-10">
          <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
          Selected Works
        </div>

        {/* big index */}
        <div className="pointer-events-none absolute right-6 top-24 text-right font-mono sm:right-10">
          <span ref={indexNumRef} className="text-3xl font-bold tracking-widest text-paper">
            01
          </span>
          <span className="ml-1 text-xs tracking-[0.25em] text-fog">/ {String(works.length).padStart(2, "0")}</span>
        </div>

        {/* index rail */}
        <div
          ref={railRef}
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 font-mono text-[11px] tracking-[0.25em] text-paper sm:flex sm:right-10"
        >
          {works.map((w, i) => (
            <span key={w.slug} style={{ opacity: i === 0 ? 1 : 0.28 }} className="transition-opacity duration-300">
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>

        {/* current project meta */}
        <div ref={titleCurRef} className="absolute bottom-14 left-6 right-6 max-w-xl will-change-transform sm:bottom-16 sm:left-10 sm:right-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            {cur.category} · {cur.year}
          </div>
          <h3 className="display-title mt-3 text-3xl text-paper sm:text-6xl" data-no-split>
            {cur.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-mist sm:mt-4">{cur.description}</p>
          <MagneticLink href={cur.href} />
        </div>

        {/* incoming project meta (fades in during transition) */}
        <div
          ref={titleNextRef}
          className="pointer-events-none absolute bottom-14 left-6 right-6 max-w-xl opacity-0 will-change-transform sm:bottom-16 sm:left-10 sm:right-auto"
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            {nxt.category} · {nxt.year}
          </div>
          <h3 className="display-title mt-3 text-3xl text-paper sm:text-6xl" data-no-split>
            {nxt.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-mist sm:mt-4">{nxt.description}</p>
        </div>

        {/* scroll hint */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.35em] text-fog"
        >
          SCROLL TO EXPLORE
        </div>

        {/* custom cursor dot */}
        <div
          ref={cursorRef}
          className="pointer-events-none absolute left-0 top-0 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent opacity-0 mix-blend-screen"
          style={{ boxShadow: "0 0 12px rgba(89,227,255,0.65)" }}
          aria-hidden
        />
      </div>
    </section>
  );
}

function smooth(t: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/* View-project link with a subtle magnetic pull */
function MagneticLink({ href }: { href: string }) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * 0.25, y: dy * 0.3, duration: 0.4, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <Link ref={ref} href={href} className="btn-ghost mt-6 inline-block">
      View Project
    </Link>
  );
}
