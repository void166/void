"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createCrystalHero, type CrystalHeroApi } from "@/lib/three/crystalHero";
import { news } from "@/lib/data/news";

export default function CrystalHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quatTextRef = useRef<HTMLDivElement | null>(null);
  const gizmoRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<CrystalHeroApi | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      apiRef.current = createCrystalHero(container, {
        quatText: quatTextRef.current,
        gizmoGroup: gizmoRef.current,
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

  const latestNews = news.slice(0, 2);

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

      {/* HUD guides — decorative only */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 border border-white" />
      </div>

      {/* left scroll indicator */}
      <div className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <span className="eyebrow rotate-180 text-white/40 [writing-mode:vertical-rl]">TOP</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`w-px bg-white/25 ${i % 2 === 0 ? "h-4" : "h-2"}`} />
        ))}
      </div>

      {/* right HUD: quaternion + gizmo + reset */}
      <div className="absolute right-6 top-6 text-right">
        <div className="eyebrow text-white/35">MainLogo Quaternion</div>
        <div ref={quatTextRef} className="mt-1 font-mono text-[11px] text-white/45">
          0.00 0.00 0.00 1.00
        </div>
        <div
          ref={gizmoRef}
          className="ml-auto mt-4 h-14 w-14 rounded-full border border-white/15 transition-transform duration-100"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="relative h-full w-full">
            <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-y-1/2 bg-red-400/70" />
            <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 bg-emerald-400/70" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300/80" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => apiRef.current?.resetOrientation()}
          className="eyebrow mt-4 text-white/40 transition-colors hover:text-white/80"
        >
          Reset Quaternion
        </button>
      </div>

      {/* bottom-right news feed */}
      <div className="absolute bottom-8 right-6 hidden max-w-sm text-left sm:block">
        <div className="eyebrow text-white/50">News</div>
        <ul className="mt-3 space-y-3">
          {latestNews.map((item) => (
            <li key={item.slug}>
              <Link href="/news" className="group block">
                <div className="font-mono text-[11px] text-white/35">
                  {item.date.replaceAll("-", " ")}
                </div>
                <div className="mt-0.5 text-sm leading-snug text-white/80 transition-colors group-hover:text-white">
                  {item.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="eyebrow pointer-events-none absolute bottom-8 left-6 text-white/30">
        Move to explore
      </div>
    </div>
  );
}
