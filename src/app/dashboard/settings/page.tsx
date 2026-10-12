import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CONTACT, SITE } from "@/config/site";
import { formatDate, formatDateTime } from "@/lib/format";
import { ArrowRight, Fingerprint, LogOut, Mail, MapPin, ShieldCheck, Users } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Account details",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows: { label: string; value: string; icon?: typeof Mail }[] = [
    { label: "Full name", value: user.fullName },
    { label: "Email address", value: user.email, icon: Mail },
    { label: "Phone", value: user.phone || "—" },
    { label: "Country", value: user.country || "—", icon: MapPin },
    { label: "Occupation", value: user.occupation || "—" },
    { label: "Account type", value: user.accountType === "joint" ? "Joint / Corporate" : "Individual", icon: Users },
    { label: "Referral code", value: user.referralCode },
    { label: "Referred by", value: user.referredBy || "—" },
    { label: "Member since", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[27px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[31px]">
          Account details
        </h1>
        <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-brand-300/75">
          The information registered on your {SITE.name} account. To change any of these details,
          contact support from your registered email address — this protects your account from
          unauthorised changes.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
          <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">
              Primary account holder
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-400/[0.08] px-3 py-1 text-[11px] font-semibold text-brand-300">
              <ShieldCheck size={12} />
              {user.status === "active" ? "Verified account" : user.status}
            </span>
          </header>

          <dl className="divide-y divide-white/[0.05]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-6 px-5 py-4">
                <dt className="text-[13px] text-brand-300/70">{row.label}</dt>
                <dd className="max-w-[60%] break-words text-right text-[13.5px] font-semibold text-brand-100">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {user.accountType === "joint" && user.secondFullName && (
            <>
              <header className="border-y border-white/[0.07] bg-white/[0.02] px-5 py-3.5">
                <h2 className="font-display text-[14.5px] font-bold text-brand-100">
                  Secondary account holder
                </h2>
              </header>
              <dl className="divide-y divide-white/[0.05]">
                {[
                  { label: "Full name", value: user.secondFullName },
                  { label: "Email", value: user.secondEmail || "—" },
                  { label: "Phone", value: user.secondPhone || "—" },
                  { label: "Country", value: user.secondCountry || "—" },
                  { label: "Occupation", value: user.secondOccupation || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-6 px-5 py-4">
                    <dt className="text-[13px] text-brand-300/70">{row.label}</dt>
                    <dd className="max-w-[60%] break-words text-right text-[13.5px] font-semibold text-brand-100">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-400/25 bg-brand-400/[0.07] p-6">
            <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
              <Fingerprint size={17} className="text-brand-400" />
              Your Account ID
            </h2>
            <p className="numeric mt-4 break-all text-[22px] font-extrabold tracking-[0.06em] text-brand-100">
              {user.accountId}
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-brand-300/75">
              This is your sign-in ID. It was emailed to you when you registered, and it can never be
              changed.
            </p>
            {user.lastLoginAt && (
              <p className="mt-3 text-[11.5px] text-brand-300/55">
                Last sign-in: {formatDateTime(user.lastLoginAt)}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 p-6">
            <h2 className="font-display text-[15.5px] font-bold text-brand-100">Security</h2>
            <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-brand-300/80">
              <li className="flex gap-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-400" />
                Sessions expire automatically and can be revoked by signing out.
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-400" />
                We never ask for your password, 2FA code or seed phrase.
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-400" />
                Report suspicious activity to{" "}
                <a href={`mailto:${CONTACT.supportEmail}`} className="font-semibold text-brand-400 hover:underline">
                  {CONTACT.supportEmail}
                </a>
                .
              </li>
            </ul>

            <Link href="/support" className="btn-secondary mt-5 w-full py-3 text-[13px]">
              Contact support
              <ArrowRight size={15} />
            </Link>

            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn-danger mt-2.5 w-full py-3 text-[13px]">
                <LogOut size={15} />
                Sign out of this device
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
