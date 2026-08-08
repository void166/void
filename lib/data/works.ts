// Portfolio works — swap these placeholders with your real projects.
// `visual` drives the procedural WebGL art: pattern 0-4, seed, and a 3-color palette.
export type Work = {
  slug: string;
  title: string;
  category: string;
  year: string;
  description: string;
  href: string;
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
    slug: "neon-transit",
    title: "Neon Transit",
    category: "Interactive Installation",
    year: "2026",
    description:
      "A realtime data sculpture translating Ulaanbaatar's transit pulse into flowing ribbons of light.",
    href: "#",
    visual: { pattern: 0, seed: 11.3, colA: "#59e3ff", colB: "#1b4fff", colC: "#030b18" },
  },
  {
    slug: "wearscape",
    title: "Wearscape",
    category: "Fashion Metaverse",
    year: "2026",
    description:
      "A next-generation fashion metaverse where garments exist as living, evolving digital material.",
    href: "#",
    visual: { pattern: 1, seed: 4.7, colA: "#ff4fd8", colB: "#7b2bff", colC: "#12031c" },
  },
  {
    slug: "signal-bloom",
    title: "Signal Bloom",
    category: "Data Art / Visualization",
    year: "2025",
    description:
      "Interference patterns grown from a year of campaign telemetry, rendered as generative print & motion.",
    href: "#",
    visual: { pattern: 3, seed: 27.1, colA: "#ffb35e", colB: "#ff5e3a", colC: "#170803" },
  },
  {
    slug: "grid-oracle",
    title: "Grid Oracle",
    category: "AI Product",
    year: "2025",
    description:
      "A forecasting interface where model attention becomes a navigable field of glowing cells.",
    href: "#",
    visual: { pattern: 2, seed: 8.9, colA: "#7dffb0", colB: "#00c26e", colC: "#02120a" },
  },
  {
    slug: "mono-archive",
    title: "Mono Archive",
    category: "Editorial / Archive",
    year: "2024",
    description:
      "A monochrome editorial system for a decade of studio work — quiet, structural, typographic.",
    href: "#",
    visual: { pattern: 4, seed: 51.2, colA: "#f2f2f2", colB: "#8a8a8a", colC: "#060606" },
  },
];
