export type Job = {
  slug: string;
  title: string;
  type: "Full Time" | "Part Time";
  description: string;
};

// Sourced from the current live careers listing.
export const jobs: Job[] = [
  {
    slug: "junior-ai-ml-data-engineer",
    title: "Junior AI/ML/Data Engineer",
    type: "Full Time",
    description:
      "Design a machine learning model for use in the digital marketing industry, develop and run a training model, and conduct testing and analysis of the results.",
  },
  {
    slug: "software-engineer",
    title: "Software Engineer",
    type: "Full Time",
    description:
      "Develop reliable and secure software and systems. Utilize best practices for design and development, create and manage automated tests, and swiftly resolve technical issues.",
  },
  {
    slug: "digital-marketing-report-specialist-full-time",
    title: "Digital Marketing Report Specialist",
    type: "Full Time",
    description:
      "Prepare reports on the results of digital advertising campaigns implemented in the Japanese market. Prepare and submit daily and weekly reports.",
  },
  {
    slug: "digital-marketing-report-specialist-part-time",
    title: "Digital Marketing Report Specialist",
    type: "Part Time",
    description:
      "Prepare reports on the results of digital advertising campaigns implemented in the Japanese market, on a part-time schedule. Prepare and submit daily and weekly reports.",
  },
];

export const benefits = [
  { title: "Global project exposure", description: "Work on live projects for Dentsu group companies around the world." },
  { title: "Mentorship", description: "Learn directly from specialists across the Dentsu network." },
  { title: "Growth-first culture", description: "We invest in development opportunities for every member of the team." },
  { title: "Modern workspace", description: "A comfortable, well-equipped office in the heart of Ulaanbaatar." },
];
