import { CircleAlert } from "@/components/ui/icons";

/**
 * First-run status banner for the sign-in and sign-up screens.
 *
 * These are the first pages an operator opens after deploying, so the missing
 * prerequisite is stated up front instead of only surfacing after a visitor
 * has filled in the whole registration form.
 */
export function SetupNotice({ databaseReady }: { databaseReady: boolean }) {
  if (databaseReady) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-5 py-4 text-left text-[13px] leading-relaxed text-amber-100">
      <CircleAlert size={17} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold">Accounts are not open yet.</strong> The platform database
        is not connected, so registration and sign-in are unavailable. If you manage this site,
        connect a PostgreSQL database — Netlify Database provides{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">NETLIFY_DB_URL</code>, or
        set{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">DATABASE_URL</code> — then
        redeploy. Visit{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">/api/health</code> to
        confirm.
      </span>
    </div>
  );
}

export default SetupNotice;
