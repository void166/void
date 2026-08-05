export type Service = {
  slug: string;
  shortName: string;
  name: string;
  tagline: string;
  valueProp: string;
  problem: string;
  solution: string;
  strengths: string[];
  approach: { title: string; description: string }[];
};

export const services: Service[] = [
  {
    slug: "ai-solution-development",
    shortName: "AI Solutions",
    name: "AI Solution Development",
    tagline: "AI modules and systems built for your business, not off the shelf.",
    valueProp:
      "We design, train, and ship AI modules and system integrations purpose-built for your business problem, backed by Dentsu's global data and delivery network.",
    problem:
      "Off-the-shelf AI tools rarely fit a specific business process, and most teams lack the in-house talent to build, evaluate, and maintain custom models safely.",
    solution:
      "Our engineers and data scientists design custom AI modules end-to-end — from model selection and training to system integration, monitoring, and iteration — so the solution fits your workflow instead of the other way around.",
    strengths: [
      "In-house AI/ML engineering team embedded with Dentsu's global delivery network",
      "Modules designed around your existing systems, not a rip-and-replace",
      "Rigorous evaluation and monitoring before and after go-live",
      "Direct collaboration with mentors and specialists across the Dentsu group",
    ],
    approach: [
      { title: "Discover", description: "Scope the business problem, data availability, and success metrics with your team." },
      { title: "Design", description: "Select the right model architecture and integration points for your systems." },
      { title: "Build & Train", description: "Develop, train, and test the module against real-world data." },
      { title: "Deploy & Monitor", description: "Ship into production with monitoring and a plan for iteration." },
    ],
  },
  {
    slug: "data-engineering-analytics",
    shortName: "Data & Analytics",
    name: "Data Engineering & Analytics",
    tagline: "Data is strongest when it's connected.",
    valueProp:
      "We collect, cleanse, structure, and analyze your data so decisions are made on evidence, not intuition — with pipelines built to scale as your business grows.",
    problem:
      "Business data is often scattered across systems, inconsistently structured, and too slow to turn into a decision — by the time a report is ready, the moment has passed.",
    solution:
      "We build the data infrastructure and analysis layer that connects your sources, enforces quality, and surfaces insight quickly, so data-driven decisions become routine rather than a special project.",
    strengths: [
      "End-to-end pipeline design: collection, cleansing, structuring, analysis",
      "Experience supporting group companies and global clients on live data systems",
      "Dashboards and reporting built for the people who actually make decisions",
      "Scales from a single campaign report to enterprise data infrastructure",
    ],
    approach: [
      { title: "Audit", description: "Map your existing data sources, gaps, and quality issues." },
      { title: "Engineer", description: "Build collection and cleansing pipelines into a structured data layer." },
      { title: "Analyze", description: "Turn structured data into models, dashboards, and reporting." },
      { title: "Operate", description: "Maintain and evolve the pipeline as your data and questions grow." },
    ],
  },
  {
    slug: "poc-rd",
    shortName: "PoC & R&D",
    name: "Proof of Concept (PoC) & R&D",
    tagline: "Validate the hypothesis before you bet the budget.",
    valueProp:
      "If you want to optimize your business with AI and need to validate a hypothesis, we deliver a focused, cost-effective Proof of Concept right on time.",
    problem:
      "Committing to a full AI or data build-out on an unproven hypothesis is expensive and slow — and most ideas need to be tested before they deserve that investment.",
    solution:
      "We run lean, high-speed proof-of-concept engagements that test your hypothesis against real data and real constraints, giving you a clear go/no-go before you commit further budget.",
    strengths: [
      "High-speed, cost-effective PoC delivery model",
      "Direct access to R&D talent across AI, data, and systems",
      "Clear, decision-ready outputs — not just a research memo",
      "A natural on-ramp into full AI Solution Development or Data Engineering engagements",
    ],
    approach: [
      { title: "Define", description: "Frame the hypothesis and the evidence that would prove or disprove it." },
      { title: "Prototype", description: "Build the smallest system that can test the hypothesis honestly." },
      { title: "Evaluate", description: "Measure results against the original business question." },
      { title: "Recommend", description: "Deliver a clear go/no-go and a path to full-scale delivery." },
    ],
  },
  {
    slug: "digital-marketing",
    shortName: "Digital Marketing",
    name: "Digital Marketing",
    tagline: "Performance-driven campaigns for the Japanese market.",
    valueProp:
      "We support performance-based digital marketing campaigns in the Japanese market, providing value by solving client challenges on the platforms that matter to their audience.",
    problem:
      "Running performance campaigns in the Japanese market requires local platform expertise, careful reporting discipline, and fast iteration — hard to staff consistently in-house.",
    solution:
      "Our digital marketing operations team plans, runs, and reports on campaigns across major platforms, leveraging Dentsu's regional expertise to keep performance accountable and improving.",
    strengths: [
      "Deep operating experience in the Japanese digital advertising market",
      "Disciplined daily and weekly performance reporting",
      "Backed by Dentsu's regional platform relationships and expertise",
      "Tight feedback loop between data analysis and campaign optimization",
    ],
    approach: [
      { title: "Plan", description: "Set targets, platforms, and measurement framework with your team." },
      { title: "Launch", description: "Stand up and run campaigns across the agreed platforms." },
      { title: "Report", description: "Deliver disciplined daily/weekly performance reporting." },
      { title: "Optimize", description: "Iterate on targeting, creative, and spend based on results." },
    ],
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}
