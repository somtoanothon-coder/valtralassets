"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { CircleAlert, Loader2, LogIn, Mail, ShieldCheck } from "@/components/ui/icons";
import { CONTACT } from "@/config/site";

type Mode = "login" | "signup";

export function AuthTabs({ mode }: { mode: Mode }) {
  const tabs: { id: Mode; label: string; href: string }[] = [
    { id: "login", label: "Sign In", href: "/login" },
    { id: "signup", label: "Create Account", href: "/signup" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Account access"
      className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.07] bg-ink-900/45 p-1.5"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={mode === tab.id}
          className={clsx(
            "rounded-xl px-4 py-3 text-center text-[13.5px] font-semibold transition-all duration-200",
            mode === tab.id
              ? "bg-brand-grad text-[#04191F] shadow-pill"
              : "text-brand-300/80 hover:bg-white/[0.06] hover:text-brand-100",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-rose-400/30 bg-rose-500/[0.12] text-rose-200",
    success: "border-emerald-400/30 bg-emerald-500/[0.12] text-emerald-200",
    info: "border-brand-400/30 bg-brand-400/[0.1] text-brand-200",
  }[tone];

  return (
    <div className={clsx("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-snug", styles)}>
      <CircleAlert size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function PasswordField({
  id,
  name,
  label,
  placeholder = "Enter your password",
  value,
  onChange,
  error,
  autoComplete = "current-password",
  hint,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  hint?: React.ReactNode;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={clsx("input pr-16", error && "border-rose-400/50 focus:border-rose-400")}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wide text-brand-400 transition hover:bg-white/[0.06]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && !error && <p className="mt-1.5 text-[11.5px] text-brand-300/60">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirectTo?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Sign-in failed. Please try again.");
        setBusy(false);
        return;
      }
      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <AuthAlert>{error}</AuthAlert>}

      <div>
        <label className="label" htmlFor="identifier">
          Account ID or Email <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            id="identifier"
            name="identifier"
            className="input pl-11 uppercase placeholder:normal-case"
            placeholder="ACCXXXXXXXX"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300/45" />
        </div>
        <p className="mt-1.5 text-[11.5px] text-brand-300/60">
          Use the Account ID shown when you registered, or your email address.
        </p>
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-brand-300/85">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-ink-900 text-brand-green accent-[#27B58D]"
          />
          Keep me signed in
        </label>
        <Link
          href="/support#reset"
          className="text-[13px] font-semibold text-brand-400 transition hover:text-brand-300"
        >
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-[14.5px]">
        {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
        {busy ? "Signing you in…" : "Sign In"}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-brand-300/55">
        <ShieldCheck size={12} />
        Protected by encrypted sessions and rate-limited login.
      </p>

      <p className="text-center text-[12.5px] text-brand-300/60">
        New to Valtra Assets?{" "}
        <Link href="/signup" className="font-semibold text-brand-400 hover:underline">
          Create your free account
        </Link>
      </p>

      <p className="text-center text-[11.5px] text-brand-300/40">
        Trouble signing in? Email{" "}
        <a href={`mailto:${CONTACT.supportEmail}`} className="text-brand-400/80 hover:underline">
          {CONTACT.supportEmail}
        </a>
      </p>
    </form>
  );
}
