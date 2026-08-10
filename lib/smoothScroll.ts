import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

let registered = false;

/**
 * Smooth in-page anchor navigation, driven by GSAP's own scroll engine
 * instead of CSS `scroll-behavior: smooth`. Nav links to "/#works" etc.
 * need to ease in — but the browser's native smooth-scroll conflicts
 * with ScrollTrigger's scrub/pin/snap on fast scrolls (see globals.css).
 * Routing this through GSAP keeps it on the same render loop, so it
 * never fights the pinned stages.
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
  if (!registered) {
    gsap.registerPlugin(ScrollToPlugin);
    registered = true;
  }

  const header = document.querySelector("header");
  const offset = header ? header.getBoundingClientRect().height : 0;

  gsap.to(window, {
    duration: 1.1,
    ease: "power2.inOut",
    scrollTo: { y: target ?? 0, offsetY: offset },
  });
  window.history.pushState(null, "", href);
}
