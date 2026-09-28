"use client";

import { useEffect } from "react";
import { createSmoothScroll } from "@/lib/smoothScroll";

/**
 * Owns the site-wide Lenis instance. Renders nothing — it exists so the
 * scroll engine's lifetime is tied to the React tree (and so it starts
 * once, before any pinned section builds its ScrollTrigger).
 */
export default function SmoothScroll() {
  useEffect(() => createSmoothScroll(), []);
  return null;
}
