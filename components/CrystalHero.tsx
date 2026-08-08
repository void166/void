"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createCrystalHero, type CrystalHeroApi } from "@/lib/three/crystalHero";

export default function CrystalHero() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quatTextRef = useRef<HTMLDivElement | null>(null);
  const gizmoRef = useRef<HTMLDivElement | null>(null);
  const crosshairVRef = useRef<HTMLDivElement | null>(null);
  const crosshairHRef = useRef<HTMLDivElement | null>(null);
  const coordTextRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<CrystalHeroApi | null>(null);
  const [failed, setFailed] = useState(false);
  const [roughness, setRoughness] = useState(0.1);
  const [noiseScale, setNoiseScale] = useState(9.0);
  const [tint, setTint] = useState("#ffffff");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      apiRef.current = createCrystalHero(container, {
        quatText: quatTextRef.current,
        gizmoGroup: gizmoRef.current,
        crosshairV: crosshairVRef.current,
        crosshairH: crosshairHRef.current,
        coordText: coordTextRef.current,
      });
    } catch (err) {
      console.error("[CrystalHero] failed to initialize WebGL scene:", err);
      queueMicrotask(() => setFailed(true));
    }

    /* scroll-linked: 3D scene reacts + HUD fades as the hero leaves the viewport */
    let st: ScrollTrigger | undefined;
    const root = rootRef.current;
    if (root && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.registerPlugin(ScrollTrigger);
      st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom top",
        scrub: 0.4,
        onUpdate: (self) => {
          apiRef.current?.setScroll(self.progress);
          if (hudRef.current) {
            gsap.set(hudRef.current, {
              opacity: Math.max(0, 1 - self.progress * 1.6),
            });
          }
        },
      });
    }

    return () => {
      st?.kill();
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050505] text-sm text-mist">
        Your browser doesn&apos;t support WebGL. Please try a different browser to view this visual.
      </div>
    );
  }

  const tintRgb = (() => {
    const n = parseInt(tint.slice(1), 16);
    return `{r: ${(n >> 16) & 255}, g: ${(n >> 8) & 255}, b: ${n & 255}}`;
  })();

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#050505]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* CRT scanlines over the whole stage */}
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

      {/* HUD group — fades out as the hero scrolls away */}
      <div ref={hudRef} className="pointer-events-none absolute inset-0">

      {/* static center guides — faint stage alignment */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
      </div>

      {/* cursor-tracking crosshair — the mouse is always visible on the HUD */}
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

      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="h-3 w-px bg-white/25" />
        ))}
      </div>

      <div className="pointer-events-auto absolute right-6 top-6 text-right">
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

      {/* MainLogo Material — live debug panel, alche-style */}
      <div className="pointer-events-auto absolute bottom-6 left-6 w-64 select-none">
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
          <span className="truncate text-white/60">{tintRgb}</span>
        </div>
      </div>

      <div className="eyebrow pointer-events-none absolute bottom-6 right-6 text-white/30">
        Drag to rotate
      </div>

      </div>
      {/* end HUD group */}
    </div>
  );
}
