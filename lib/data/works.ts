// Portfolio works — titles/categories/descriptions are editable copy.
// `media` is the real project footage (video or animated image) shown in the
// showcase; `visual` still drives the procedural art used as the loading
// state and the reduced-motion list fallback.
export type Work = {
  slug: string;
  title: string;
  category: string;
  year: string;
  description: string;
  href: string;
  media?: {
    type: "video" | "image";
    src: string;
  };
  visual: {
    pattern: 0 | 1 | 2 | 3 | 4;
    seed: number;
    colA: string; // primary glow
    colB: string; // secondary
    colC: string; // deep base
  };
};

export const works: Work[] = [
  {
    slug: "dental-blu",
    title: "Dental Blu",
    category: "Healthcare / Web",
    year: "2026",
    description:
      "A clinic experience built on calm — clean typography, soft motion, and a booking flow that feels effortless.",
    href: "#",
    media: { type: "video", src: "/works/dentalblu.mp4" },
    visual: { pattern: 0, seed: 11.3, colA: "#59e3ff", colB: "#1b4fff", colC: "#030b18" },
  },
  {
    slug: "innovation-studio",
    title: "Innovation Studio",
    category: "Web Experience",
    year: "2026",
    description:
      "A studio site concept where every scroll beat lands with cinematic pacing and layered depth.",
    href: "#",
    media: { type: "video", src: "/works/innovation-studio.mp4" },
    visual: { pattern: 1, seed: 4.7, colA: "#ff4fd8", colB: "#7b2bff", colC: "#12031c" },
  },
  {
    slug: "ev-showcase",
    title: "EV Showcase",
    category: "Product Film / Web",
    year: "2025",
    description:
      "A white-on-white electric vehicle presentation — studio lighting and product motion built for the web.",
    href: "#",
    media: { type: "video", src: "/works/ev-showcase.mp4" },
    visual: { pattern: 3, seed: 27.1, colA: "#ffb35e", colB: "#ff5e3a", colC: "#170803" },
  },
  {
    slug: "sparkform-creative",
    title: "Sparkform Creative",
    category: "Brand / Web",
    year: "2025",
    description:
      "A creative-agency identity in motion — bold forms, kinetic type, and a palette that sparks.",
    href: "#",
    media: { type: "video", src: "/works/sparkform-creative.mp4" },
    visual: { pattern: 2, seed: 8.9, colA: "#7dffb0", colB: "#00c26e", colC: "#02120a" },
  },
];
