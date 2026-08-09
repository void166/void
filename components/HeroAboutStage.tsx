"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/lib/data/profile";
import { shapeSegment } from "@/lib/three/worksShowcase";
import { createCrystalHero, type CrystalHeroApi } from "@/lib/three/crystalHero";

/**
 * One continuous pinned stage: the site opens on the hero (glitch wall,
 * HUD, drag-to-rotate) and scrolling never removes the model — the world
 * dissolves around it into the About color fields, curved glass panes
 * orbit in, and the about text takes over. One WebGL scene, one timeline.
 *
 * Scroll map (in svh screens): 1 hero hold → 0.7 dissolve → 2 panel
 * transitions (1.1 each side) ≈ 5 screens total.
 */

const HERO_UNITS = 1.0;
const DISSOLVE_UNITS = 0.7;
const PANEL_UNITS = 1.1;

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
        <>
          <h2 className="display-title text-3xl sm:text-5xl" data-no-split>
            Hi, I&apos;m {profile.name}.
          </h2>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mist sm:mt-3 sm:text-xs">
            {profile.fullName}
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist sm:mt-5 sm:text-base">{profile.bio}</p>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] sm:mt-5 sm:text-[11px]" style={{ color: "var(--panel-accent)" }}>
            {profile.work.role} · {profile.work.company} · {profile.location}
          </div>
          <div className="mt-5 flex gap-8 sm:mt-7 sm:gap-12">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black sm:text-4xl" style={{ color: "var(--panel-accent)" }}>
                  {s.value}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-mist sm:text-[10px]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </>
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
        <>
          <h2 className="display-title text-3xl sm:text-5xl" data-no-split>
            Tools I ship with.
          </h2>
          <div className="mt-5 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 sm:mt-8 sm:gap-y-2.5">
            {profile.stack.map((s, i) => (
              <div key={s.name} className="flex items-baseline gap-2 sm:gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] text-fog">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-paper sm:text-sm">{s.name}</span>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] sm:inline" style={{ color: "var(--panel-accent)" }}>
                  {s.note}
                </span>
              </div>
            ))}
          </div>
        </>
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
        <>
          <h2 className="display-title text-3xl sm:text-5xl" data-no-split>
            Short story, steep curve.
          </h2>
          <ol className="mt-5 space-y-3.5 border-l border-white/20 pl-6 sm:mt-8 sm:space-y-5 sm:pl-8">
            {profile.journey.map((j) => (
              <li key={j.title} className="relative">
                <span
                  className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 sm:-left-[37px]"
                  style={{ background: "var(--panel-accent)" }}
                />
                <div className="font-mono text-[10px] tracking-[0.25em] sm:text-xs" style={{ color: "var(--panel-accent)" }}>
                  {j.year}
                </div>
                <div className="mt-0.5 text-sm font-black uppercase tracking-wide text-paper sm:text-lg">{j.title}</div>
                <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-mist sm:text-sm">{j.text}</p>
              </li>
            ))}
          </ol>
        </>
      ),
    },
  ];
}

