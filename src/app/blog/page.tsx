import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — AI Tool Guides & Comparisons",
  description:
    "Practical guides to picking AI writing, image, coding, voice, and productivity tools — budget-first, use-case-driven, updated for 2026.",
  alternates: { canonical: "https://www.saas-atlas.uk/blog" },
  openGraph: {
    type: "website",
    title: "SaaS Atlas Blog — AI Tool Guides & Comparisons",
    description:
      "Practical, budget-first guides to choosing the right AI tool for your work.",
    url: "https://www.saas-atlas.uk/blog",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="section">
      <div className="mx-auto w-full max-w-[820px] px-5">
        <p className="eyebrow mb-3">Field notes</p>
        <h1 className="display-h1">The SaaS Atlas Blog</h1>
        <p className="mt-4 max-w-[620px] leading-relaxed text-[var(--ink-soft)]">
          Practical, budget-first guides to choosing AI tools — which to pay for,
          which to skip, and how to decide fast.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-[var(--ink-faint)]">No posts yet — check back soon.</p>
        ) : (
          <ul className="mt-10 space-y-5">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="card block p-6 transition-colors hover:border-[var(--accent)]"
                >
                  <div className="mono-meta mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--ink-faint)]">
                    <span>{formatDate(post.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMinutes} min read</span>
                    {post.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{post.category.replace("ai-", "AI ")}</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-[22px] font-semibold text-[var(--ink)]">
                    {post.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-[var(--ink-soft)]">
                    {post.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
