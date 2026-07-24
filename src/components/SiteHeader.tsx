import Link from "next/link";

const NAV = [
  { label: "AI Writing", href: "/categories/ai-writing" },
  { label: "AI Image", href: "/categories/ai-image" },
  { label: "AI Coding", href: "/categories/ai-coding" },
  { label: "AI Voice", href: "/categories/ai-voice" },
  { label: "AI Productivity", href: "/categories/ai-productivity" },
  { label: "Finder", href: "/finder" },
  { label: "About", href: "/about" },
];

/** Wireframe globe with a small accent "you are here" pin — replaces the 🌍 emoji. */
function GlobeMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
        vectorEffect="non-scaling-stroke"
      >
        <circle cx="13" cy="13" r="10.5" />
        <ellipse cx="13" cy="13" rx="4.6" ry="10.5" />
        <line x1="2.5" y1="13" x2="23.5" y2="13" />
        <line x1="4.2" y1="7.4" x2="21.8" y2="7.4" />
        <line x1="4.2" y1="18.6" x2="21.8" y2="18.6" />
      </g>
      <circle cx="19.4" cy="7.2" r="2" fill="var(--accent)" />
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--line-soft)] backdrop-blur-[10px]"
      style={{ background: "color-mix(in srgb, var(--paper) 88%, transparent)" }}
    >
      <div className="container-atlas flex h-[60px] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="SaaS Atlas home"
          className="flex items-center gap-2 text-[var(--ink)]"
        >
          <GlobeMark />
          <span className="font-display text-[19px] font-semibold">
            SaaS Atlas
            <span className="text-[var(--accent)]">.uk</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 min-[860px]:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] text-[var(--ink-soft)] transition-colors hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/finder" className="btn btn-accent btn-sm">
          Find your tool
        </Link>
      </div>
    </header>
  );
}