export default function HeroAboutStage() {
  const [panels] = useState(buildPanels);
  const sectionRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const quatTextRef = useRef<HTMLDivElement | null>(null);
  const gizmoRef = useRef<HTMLDivElement | null>(null);
  const crosshairVRef = useRef<HTMLDivElement | null>(null);
  const crosshairHRef = useRef<HTMLDivElement | null>(null);
  const coordTextRef = useRef<HTMLDivElement | null>(null);
  const wordCurRef = useRef<HTMLDivElement | null>(null);
  const wordNextRef = useRef<HTMLDivElement | null>(null);
  const aboutUiRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const apiRef = useRef<CrystalHeroApi | null>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [seg, setSeg] = useState(0);
  const [roughness, setRoughness] = useState(0.1);
  const [noiseScale, setNoiseScale] = useState(9.0);
  const [tint, setTint] = useState("#ffffff");

  useEffect(() => {
    if (!reduced && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* flip to the static branch first; the scene mounts there next pass */
      setReduced(true);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    try {
      apiRef.current = createCrystalHero(
        container,
        {
          quatText: quatTextRef.current,
          gizmoGroup: gizmoRef.current,
          crosshairV: crosshairVRef.current,
          crosshairH: crosshairHRef.current,
          coordText: coordTextRef.current,
        },
        panels.map((p, i) => ({
          word: p.word,
          accent: p.accent,
          imageUrl: ["/me.jpg", "/g1.jpg", "/g2.jpg"][i],
        }))
      );
    } catch (err) {
      console.error("[HeroAboutStage] failed to initialize WebGL scene:", err);
      queueMicrotask(() => setFailed(true));
      return;
    }

    if (reduced) {
      /* static hero + stacked about sections — no scroll choreography */
      return () => {
        apiRef.current?.dispose();
        apiRef.current = null;
      };
    }

    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);
    /* phone address bars fire resize as they collapse — don't recalc mid-scroll */
    ScrollTrigger.config({ ignoreMobileResize: true });

    const segments = panels.length - 1;
    const totalUnits = HERO_UNITS + DISSOLVE_UNITS + segments * PANEL_UNITS;
    const heroFrac = HERO_UNITS / totalUnits;
    const dissolveSpan = DISSOLVE_UNITS / PANEL_UNITS;
    let lastSeg = 0;
    const lerpColor = (a: string, b: string, t: number) => gsap.utils.interpolate(a, b, t);

    /* initial states: about layers hidden, hero HUD on */
    panelRefs.current.forEach((el) => {
      if (el) gsap.set(el, { opacity: 0 });
    });
    contentRefs.current.forEach((el) => {
      if (el) gsap.set(el, { pointerEvents: "none" });
    });
    if (aboutUiRef.current) gsap.set(aboutUiRef.current, { opacity: 0 });

    const apply = (p: number) => {
      /* u counts panel-units past the hero: dissolve is [0, dissolveSpan] */
      const u = Math.max(0, (p - heroFrac) / (1 - heroFrac)) * (dissolveSpan + segments);
      const world = smooth(u, 0, dissolveSpan);
      const global = Math.min(0.99999, Math.max(0, u - dissolveSpan));
      const i = Math.min(segments - 1, Math.floor(global));
      const tt = shapeSegment(global - i);
      const a = panels[i];
      const b = panels[Math.min(i + 1, panels.length - 1)];

      const g1 = lerpColor(a.glowA, b.glowA, tt);
      const g2 = lerpColor(a.glowB, b.glowB, tt);
      const ac = lerpColor(a.accent, b.accent, tt);

      /* one call drives the scene: world dissolve + pane ring + glows */
      apiRef.current?.setAbout(world, i + tt, g1, g2);
      rootRef.current?.style.setProperty("--panel-accent", ac);

      /* hero HUD bows out as the about world arrives */
      if (hudRef.current) gsap.set(hudRef.current, { autoAlpha: 1 - world });
      if (aboutUiRef.current) gsap.set(aboutUiRef.current, { opacity: world });

      /* giant word swap — only exists in the about world */
      if (wordCurRef.current) {
        gsap.set(wordCurRef.current, {
          opacity: (1 - smooth(tt, 0.05, 0.4)) * 0.14 * world,
          xPercent: -6 - tt * 10,
        });
      }
      if (wordNextRef.current) {
        gsap.set(wordNextRef.current, {
          opacity: smooth(tt, 0.6, 0.92) * 0.14 * world,
          xPercent: 6 - tt * 10,
        });
      }

      /* text choreography: out left, in from the right, gated by world */
      panelRefs.current.forEach((el, idx) => {
        if (!el) return;
        let opacity = 0;
        let x = 0;
        if (idx === i) {
          opacity = (1 - smooth(tt, 0.12, 0.5)) * world;
          x = -tt * 70;
        } else if (idx === i + 1) {
          opacity = smooth(tt, 0.52, 0.9) * world;
          x = (1 - tt) * 70;
        }
        gsap.set(el, { opacity, x });
        const content = contentRefs.current[idx];
        if (content) {
          const active = world > 0.5 && ((idx === i && tt < 0.5) || (idx === i + 1 && tt >= 0.5));
          gsap.set(content, { pointerEvents: active ? "auto" : "none" });
        }
      });

      if (i !== lastSeg) {
        lastSeg = i;
        setSeg(i);
      }
    };

    apply(0);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });

    return () => {
      st.kill();
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [panels, reduced]);

  const stacked = (
    <>
      {panels.map((p) => (
        <section
          key={p.id}
          className="scroll-mt-20 border-b border-line py-20"
          style={{
            background: `radial-gradient(120% 70% at 15% 0%, ${p.glowA} 0%, transparent 60%), radial-gradient(120% 80% at 90% 100%, ${p.glowB} 0%, transparent 65%), #050505`,
            ["--panel-accent" as string]: p.accent,
          }}
        >
          <div className="container-page">
            <div className="eyebrow mb-6 flex items-center gap-3" style={{ color: p.accent }}>
              <span className="inline-block h-px w-6" style={{ background: p.accent }} aria-hidden />
              {p.eyebrow}
            </div>
            {p.content}
          </div>
        </section>
      ))}
    </>
  );

  if (failed) {
    return (
      <>
        <section className="flex h-[calc(100svh-69px)] min-h-[480px] items-center justify-center bg-[#050505] text-sm text-mist">
          Your browser doesn&apos;t support WebGL. Please try a different browser to view this visual.
        </section>
        <div id="about">{stacked}</div>
      </>
    );
  }

  if (reduced) {
    return (
      <>
        <section className="relative h-[calc(100svh-69px)] min-h-[480px] overflow-hidden bg-[#050505]">
          <div ref={containerRef} className="absolute inset-0" />
        </section>
        <div id="about">{stacked}</div>
      </>
    );
  }

  const cur = panels[seg];
  const nxt = panels[Math.min(seg + 1, panels.length - 1)];

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${(HERO_UNITS + DISSOLVE_UNITS + (panels.length - 1) * PANEL_UNITS) * 100}svh` }}
    >
      <div ref={rootRef} className="sticky top-0 h-svh w-full overflow-hidden bg-[#050505]">
        {/* WebGL stage — hero world, model, and about world all live here */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* CRT scanlines + vignette over the whole stage */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply"
          style={{
            background: "repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.5) 100%)",
          }}
        />

        {/* giant about words (dim outline, above the canvas) */}
        <div
          ref={wordCurRef}
          className="text-outline pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[24vw] font-black uppercase leading-none"
          style={{ opacity: 0 }}
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

        {/* about chrome: scrim + stage label + progress rail */}
        <div ref={aboutUiRef} className="pointer-events-none" style={{ opacity: 0 }}>
          <div
            className="absolute inset-x-0 bottom-0 h-[58%]"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.38) 45%, transparent 100%)" }}
            aria-hidden
          />
          <div className="eyebrow absolute left-6 top-24 flex items-center gap-3 sm:left-10" style={{ color: "var(--panel-accent)" }}>
            <span className="inline-block h-px w-6" style={{ background: "var(--panel-accent)" }} aria-hidden />
            {cur.eyebrow}
          </div>
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 font-mono text-[11px] tracking-[0.25em] sm:flex sm:right-10">
            {panels.map((p, i) => (
              <span key={p.id} style={{ color: i === seg ? p.accent : "rgba(255,255,255,0.25)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>

        {/* about text — clean, bottom-anchored, no boxes */}
        {panels.map((p, idx) => (
          <div
            key={p.id}
            ref={(el) => {
              panelRefs.current[idx] = el;
            }}
            className="pointer-events-none absolute inset-0 flex items-end will-change-transform"
            style={{ opacity: 0 }}
          >
            <div
              ref={(el) => {
                contentRefs.current[idx] = el;
              }}
              className="container-page pointer-events-none pb-14 sm:pb-16"
            >
              {p.content}
            </div>
          </div>
        ))}

        {/* ------- hero HUD (fades out as the about world arrives) ------- */}
        <div ref={hudRef} className="pointer-events-none absolute inset-0">
          {/* static center guides */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
          </div>

          {/* cursor-tracking crosshair */}
          <div
            ref={crosshairVRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-px bg-white/15 opacity-0 transition-opacity duration-300 will-change-transform"
          />
          <div
            ref={crosshairHRef}
            className="pointer-events-none absolute left-0 top-0 h-px w-full bg-white/15 opacity-0 transition-opacity duration-300 will-change-transform"
          />
          <div
            ref={coordTextRef}
            className="pointer-events-none absolute left-0 top-0 font-mono text-[10px] tracking-widest text-white/40 opacity-0 transition-opacity duration-300 will-change-transform"
          >
            X 0.00 Y 0.00
          </div>

          <div className="pointer-events-none absolute left-6 top-24 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="h-3 w-px bg-white/25" />
            ))}
          </div>

          <div className="pointer-events-auto absolute right-6 top-24 hidden text-right sm:block">
            <div className="eyebrow pointer-events-none text-white/30">MainLogo Quaternion</div>
            <div ref={quatTextRef} className="pointer-events-none mt-1 font-mono text-[11px] text-white/40">
              0.00 0.00 0.00 1.00
            </div>
            <div
              ref={gizmoRef}
              className="pointer-events-none mt-4 ml-auto h-14 w-14 rounded-full border border-white/15 transition-transform duration-100"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative h-full w-full">
                <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-y-1/2 bg-white/40" />
                <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 bg-white/40" />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(89,227,255,0.8)]" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => apiRef.current?.resetOrientation()}
              className="eyebrow mt-4 text-white/30 transition-colors hover:text-white/70"
            >
              Reset Quaternion
            </button>
          </div>

          {/* MainLogo Material — live debug panel */}
          <div className="pointer-events-auto absolute bottom-6 left-6 hidden w-64 select-none sm:block">
            <div className="eyebrow pointer-events-none text-white/30">MainLogo Material</div>
            <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-white/40">
              <span className="w-20 shrink-0">roughness</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={roughness}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRoughness(v);
                  apiRef.current?.setRoughness(v);
                }}
                className="h-px w-full cursor-ew-resize appearance-none bg-white/30 accent-white"
              />
              <span className="w-10 shrink-0 text-right text-white/60">{roughness.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-white/40">
              <span className="w-20 shrink-0">noiseScale</span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.1}
                value={noiseScale}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setNoiseScale(v);
                  apiRef.current?.setNoiseScale(v);
                }}
                className="h-px w-full cursor-ew-resize appearance-none bg-white/30 accent-white"
              />
              <span className="w-10 shrink-0 text-right text-white/60">{noiseScale.toFixed(1)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-white/40">
              <span className="w-20 shrink-0">color</span>
              <input
                type="color"
                value={tint}
                onChange={(e) => {
                  setTint(e.target.value);
                  apiRef.current?.setTint(e.target.value);
                }}
                className="h-4 w-4 shrink-0 cursor-pointer border border-white/40 bg-transparent p-0"
              />
              <span className="truncate text-white/60">{tint}</span>
            </div>
          </div>

          <div className="eyebrow pointer-events-none absolute bottom-6 right-6 text-white/30">
            Drag to rotate
          </div>
        </div>
        {/* end hero HUD */}
      </div>

      {/* anchor for /#about — one hero-screen into the stage */}
      <div id="about" className="absolute left-0 top-[100svh]" aria-hidden />
    </section>
  );
}

function smooth(t: number, a: number, b: number) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}
