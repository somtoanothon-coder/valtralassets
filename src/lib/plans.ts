export type Plan = {
  id: string;
  name: string;
  tagline: string;
  roiPercent: number;
  durationDays: number;
  durationLabel: string;
  minInvest: number;
  maxInvest: number;
  payout: string;
  capitalReturn: boolean;
  featured?: boolean;
  perks: string[];
};

/** Investment plans exactly as published on the platform. */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter Plan",
    tagline: "A low-risk entry point for first-time investors.",
    roiPercent: 5.0,
    durationDays: 30,
    durationLabel: "30 days",
    minInvest: 50,
    maxInvest: 5000,
    payout: "At Maturity",
    capitalReturn: true,
    perks: [
      "5.00% total ROI paid at maturity",
      "Capital returned with profit",
      "Access to forex & crypto markets",
      "Email statements and tax summary",
    ],
  },
  {
    id: "growth",
    name: "Growth Plan",
    tagline: "Our most popular fixed-term plan with monthly payouts.",
    roiPercent: 12.0,
    durationDays: 90,
    durationLabel: "90 days",
    minInvest: 500,
    maxInvest: 25000,
    payout: "Every month",
    capitalReturn: true,
    featured: true,
    perks: [
      "12.00% total ROI paid monthly",
      "Capital returned at maturity",
      "Priority execution on all orders",
      "Free NFT marketplace listing fee",
    ],
  },
  {
    id: "premium",
    name: "Premium Weekly Yield",
    tagline: "High-ticket plan with weekly payouts and maximum capital return.",
    roiPercent: 18.0,
    durationDays: 60,
    durationLabel: "60 days",
    minInvest: 1000,
    maxInvest: 100000,
    payout: "Every week",
    capitalReturn: true,
    perks: [
      "18.00% total ROI paid weekly",
      "Capital returned at maturity",
      "Dedicated account manager",
      "Priority withdrawals within 24 hours",
    ],
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  if (!id) return undefined;
  return PLANS.find((p) => p.id === id.toLowerCase());
}

export const MIN_DEPOSIT = 50;

export function planProgress(plan: Plan, amount: number): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (amount < plan.minInvest) return null;
  if (amount > plan.maxInvest) return 100;
  const range = plan.maxInvest - plan.minInvest;
  if (range <= 0) return 100;
  return Math.round(((amount - plan.minInvest) / range) * 100);
}
