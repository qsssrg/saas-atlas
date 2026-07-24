"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ---------------------------------------------------------------------------
   FinderBanner — a slim, site-wide call-to-action strip that points visitors
   to the /finder quiz. Rendered once in the root layout just under the header
   so it appears on every page. Hidden on /finder itself (no point nudging you
   toward the page you're already on).
   ------------------------------------------------------------------------- */

export default function FinderBanner() {
  const pathname = usePathname();
  if (pathname === "/finder") return null;

  return (
    <div
      className="border-b border-[var(--line-soft)]"
      style={{ background: "var(--accent-soft)" }}
      role="region"
      aria-label="AI tool finder"
    >
      <div className="container-atlas flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center">
        <span aria-hidden="true">🧭</span>
        <span className="text-[13.5px] text-[var(--ink-soft)]">
          Not sure which AI tool fits? Get a personalised pick in 60 seconds.
        </span>
        <Link
          href="/finder"
          className="text-[13.5px] font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Take the quiz →
        </Link>
      </div>
    </div>
  );
}
