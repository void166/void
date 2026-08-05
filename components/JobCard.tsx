import type { Job } from "@/lib/data/jobs";

export default function JobCard({ job, index }: { job: Job; index: number }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-2 p-6 transition-colors duration-300 hover:border-line-strong">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-fog">{String(index + 1).padStart(2, "0")}</div>
          <h3 className="mt-2 text-lg font-semibold text-paper">{job.title}</h3>
        </div>
        <span className="eyebrow shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-brand-300">{job.type}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-mist">{job.description}</p>
    </div>
  );
}
