const network = [
  {
    name: "Dentsu Group",
    description: "One of the world's largest marketing and communications groups, connecting DDAM to a global client base.",
    href: "https://www.dentsu.com",
  },
  {
    name: "Data Artist Inc.",
    description: "DDAM's parent company, specializing in data-driven marketing solutions across the Dentsu network.",
    href: "#",
  },
  {
    name: "Dentsu Digital",
    description: "A key partner in digital transformation and marketing technology across the group.",
    href: "#",
  },
];

export default function GroupNetworkSection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {network.map((entry) => (
        <a
          key={entry.name}
          href={entry.href}
          target={entry.href.startsWith("http") ? "_blank" : undefined}
          rel={entry.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex flex-col rounded-2xl border border-line bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-ink-3 hover:shadow-xl hover:shadow-black/30"
        >
          <div className="text-base font-semibold text-paper">{entry.name}</div>
          <p className="mt-2 text-sm leading-relaxed text-mist">{entry.description}</p>
        </a>
      ))}
    </div>
  );
}
