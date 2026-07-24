"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

/* ---------------------------------------------------------------------------
   TrackedLink — outbound (external site) link with GA4 conversion tracking.

   Every link that sends a visitor OFF SaaS Atlas to a tool's own site (or its
   affiliate signup URL) goes through this component so measurement stays in
   one place. On click it fires a single GA4 event, `outbound_click`, carrying:

     tool_slug      — stable id of the tool being sent traffic to
     tool_name      — human-readable tool name
     has_affiliate  — true when the tool has a monetisable affiliate program
                      (see hasAffiliate() in src/data/tools.ts). Lets GA4 split
                      revenue-earning clicks from unmonetised outbound traffic.
     link_url       — the actual destination URL (tool site or affiliate URL)
     link_type      — which surface the click came from (see OutboundLinkType)

   Rendering is unchanged vs a plain <a>: it forwards className / rel / target
   / etc. via ...rest, so nofollow/sponsored rels and styling are preserved.
   The event send is guarded — if gtag is absent (e.g. consent blocked, script
   not yet loaded, SSR) the link still navigates normally and nothing throws.
   ------------------------------------------------------------------------- */

/** Where the outbound click originated. Kept as a small, stable vocabulary. */
export type OutboundLinkType =
  | "header" // tool page header "Visit {tool}" button
  | "cta" // bottom-of-page "Get Started" CTA (tool + tool×country pages)
  | "card" // tool-table row "Visit" link (category pages)
  | "compare" // "Try {tool}" card on a comparison page
  | "review_cta" // scored-review panel CTA (may point at the affiliate URL)
  | "finder"; // /finder quiz result CTA

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface TrackedLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  toolSlug: string;
  toolName: string;
  hasAffiliate: boolean;
  linkType: OutboundLinkType;
  children: ReactNode;
}

export default function TrackedLink({
  href,
  toolSlug,
  toolName,
  hasAffiliate,
  linkType,
  children,
  onClick,
  ...rest
}: TrackedLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "outbound_click", {
        tool_slug: toolSlug,
        tool_name: toolName,
        has_affiliate: hasAffiliate,
        link_url: href,
        link_type: linkType,
      });
    }
    // Preserve any caller-supplied handler; never block navigation.
    onClick?.(event);
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
