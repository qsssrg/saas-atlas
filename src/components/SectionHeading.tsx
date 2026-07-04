/** Reusable eyebrow + serif heading + optional sub-copy block. */
export default function SectionHeading({
  eyebrow,
  heading,
  sub,
}: {
  eyebrow: string;
  heading: string;
  sub?: string;
}) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="display-h2">{heading}</h2>
      {sub ? (
        <p className="mt-3 max-w-[640px] text-[var(--ink-soft)]">{sub}</p>
      ) : null}
    </div>
  );
}
