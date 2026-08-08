import Link from "next/link";
import { services } from "@/lib/data/services";

export default function ServiceMatrix() {
  return (
    <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service, i) => (
        <Link
          key={service.slug}
          href={`/services/${service.slug}`}
          className="group flex min-h-56 flex-col bg-ink p-7 transition-colors duration-300 hover:bg-paper"
        >
          <span className="font-mono text-xs tracking-[0.25em] text-fog group-hover:text-black/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-6 text-lg font-black uppercase leading-tight tracking-wide text-paper group-hover:text-black">
            {service.shortName}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mist group-hover:text-black/60">
            {service.tagline}
          </p>
          <span className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-fog transition-colors group-hover:text-black">
            Learn more &rarr;
          </span>
        </Link>
      ))}
    </div>
  );
}
