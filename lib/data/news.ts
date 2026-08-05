// Placeholder news/press items — replace with real posts before launch.
export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  category: "Press Release" | "Event" | "Insight";
  excerpt: string;
};

export const news: NewsItem[] = [
  {
    slug: "ddam-website-relaunch",
    title: "DDAM relaunches its website",
    date: "2026-08-01",
    category: "Press Release",
    excerpt: "Dentsu Data Artist Mongol unveils a new website reflecting its growing AI, data, and digital marketing practice.",
  },
  {
    slug: "ai-solutions-practice-update",
    title: "Expanding our AI Solutions practice",
    date: "2026-06-15",
    category: "Insight",
    excerpt: "A look at how DDAM's AI Solutions team is building custom modules for group companies across the Dentsu network. (TBD — replace with real update)",
  },
  {
    slug: "digital-marketing-japan-results",
    title: "Performance marketing results in the Japanese market",
    date: "2026-04-02",
    category: "Insight",
    excerpt: "How our Digital Marketing Operation team drives performance for clients across major platforms. (TBD — replace with real update)",
  },
  {
    slug: "ddam-team-milestone",
    title: "DDAM reaches 50+ specialists",
    date: "2026-01-20",
    category: "Press Release",
    excerpt: "DDAM's Mongolian team continues to grow, now supporting group companies around the globe. (TBD — replace with real update)",
  },
];
