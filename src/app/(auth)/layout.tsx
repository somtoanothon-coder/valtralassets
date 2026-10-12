import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { SITE, CONTACT } from "@/config/site";

export const metadata: Metadata = {
  title: "Account access",
  description: `Sign in or create your ${SITE.name} account.`,
  robots: { index: false, follow: true },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-ink-800 via-ink-700 to-brand-navy">
      <div
        className="pointer-events-none absolute -left-40 top-[-140px] h-[520px] w-[520px] rounded-full bg-brand-green/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-[-120px] h-[480px] w-[480px] rounded-full bg-brand-500/25 blur-[130px]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-grid opacity-40 [background-size:56px_56px]" aria-hidden="true" />

      <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
        <Link href="/" aria-label={`${SITE.name} — home`} className="mb-7">
          <Logo markSize={40} href={null} />
        </Link>

        <div className="w-full max-w-[680px]">{children}</div>

        <footer className="mt-8 text-center">
          <p className="text-[12px] text-brand-300/55">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="mt-2 text-[12px] text-brand-300/45">
            Need help?{" "}
            <a href={`mailto:${CONTACT.supportEmail}`} className="font-semibold text-brand-400 hover:underline">
              {CONTACT.supportEmail}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
