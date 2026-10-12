import type { ReactNode } from "react";

/**
 * Shared heading block for the admin console pages so every screen keeps the
 * same operations-console styling.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.07] via-ink-700/60 to-ink-800/70 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-amber-400">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-brand-100 sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <div className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-brand-300/70">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

export default AdminPageHeader;
