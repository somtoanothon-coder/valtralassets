import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema } from "@/lib/db";
import { getMarketSnapshot } from "@/lib/market";
import { SITE } from "@/config/site";

import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { LiveMarkets } from "@/components/landing/LiveMarkets";
import { NftMarketplace } from "@/components/landing/NftMarketplace";
import { NftNews } from "@/components/landing/NftNews";
import { InvestmentPlans } from "@/components/landing/InvestmentPlans";
import { HowItWorks, Security, Testimonials } from "@/components/landing/Sections";
import { Faq } from "@/components/landing/Faq";
import { CtaBand, SiteFooter } from "@/components/landing/CtaAndFooter";

export const metadata: Metadata = {
  title: `${SITE.name} — Trade Smarter. Invest Better.`,
  description: SITE.description,
};

// Prices are live, so the page is revalidated frequently at the edge.
export const revalidate = 20;

export default async function HomePage() {
  // Warm the schema so the first signup after a cold start is fast.
  await ensureSchema().catch(() => undefined);

  const [market, user] = await Promise.all([
    getMarketSnapshot(),
    getCurrentUser().catch(() => null),
  ]);

  const signedIn = Boolean(user);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    areaServed: "Worldwide",
    serviceType: ["Forex trading", "Cryptocurrency trading", "Fixed-term investment plans"],
    slogan: "Trade Smarter. Invest Better.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Static, developer-authored payload — no user input is interpolated.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader signedIn={signedIn} />
      <main>
        <Hero initial={market} />
        <Features />
        <LiveMarkets initial={market} />
        <NftMarketplace />
        <NftNews />
        <InvestmentPlans signedIn={signedIn} />
        <HowItWorks />
        <Security />
        <Testimonials />
        <Faq />
        <CtaBand signedIn={signedIn} />
      </main>
      <SiteFooter />
    </>
  );
}
