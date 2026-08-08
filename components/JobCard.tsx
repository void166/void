import type { Job } from "@/lib/data/jobs";

export default function JobCard({ job, index }: { job: Job; index: number }) {
  return (
    <div className="card-line p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs tracking-[0.25em] text-fog">{String(index + 1).padStart(2, "0")}</div>
          <h3 className="mt-3 text-lg font-black uppercase tracking-wide text-paper">{job.title}</h3>
        </div>
        <span className="eyebrow shrink-0 border border-line px-3 py-1 text-mist">{job.type}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-mist">{job.description}</p>
    </div>
  );
}
