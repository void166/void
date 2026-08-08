"use client";

import { useEffect, useRef, useState } from "react";
import { createCrystalHero, type CrystalHeroApi } from "@/lib/three/crystalHero";

export default function CrystalHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quatTextRef = useRef<HTMLDivElement | null>(null);
  const gizmoRef = useRef<HTMLDivElement | null>(null);
  const crosshairVRef = useRef<HTMLDivElement | null>(null);
  const crosshairHRef = useRef<HTMLDivElement | null>(null);
  const coordTextRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<CrystalHeroApi | null>(null);
  const [failed, setFailed] = useState(false);

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

    return () => {
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050505]">
      <div ref={containerRef} className="absolute inset-0" />

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

      <div className="absolute right-6 top-6 text-right">
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
            <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-y-1/2 bg-red-400/60" />
            <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 bg-emerald-400/60" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/70" />
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

      <div className="eyebrow pointer-events-none absolute bottom-6 left-6 text-white/30">
        Drag to rotate
      </div>
    </div>
  );
}
