import Link from "next/link";
import type { ReactNode } from "react";
import { services } from "@/lib/data/services";

const icons: Record<string, ReactNode> = {
  "ai-solution-development": (
    <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
  ),
  "data-engineering-analytics": <path d="M4 19V9M12 19V5M20 19v-7M4 19h16" />,
  "poc-rd": <path d="M9 3h6M10 3v5.5L5 19a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 19l-5-10.5V3" />,
  "digital-marketing": <path d="M3 11l18-7-7 18-3-8-8-3z" />,
};

export default function ServiceMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => (
        <Link
          key={service.slug}
          href={`/services/${service.slug}`}
          className="group flex flex-col rounded-2xl border border-line bg-ink-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/60 hover:bg-ink-3 hover:shadow-xl hover:shadow-black/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 transition-transform duration-300 group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {icons[service.slug]}
            </svg>
          </span>
          <h3 className="mt-5 text-lg font-semibold text-paper group-hover:text-brand-300">{service.shortName}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist">{service.tagline}</p>
          <span className="mt-5 flex items-center gap-1 text-xs font-medium text-brand-300 opacity-0 transition-opacity group-hover:opacity-100">
            Learn more <span aria-hidden>&rarr;</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
