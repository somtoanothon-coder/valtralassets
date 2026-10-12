"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { COUNTRIES } from "@/config/site";
import { AuthAlert, AuthTabs, PasswordField } from "@/components/ui/AuthClient";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Fingerprint,
  Loader2,
  Users,
} from "@/components/ui/icons";

type Fields = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  country: string;
  occupation: string;
  secondFullName: string;
  secondEmail: string;
  secondPhone: string;
  secondDateOfBirth: string;
  secondAddress: string;
  secondCountry: string;
  secondOccupation: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
};

const EMPTY: Fields = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  country: "",
  occupation: "",
  secondFullName: "",
  secondEmail: "",
  secondPhone: "",
  secondDateOfBirth: "",
  secondAddress: "",
  secondCountry: "",
  secondOccupation: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
};

function passwordScore(password: string) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return { checks, passed: checks.filter((c) => c.ok).length };
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  required = true,
  autoComplete,
  list,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  list?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children ?? (
        <input
          id={id}
          name={id}
          type={type}
          list={list}
          autoComplete={autoComplete}
          className={clsx("input", error && "border-rose-400/50 focus:border-rose-400")}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          required={required}
        />
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-grad text-[11px] font-black text-[#04191F]">
        {badge}
      </span>
      <div>
        <h2 className="text-[14px] font-bold uppercase tracking-[0.09em] text-brand-200">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] text-brand-300/60">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SignupForm({ presetPlan }: { presetPlan?: string | null }) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"individual" | "joint">("individual");
  const [values, setValues] = useState<Fields>(EMPTY);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ accountId: string; redirectTo: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const score = passwordScore(values.password);

  function set<K extends keyof Fields>(key: K) {
    return (value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!agree) {
      setErrors({ agreeTerms: "You must accept the Terms & Conditions and Privacy Policy" });
      return;
    }
    if (values.password !== values.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, accountType, agreeTerms: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        accountId?: string;
        redirectTo?: string;
      };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error || "We could not create your account. Please try again.");
        setBusy(false);
        if (data.fields && Object.keys(data.fields).length) {
          const first = document.getElementById(Object.keys(data.fields)[0]);
          first?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      const destination = data.redirectTo || "/dashboard";
      setSuccess({ accountId: data.accountId!, redirectTo: destination });
      window.setTimeout(() => {
        router.replace(destination);
        router.refresh();
      }, 3200);
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="animate-rise rounded-3xl border border-emerald-400/25 bg-ink-800/75 p-7 text-center shadow-glow sm:p-9">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-grad text-[#04191F]">
          <CircleCheck size={28} />
        </span>
        <h2 className="mt-5 font-display text-[23px] font-extrabold text-brand-100">
          Your account is ready
        </h2>
        <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-relaxed text-brand-300/75">
          A welcome email with your account details is on its way to{" "}
          <span className="font-semibold text-brand-200">{values.email}</span>.
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-brand-400/25 bg-brand-400/[0.07] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300/70">
            Your Account ID
          </p>
          <p className="numeric mt-1.5 text-[24px] font-extrabold tracking-[0.06em] text-brand-100">
            {success.accountId}
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-brand-300/70">
            <Fingerprint size={12} />
            Keep this safe — you need it to sign in.
          </p>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-[13px] text-brand-300/70">
          <Loader2 size={15} className="animate-spin text-brand-400" />
          Taking you to your dashboard…
        </p>
        <Link href={success.redirectTo} className="btn-primary mt-5 w-full py-3.5">
          Go to dashboard now
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-rise rounded-3xl border border-white/[0.09] bg-ink-800/70 p-5 shadow-card backdrop-blur-xl sm:p-7">
      <AuthTabs mode="signup" />

      <form onSubmit={onSubmit} className="mt-6 space-y-7" noValidate>
        {formError && <AuthAlert>{formError}</AuthAlert>}

        {presetPlan && (
          <div className="flex items-center gap-2.5 rounded-xl border border-brand-400/25 bg-brand-400/[0.07] px-4 py-3 text-[12.5px] text-brand-200">
            <Check size={15} className="shrink-0 text-brand-400" />
            We&apos;ll set up your <span className="font-semibold capitalize">{presetPlan}</span> plan
            once you sign in.
          </div>
        )}

        {/* Account type ------------------------------------------------ */}
        <section>
          <label className="label">Account Type</label>
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-ink-900/45 p-1.5">
            {(
              [
                { id: "individual", label: "Individual" },
                { id: "joint", label: "Joint / Corporate" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccountType(option.id)}
                aria-pressed={accountType === option.id}
                className={clsx(
                  "rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all",
                  accountType === option.id
                    ? "bg-brand-grad text-[#04191F] shadow-pill"
                    : "text-brand-300/80 hover:bg-white/[0.06]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11.5px] text-brand-300/60">
            {accountType === "joint"
              ? "Add a second account holder for family, trust or corporate registration."
              : "Your unique Account ID will be generated automatically after registration."}
          </p>
        </section>

        {/* Primary holder ---------------------------------------------- */}
        <section className="space-y-5">
          <SectionHeading badge="A" title="Primary Account Holder" />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="fullName"
              label="Full Name"
              placeholder="John Smith"
              autoComplete="name"
              value={values.fullName}
              onChange={set("fullName")}
              error={errors.fullName}
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              placeholder="john@example.com"
              autoComplete="email"
              value={values.email}
              onChange={set("email")}
              error={errors.email}
            />
            <TextField
              id="phone"
              label="Phone"
              type="tel"
              placeholder="+1 234 567 8900"
              autoComplete="tel"
              value={values.phone}
              onChange={set("phone")}
              error={errors.phone}
            />
            <TextField
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              autoComplete="bday"
              value={values.dateOfBirth}
              onChange={set("dateOfBirth")}
              error={errors.dateOfBirth}
            />
            <div className="sm:col-span-2">
              <TextField
                id="address"
                label="Address"
                placeholder="123 Main Street, Apt 4B"
                autoComplete="street-address"
                value={values.address}
                onChange={set("address")}
                error={errors.address}
              />
            </div>
            <TextField
              id="country"
              label="Country"
              value={values.country}
              onChange={set("country")}
              error={errors.country}
            >
              <select
                id="country"
                name="country"
                className={clsx("input", errors.country && "border-rose-400/50")}
                value={values.country}
                onChange={(e) => set("country")(e.target.value)}
                autoComplete="country-name"
                required
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </TextField>
            <TextField
              id="occupation"
              label="Occupation"
              placeholder="Software Engineer"
              autoComplete="organization-title"
              value={values.occupation}
              onChange={set("occupation")}
              error={errors.occupation}
            />
          </div>
        </section>

        {/* Secondary holder -------------------------------------------- */}
        {accountType === "joint" && (
          <section className="animate-rise space-y-5">
            <SectionHeading
              badge="B"
              title="Secondary Account Holder"
              subtitle="Required for joint and corporate registrations."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="secondFullName"
                label="Full Name"
                placeholder="Mary Smith"
                value={values.secondFullName}
                onChange={set("secondFullName")}
                error={errors.secondFullName}
              />
              <TextField
                id="secondEmail"
                label="Email"
                type="email"
                placeholder="mary@example.com"
                value={values.secondEmail}
                onChange={set("secondEmail")}
                error={errors.secondEmail}
              />
              <TextField
                id="secondPhone"
                label="Phone"
                type="tel"
                placeholder="+1 234 567 8901"
                value={values.secondPhone}
                onChange={set("secondPhone")}
                error={errors.secondPhone}
              />
              <TextField
                id="secondDateOfBirth"
                label="Date of Birth"
                type="date"
                value={values.secondDateOfBirth}
                onChange={set("secondDateOfBirth")}
                error={errors.secondDateOfBirth}
              />
              <div className="sm:col-span-2">
                <TextField
                  id="secondAddress"
                  label="Address"
                  placeholder="123 Main Street, Apt 4B"
                  value={values.secondAddress}
                  onChange={set("secondAddress")}
                  error={errors.secondAddress}
                />
              </div>
              <TextField
                id="secondCountry"
                label="Country"
                value={values.secondCountry}
                onChange={set("secondCountry")}
                error={errors.secondCountry}
              >
                <select
                  id="secondCountry"
                  name="secondCountry"
                  className={clsx("input", errors.secondCountry && "border-rose-400/50")}
                  value={values.secondCountry}
                  onChange={(e) => set("secondCountry")(e.target.value)}
                  required
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </TextField>
              <TextField
                id="secondOccupation"
                label="Occupation"
                placeholder="Teacher"
                value={values.secondOccupation}
                onChange={set("secondOccupation")}
                error={errors.secondOccupation}
              />
            </div>
          </section>
        )}

        {/* Security ---------------------------------------------------- */}
        <section className="space-y-5">
          <SectionHeading
            badge="C"
            title="Account Security"
            subtitle="Choose a strong password you don't use anywhere else."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              id="password"
              name="password"
              label="Password"
              placeholder="Min 8 chars"
              value={values.password}
              onChange={set("password")}
              error={errors.password}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Repeat password"
              value={values.confirmPassword}
              onChange={set("confirmPassword")}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 px-4 py-3.5">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={clsx(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    i < score.passed
                      ? score.passed <= 2
                        ? "bg-rose-400"
                        : score.passed === 3
                          ? "bg-amber-400"
                          : "bg-brand-green"
                      : "bg-white/10",
                  )}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {score.checks.map((check) => (
                <li
                  key={check.label}
                  className={clsx(
                    "flex items-center gap-1.5 text-[11.5px]",
                    check.ok ? "text-brand-300/80" : "text-brand-300/45",
                  )}
                >
                  <Check
                    size={11}
                    strokeWidth={3}
                    className={check.ok ? "text-brand-green" : "text-white/25"}
                  />
                  {check.label}
                </li>
              ))}
            </ul>
          </div>

          <TextField
            id="referralCode"
            label="Referral Code (Optional)"
            placeholder="Enter referral code"
            value={values.referralCode}
            onChange={set("referralCode")}
            error={errors.referralCode}
            required={false}
          />
        </section>

        {/* Consent ----------------------------------------------------- */}
        <section className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-ink-900/40 px-4 py-3.5">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                if (e.target.checked) setErrors((p) => ({ ...p, agreeTerms: "" }));
              }}
              className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-white/20 accent-[#27B58D]"
              style={{ width: 18, height: 18 }}
              required
            />
            <span className="text-[12.5px] leading-relaxed text-brand-300/80">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-brand-400 hover:underline" target="_blank">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-brand-400 hover:underline" target="_blank">
                Privacy Policy
              </Link>
              , and I confirm I am 18 years or older and investing with funds I can afford to lose.
            </span>
          </label>
          {errors.agreeTerms && <p className="field-error">{errors.agreeTerms}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full py-4 text-[14.5px]">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
            {busy ? "Creating your account…" : "Create Account"}
          </button>

          <p className="text-center text-[12.5px] text-brand-300/60">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-brand-400 hover:underline">
              Sign in instead
            </Link>
          </p>
        </section>
      </form>
    </div>
  );
}

export default SignupForm;
