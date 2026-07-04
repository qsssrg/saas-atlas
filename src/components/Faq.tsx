"use client";

import { useRef } from "react";

export type FaqItem = { q: string; a: string };

/** Accordion with single-open behaviour: opening one closes the others. */
export default function Faq({ items }: { items: FaqItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const target = e.currentTarget;
    if (!target.open || !wrapRef.current) return;
    wrapRef.current
      .querySelectorAll<HTMLDetailsElement>("details[open]")
      .forEach((d) => {
        if (d !== target) d.open = false;
      });
  };

  return (
    <div ref={wrapRef} className="faq mx-auto max-w-[720px]">
      {items.map((item, i) => (
        <details key={i} onToggle={handleToggle}>
          <summary>{item.q}</summary>
          <div className="faq-answer">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
