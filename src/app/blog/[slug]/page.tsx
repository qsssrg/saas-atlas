import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";

// Only slugs that exist at build time are valid; unknown slugs 404 instead of
// being generated on demand (defence against arbitrary-file reads via slug).
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `https://www.saas-atlas.uk/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = `https://www.saas-atlas.uk/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url,
    author: { "@id": "https://www.saas-atlas.uk/about#author" },
    publisher: { "@id": "https://www.saas-atlas.uk/#organization" },
    mainEntityOfPage: url,
  };

  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="mx-auto w-full max-w-[720px] px-5">
        <div className="mono-meta mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--ink-faint)]">
          <Link href="/blog" className="hover:text-[var(--accent)]">
            ← Blog
          </Link>
          <span aria-hidden="true">·</span>
          <span>{formatDate(post.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h1 className="display-h1">{post.title}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          {post.description}
        </p>

        <div
          className="prose-atlas mt-8"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <div className="mt-12 rounded-[var(--radius-card)] border border-[var(--line-soft)] p-6 text-center" style={{ background: "var(--accent-soft)" }}>
          <p className="text-[15px] text-[var(--ink-soft)]">
            Not sure which tool fits your needs?
          </p>
          <Link href="/finder" className="btn btn-accent btn-sm mt-3">
            Take the AI Tool Finder quiz →
          </Link>
        </div>
      </article>
    </div>
  );
}
