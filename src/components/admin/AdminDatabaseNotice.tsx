import { CircleAlert } from "@/components/ui/icons";

/** Shown when no database connection string is configured in this environment. */
export function AdminDatabaseNotice({ context }: { context?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/[0.1] px-5 py-4 text-[13px] leading-relaxed text-rose-100">
      <CircleAlert size={17} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold">No database connected.</strong> Connect a database in
        Netlify (Netlify Database exposes{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">NETLIFY_DB_URL</code>) or set{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-[12px]">DATABASE_URL</code> to a
        PostgreSQL connection string, then redeploy.
        {context ? ` Until then ${context}` : ""}
      </span>
    </div>
  );
}

export default AdminDatabaseNotice;
