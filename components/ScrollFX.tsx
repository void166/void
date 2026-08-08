"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide scroll effects, alche-style:
 * - accent scroll progress bar
 * - char-stagger reveal on every .display-title
 * - footer outline wordmark drifts horizontally with scroll
 */
export default function ScrollFX() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];

    /* progress bar */
    const bar = document.getElementById("scroll-progress-bar");
    if (bar) {
      tweens.push(
        gsap.to(bar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            start: 0,
            end: "max",
            scrub: 0.3,
          },
        })
      );
    }

    /* char-stagger title reveals */
    document.querySelectorAll<HTMLElement>(".display-title:not([data-split]):not([data-no-split])").forEach((el) => {
      el.setAttribute("data-split", "1");
      const text = el.textContent ?? "";
      el.textContent = "";
      const chars: HTMLElement[] = [];
      for (const word of text.split(/(\s+)/)) {
        if (/^\s+$/.test(word)) {
          el.appendChild(document.createTextNode(" "));
          continue;
        }
        const wordSpan = document.createElement("span");
        wordSpan.className = "split-word";
        for (const ch of word) {
          const c = document.createElement("span");
          c.className = "split-char";
          c.textContent = ch;
          wordSpan.appendChild(c);
          chars.push(c);
        }
        el.appendChild(wordSpan);
      }
      gsap.set(chars, { yPercent: 112 });
      tweens.push(
        gsap.to(chars, {
          yPercent: 0,
          duration: 0.85,
          ease: "power4.out",
          stagger: 0.022,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        })
      );
    });

    /* footer wordmark drift */
    document.querySelectorAll<HTMLElement>(".text-outline").forEach((el) => {
      tweens.push(
        gsap.fromTo(
          el,
          { xPercent: -5 },
          {
            xPercent: 3,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          }
        )
      );
    });

    /* layout settles after fonts load */
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(t);
      tweens.forEach((tw) => {
        tw.scrollTrigger?.kill();
        tw.kill();
      });
      triggers.forEach((tr) => tr.kill());
    };
  }, [pathname]);

  return (
    <div id="scroll-progress" aria-hidden>
      <div id="scroll-progress-bar" />
    </div>
  );
}
