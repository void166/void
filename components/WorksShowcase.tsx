"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { works, type Work } from "@/lib/data/works";
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
      queueMicrotask(() => setFallback(true));
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
      queueMicrotask(() => setFallback(true));
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
      /* One resting point per project, evenly spaced — progress k/(N-1) IS
         project k, so no separate snap table to keep in sync.
         `directional: false` settles on the NEAREST project rather than the
         next one in the direction of travel, which is what stops a hard
         fling from carrying you past one. The slow 1s duration is what
         keeps it reading as a settle instead of a yank. */
      snap: {
        snapTo: 1 / segments,
        duration: 1,
        directional: false,
      },
      onUpdate: (self) => {
        apiRef.current?.setProgress(self.progress);
        /* px/sec → roughly -1..1; the scene eases it before use */
        apiRef.current?.setVelocity(
          Math.max(-1, Math.min(1, self.getVelocity() / 3000))
        );
        if (hintRef.current) {
          gsap.set(hintRef.current, { opacity: Math.max(0, 1 - self.progress * 14) });
        }
      },
    });

    /* The copy is driven per-frame off the scene's own eased focus rather
       than off raw scroll progress. The cards are pulled toward whole slots
       inside the scene, so deriving the text independently here would let it
       drift ahead of the card it belongs to. One source of truth. */
    const syncCopy = () => {
      const api = apiRef.current;
      if (!api) return;
      const focus = api.getFocus();
      const i = Math.max(0, Math.min(segments - 1, Math.floor(focus)));
      const tt = shapeSegment(focus - i);

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

      /* which pair of projects the two blocks hold */
      if (i !== lastSegment) {
        lastSegment = i;
        setSegment(i);
      }
      /* rail + counter follow the card that visually dominates */
      const shown = Math.max(0, Math.min(works.length - 1, Math.round(focus)));
      if (shown !== lastShown) {
        lastShown = shown;
        if (indexNumRef.current) {
          indexNumRef.current.textContent = String(shown + 1).padStart(2, "0");
        }
        if (railRef.current) {
          const ticks = railRef.current.children;
          for (let k = 0; k < ticks.length; k++) {
            (ticks[k] as HTMLElement).style.opacity = k === shown ? "1" : "0.28";
          }
        }
      }
    };
    gsap.ticker.add(syncCopy);

    /* arrival: about hands off directly — the stage powers up in place
       (LED wall wakes, card rises from depth) instead of a hard slide-in */
    if (titleCurRef.current) gsap.set(titleCurRef.current, { opacity: 0, y: 70 });
    const arrive = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "top top",
      scrub: true,
      onUpdate: (self) => {
        const a = self.progress;
        apiRef.current?.setArrival(a);
        if (titleCurRef.current) {
          gsap.set(titleCurRef.current, { opacity: a * a, y: (1 - a) * 70 });
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
      gsap.ticker.remove(syncCopy);
      st.kill();
      arrive.kill();
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
      /* one screen of scroll per project, alche's pitch — with N projects the
         pinned stage travels N-1 screens, which lines each snap point up with
         exactly one project */
      style={{ height: `${works.length * 100}svh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden bg-[#020202]">
        {/* WebGL stage */}
        <div ref={canvasHostRef} className="absolute inset-0" />

        {/* readability scrim over the lower stage */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)",
          }}
          aria-hidden
        />

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

        {/* current project meta — alche anchors this at left 8% / bottom 10vh,
            widening to 91% on phones where 70% would wrap badly */}
        <div
          ref={titleCurRef}
          className="absolute bottom-[10svh] left-[4%] w-[91%] will-change-transform md:left-[8%] md:w-[70%]"
        >
          <TextBackdrop />
          <WorkMeta w={cur} linked />
        </div>

        {/* incoming project meta (fades in during transition) */}
        <div
          ref={titleNextRef}
          className="pointer-events-none absolute bottom-[10svh] left-[4%] w-[91%] opacity-0 will-change-transform md:left-[8%] md:w-[70%]"
        >
          <TextBackdrop />
          <WorkMeta w={nxt} />
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

/* feathered backdrop blur that rides with the project text — softens the
   LED wall behind the type without drawing a visible box */
function TextBackdrop() {
  const mask =
    "radial-gradient(90% 95% at 35% 55%, black 40%, transparent 98%)";
  return (
    <div
      className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 backdrop-blur-md"
      style={{
        background: "rgba(2,2,2,0.28)",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      aria-hidden
    />
  );
}

/* One project's copy, in alche's field order: date, title, secondary line,
   then outlined category pills. Only the project in focus links out — the
   incoming block is mid-fade and shouldn't be a click target. */
function WorkMeta({ w, linked = false }: { w: Work; linked?: boolean }) {
  return (
    <>
      <time className="block font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
        {w.year}
      </time>
      <h3 className="display-title mt-2 text-3xl leading-none text-paper sm:text-5xl md:text-6xl" data-no-split>
        {linked ? (
          <Link href={w.href} className="inline-block transition-opacity hover:opacity-80">
            {w.title}
          </Link>
        ) : (
          w.title
        )}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mist">{w.description}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {w.category.split("/").map((c) => (
          <li
            key={c}
            className="rounded-[0.3em] border border-[#777777] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-mist"
          >
            {c.trim()}
          </li>
        ))}
      </ul>
    </>
  );
}
