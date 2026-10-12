import type { Metadata } from "next";
import { SignupForm } from "@/components/ui/SignupForm";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getPlan } from "@/lib/plans";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Create Your Account",
  description:
    "Open a Valtra Assets account in minutes and start trading global markets or earning fixed ROI on investment plans.",
  robots: { index: true, follow: true },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = getPlan(params.plan);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[30px]">
          Open Your Account
        </h1>
        <p className="mx-auto mt-2.5 max-w-lg text-[13.5px] leading-relaxed text-brand-300/70">
          It takes about three minutes. You&apos;ll get a unique Account ID by email the moment you
          finish, plus the ability to fund your wallet and start earning straight away.
        </p>
      </div>

      <SetupNotice databaseReady={isDatabaseConfigured()} />

      <SignupForm presetPlan={plan ? plan.name : null} />
    </div>
  );
}
