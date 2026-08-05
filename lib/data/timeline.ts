export type TimelineEntry = {
  year: string;
  title: string;
  description: string;
};

// 2018 is confirmed by the live site. Later milestones are placeholders —
// replace with the company's real history before launch.
export const timeline: TimelineEntry[] = [
  {
    year: "2018",
    title: "DDAM founded",
    description: "Dentsu Data Artist Mongol LLC established in Ulaanbaatar as a subsidiary of Data Artist Inc.",
  },
  {
    year: "2019",
    title: "Team growth",
    description: "Expanded the Mongolian engineering and analytics team to support group company projects. (TBD — confirm details)",
  },
  {
    year: "2021",
    title: "Digital marketing operations",
    description: "Launched performance-based digital marketing support for the Japanese market. (TBD — confirm details)",
  },
  {
    year: "2023",
    title: "AI solutions practice",
    description: "Grew AI module development capabilities across group engagements. (TBD — confirm details)",
  },
  {
    year: "2026",
    title: "50+ specialists",
    description: "Grew to a team of 50+ talented Mongolian specialists across AI, data, and digital marketing. (TBD — confirm details)",
  },
];
