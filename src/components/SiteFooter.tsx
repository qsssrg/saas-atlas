import Link from "next/link";

const LINKS = [
  { label: "Categories", href: "/categories/ai-writing" },
  { label: "Countries", href: "/countries/us" },
  { label: "About", href: "/about" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line-soft)]">
      <div className="container-atlas flex flex-col gap-3 py-8 text-[13px] text-[var(--ink-faint)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-[14px] text-[var(--ink-soft)]">
            © {new Date().getFullYear()} SaaS Atlas — expert-curated AI tool
            comparisons across borders
          </p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            {LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="max-w-[640px] text-[12px]">
          Some links may earn us a commission at no extra cost to you. This never
          affects our reviews or rankings.
        </p>
      </div>
    </footer>
  );
}
