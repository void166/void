export default function LogoBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-9 w-9 rounded-lg" : "h-10 w-10 rounded-xl";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span className={`relative flex ${dims} shrink-0 items-center justify-center overflow-hidden`}>
      {/* color backdrop the glass layer blurs against */}
      <span className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700" />
      <span className="absolute -inset-2 bg-gradient-to-tr from-brand-300/60 via-transparent to-white/40 blur-md" />

      {/* frosted glass surface */}
      <span
        className={`absolute inset-0 border border-white/25 bg-white/10 backdrop-blur-md ${dims.split(" ")[2]}`}
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -6px 10px rgba(0,0,0,0.15), 0 4px 14px rgba(0,0,0,0.35)",
        }}
      />

      <span className={`relative font-mono ${textSize} font-bold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]`}>
        DD
      </span>
    </span>
  );
}
