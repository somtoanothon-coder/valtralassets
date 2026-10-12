"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { NAV_LINKS, CONTACT } from "@/config/site";
import { ArrowRight, LogIn, Mail, Menu, X } from "@/components/ui/icons";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-white/[0.09] bg-ink-900/85 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-900/70"
          : "border-transparent bg-ink-900/45 backdrop-blur-md",
      )}
    >
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Logo markSize={30} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13.5px] font-semibold text-brand-300/85 transition hover:bg-white/[0.06] hover:text-brand-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-brand-300 transition hover:border-brand-400/40 hover:text-brand-100"
            aria-label="Email support"
          >
            <Mail size={16} />
          </a>
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-[13.5px]">
              Dashboard
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary px-5 py-2.5 text-[13.5px]">
                <LogIn size={15} />
                Log In
              </Link>
              <Link href="/signup" className="btn-primary px-5 py-2.5 text-[13.5px]">
                Create Free Account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-brand-200 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={clsx(
          "overflow-hidden border-t border-white/[0.07] bg-ink-900/97 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container-x flex flex-col gap-1 py-4" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-[14.5px] font-semibold text-brand-200 transition hover:bg-white/[0.06]"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2.5">
            {signedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary w-full py-3.5">
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full py-3.5">
                  <LogIn size={16} />
                  Log In
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary w-full py-3.5">
                  Create Free Account
                </Link>
              </>
            )}
            <a
              href={`mailto:${CONTACT.supportEmail}`}
              className="btn-ghost w-full py-3 text-[13px]"
              onClick={() => setOpen(false)}
            >
              <Mail size={15} />
              {CONTACT.supportEmail}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;
