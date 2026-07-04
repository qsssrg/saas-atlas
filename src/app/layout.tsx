import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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
  metadataBase: new URL("https://saas-atlas.uk"),
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
    canonical: "https://saas-atlas.uk",
  },
  verification: {
    google: "DhOiHoHfkxGS3VH0A-zucEkrMprEhmqvhBR75CEXJ7M",
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
