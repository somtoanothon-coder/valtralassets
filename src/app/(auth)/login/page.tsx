import type { Metadata } from "next";
import { AuthTabs } from "@/components/ui/AuthClient";
import { LoginForm } from "@/components/ui/AuthClient";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Valtra Assets account with your Account ID and password.",
  robots: { index: false, follow: true },
};

// Read on every request so connecting a database takes effect immediately.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="animate-rise rounded-3xl border border-white/[0.09] bg-ink-800/70 p-6 shadow-card backdrop-blur-xl sm:p-8">
      <SetupNotice databaseReady={isDatabaseConfigured()} />

      <AuthTabs mode="login" />

      <div className="mt-7">
        <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-100">
          Welcome back
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-brand-300/70">
          Sign in to view your portfolio, fund your wallet, track investment plans and manage your
          collectibles.
        </p>
      </div>

      <div className="mt-7">
        <LoginForm />
      </div>
    </div>
  );
}
