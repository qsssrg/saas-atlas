import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SaaS Atlas — Discover AI Tools Across Borders",
    template: "%s | SaaS Atlas",
  },
  description:
    "Compare AI SaaS tools across countries. Find the best AI writing, image, and coding tools popular in the US, UK, India, and beyond. Expert insights from 25 years in IT.",
  keywords: [
    "AI tools comparison",
    "SaaS comparison",
    "AI writing tools",
    "cross-country SaaS",
    "best AI tools",
  ],
  verification: {
    google: "DhOiHoHfkxGS3VH0A-zucEkrMprEhmqvhBR75CEXJ7M",
  },
};

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="text-xl font-bold text-gray-900">
            SaaS Atlas
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/categories/ai-writing"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            AI Writing
          </Link>
          <Link
            href="/categories/ai-image"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            AI Image
          </Link>
          <Link
            href="/categories/ai-coding"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            AI Coding
          </Link>
          <Link
            href="/about"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SaaS Atlas. Expert-curated AI tool
            comparisons across borders.
          </p>
          <p className="text-xs text-gray-400">
            Some links may earn us a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
      <body className="flex min-h-full flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
