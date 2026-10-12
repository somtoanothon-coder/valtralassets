import Link from "next/link";
import { CONTACT, NAV_LINKS, SITE } from "@/config/site";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight, LogIn, Mail, ShieldCheck } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";

export function CtaBand({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-400/20 bg-gradient-to-br from-ink-700 via-ink-600 to-ink-800 px-6 py-14 text-center shadow-card sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-400/25 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-brand-green/20 blur-[110px]"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-grid opacity-40 [background-size:52px_52px]" aria-hidden="true" />

            <div className="relative mx-auto max-w-2xl">
              <span className="chip mx-auto mb-5">
                <ShieldCheck size={12} />
                Regulated-grade controls
              </span>
              <h2 className="font-display text-[30px] font-extrabold leading-[1.14] tracking-[-0.02em] text-brand-100 sm:text-[42px]">
                Ready to Start Building Wealth?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-brand-300/80 sm:text-base">
                Join {SITE.name} today and unlock trading, investing, and portfolio tools in one
                secure platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {signedIn ? (
                  <Link href="/dashboard" className="btn-primary px-7 py-3.5 text-[14.5px]">
                    Open Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="btn-primary px-7 py-3.5 text-[14.5px]">
                      Create Free Account
                      <ArrowRight size={16} />
                    </Link>
                    <Link href="/login" className="btn-secondary px-7 py-3.5 text-[14.5px]">
                      <LogIn size={16} />
                      Log In
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-6 text-[12.5px] text-brand-300/60">
                Need help? Write to{" "}
                <a
                  href={`mailto:${CONTACT.supportEmail}`}
                  className="font-semibold text-brand-400 hover:underline"
                >
                  {CONTACT.supportEmail}
                </a>{" "}
                — we reply {CONTACT.responseTime.toLowerCase()}.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#markets", label: "Markets" },
      { href: "/#nft", label: "NFT Marketplace" },
      { href: "/#plans", label: "Investment Plans" },
      { href: "/#how", label: "How It Works" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup", label: "Sign Up" },
      { href: "/login", label: "Log In" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/privacy#cookies", label: "Cookie Policy" },
      { href: "/terms#risk", label: "Risk Disclosure" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-ink-900/65">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo markSize={34} />
            <p className="mt-5 max-w-sm text-[13.5px] leading-[1.75] text-brand-300/70">
              {SITE.tagline}
            </p>
            <a
              href={`mailto:${CONTACT.supportEmail}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-300 transition hover:border-brand-400/40 hover:text-brand-100"
            >
              <Mail size={14} />
              {CONTACT.supportEmail}
            </a>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-100">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-brand-300/70 transition hover:text-brand-100"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-5 py-4">
          <p className="text-[12px] leading-relaxed text-amber-200/80">
            <strong className="font-semibold">Risk warning:</strong> Trading forex, cryptocurrencies
            and other leveraged instruments carries a high level of risk and can result in the loss
            of all your capital. Past performance is not indicative of future results. Only invest
            money you can afford to lose, and seek independent advice where appropriate.
          </p>
        </div>

        <div className="divider my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-[12.5px] text-brand-300/55 sm:text-left">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/terms" className="text-[12.5px] text-brand-300/60 transition hover:text-brand-100">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-[12.5px] text-brand-300/60 transition hover:text-brand-100">
              Privacy Policy
            </Link>
            <Link href="/support" className="text-[12.5px] text-brand-300/60 transition hover:text-brand-100">
              Support
            </Link>
            <span className="hidden text-[12.5px] text-brand-300/40 sm:inline">{SITE.domain}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { NAV_LINKS };
export default SiteFooter;
