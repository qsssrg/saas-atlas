import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FinderBanner from "@/components/FinderBanner";
import AtlasBackdrop from "@/components/AtlasBackdrop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.saas-atlas.uk"),
  title: {
    default: "SaaS Atlas — Discover AI Tools Across Borders",
    template: "%s | SaaS Atlas",
  },
  description:
    "Compare AI writing, image, coding, voice, and productivity tools across 8 countries. Expert insights from 25 years in IT help you pick the right AI SaaS tool.",
  keywords: [
    "AI tools comparison",
    "SaaS comparison",
    "AI writing tools",
    "AI voice tools",
    "AI productivity tools",
    "cross-country SaaS",
    "best AI tools",
  ],
  openGraph: {
    type: "website",
    siteName: "SaaS Atlas",
    title: "SaaS Atlas — Discover AI Tools Across Borders",
    description:
      "Compare AI writing, image, coding, voice, and productivity tools across 8 countries. Expert insights from 25 years in IT.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Atlas — Discover AI Tools Across Borders",
    description:
      "Compare AI writing, image, coding, voice, and productivity tools across 8 countries.",
  },
  alternates: {
    canonical: "https://www.saas-atlas.uk",
  },
  verification: {
    google: "DhOiHoHfkxGS3VH0A-zucEkrMprEhmqvhBR75CEXJ7M",
  },
};

const ORGANIZATION_ID = "https://www.saas-atlas.uk/#organization";
const WEBSITE_ID = "https://www.saas-atlas.uk/#website";
const AUTHOR_ID = "https://www.saas-atlas.uk/about#author";

// Global structured data. Kept minimal and factual: the Organization,
// the WebSite (with the on-site search box as a SearchAction), and a
// reference to the author Person defined on /about. alternateName absorbs
// the common spelling variants of the brand name.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "SaaS Atlas",
  alternateName: ["SaaSAtlas", "Saas Atlas"],
  url: "https://www.saas-atlas.uk",
  logo: "https://www.saas-atlas.uk/globe.svg",
  description:
    "Expert-curated AI tool comparisons across 8 English-speaking countries.",
  founder: { "@id": AUTHOR_ID },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "SaaS Atlas",
  url: "https://www.saas-atlas.uk",
  publisher: { "@id": ORGANIZATION_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://www.saas-atlas.uk/categories/ai-writing?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6JLE8JZQ1J"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6JLE8JZQ1J');
          `}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <AtlasBackdrop />
        <SiteHeader />
        <FinderBanner />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
