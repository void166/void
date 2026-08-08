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
    <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
      {network.map((entry, i) => (
        <a
          key={entry.name}
          href={entry.href}
          target={entry.href.startsWith("http") ? "_blank" : undefined}
          rel={entry.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group flex flex-col bg-ink p-7 transition-colors duration-300 hover:bg-paper"
        >
          <span className="font-mono text-xs tracking-[0.25em] text-fog group-hover:text-black/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="mt-5 text-base font-black uppercase tracking-wide text-paper group-hover:text-black">
            {entry.name}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-mist group-hover:text-black/60">{entry.description}</p>
        </a>
      ))}
    </div>
  );
}
