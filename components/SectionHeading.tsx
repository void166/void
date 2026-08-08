export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="eyebrow flex items-center gap-3 text-mist">
        <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
        {eyebrow}
      </div>
      <h2 className="display-title mt-4 text-3xl sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-mist">{description}</p>}
    </div>
  );
}
