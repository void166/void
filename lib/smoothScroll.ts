import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;

/**
 * Site-wide smooth scrolling, Lenis-style.
 *
 * Lenis intercepts wheel/key input and eases `window.scrollY` toward the
 * target on its own rAF loop, so the page glides with weight instead of
 * stepping. Everything else on the site — the pinned WebGL stages, the
 * progress bar, the section rail — reads that already-smoothed position
 * 1:1, which keeps ONE smoothing layer in the whole system. Stacking a
 * second ease on top (a per-frame lerp inside a scene, say) is what makes
 * a fast scroll look like it skipped a section: the DOM lands instantly
 * while the scene is still catching up.
 *
 * ScrollTrigger has to be driven from Lenis's clock, not the browser's:
 * `lenis.raf` runs inside gsap's ticker and each Lenis scroll event pumps
 * `ScrollTrigger.update()`, so scrub and pin resolve against the same
 * frame Lenis just wrote. lagSmoothing is off because gsap's frame-skip
 * recovery would fight Lenis's own delta handling.
 *
 * Returns a teardown for the React effect that owns it.
 */
export function createSmoothScroll(): () => void {
  if (typeof window === "undefined") return () => {};
  /* reduced motion keeps the browser's native, instant scroll */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  gsap.registerPlugin(ScrollTrigger);

  lenis = new Lenis({
    /* Exponential catch-up per frame — this is the weight of the glide, and
       the one number worth tuning. 0.1 is Lenis's default and reads close to
       native; 0.065 lets the page coast after the wheel stops, which is the
       heavier, studio-site feel. Below ~0.05 it starts reading as lag. */
    lerp: 0.065,
    wheelMultiplier: 1,
    /* touch keeps the platform's own momentum: iOS/Android already do this
       well, and syncing it would fight the hero's drag-to-rotate gesture
       (which relies on `touch-action: pan-y`). */
    syncTouch: false,
  });

  const onScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onScroll);

  const raf = (time: number) => {
    /* gsap ticker reports seconds, Lenis wants milliseconds */
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis?.destroy();
    lenis = null;
  };
}

/**
 * Smooth in-page anchor navigation. Routed through the live Lenis
 * instance so a nav click shares the same easing — and the same render
 * loop — as a wheel scroll, instead of racing it.
 */
export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (typeof window === "undefined") return;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return; // not a hash link — let Next.js navigate normally

  const path = href.slice(0, hashIndex) || "/";
  if (window.location.pathname !== path) return; // different page — full navigation

  const id = href.slice(hashIndex + 1);
  const target = id ? document.getElementById(id) : null;
  if (id && !target) return; // unknown anchor — fall back to default behavior

  e.preventDefault();

  /* land the section below the sticky header rather than under it */
  const header = document.querySelector("header");
  const offset = header ? header.getBoundingClientRect().height : 0;

  if (lenis) {
    lenis.scrollTo(target ?? 0, { offset: -offset, duration: 1.4 });
  } else {
    /* reduced motion — jump straight there */
    const y = target ? target.getBoundingClientRect().top + window.scrollY - offset : 0;
    window.scrollTo(0, y);
  }

  window.history.pushState(null, "", href);
}
