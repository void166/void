export default function LogoBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <span
      className={`relative flex ${dims} shrink-0 items-center justify-center border border-line-strong bg-ink`}
    >
      {/* corner tick, instrument-panel style */}
      <span className="absolute left-0.5 top-0.5 h-1 w-px bg-white/40" />
      <span className="absolute left-0.5 top-0.5 h-px w-1 bg-white/40" />
      <span className={`font-mono ${textSize} font-bold tracking-widest text-paper`}>
        DD
      </span>
    </span>
  );
}
