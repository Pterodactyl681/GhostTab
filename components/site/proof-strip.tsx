type ProofStripProps = {
  items: string[];
  className?: string;
};

export function ProofStrip({ items, className }: ProofStripProps) {
  return (
    <section
      className={["mx-auto w-full max-w-4xl px-1", className]
        .filter(Boolean)
        .join(" ")}
    >
      <ul className="grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-secondary md:grid-cols-4">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-border/[0.12] bg-surface-2/[0.62] px-2.5 py-2 text-center"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
