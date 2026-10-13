import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema, isDatabaseConfigured, query, type UserRow } from "@/lib/db";
import { mailerConfigured, mailTransportInfo } from "@/lib/mail";
import { MailDiagnostics } from "@/components/admin/MailDiagnostics";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDatabaseNotice } from "@/components/admin/AdminDatabaseNotice";
import { MessageComposer, type MessageCustomer } from "@/components/admin/MessageComposer";
import { CircleAlert, CircleCheck, LayoutDashboard, Mail, Users } from "@/components/ui/icons";
import type { AdminMessageRow } from "@/app/api/admin/messages/route";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const configured = isDatabaseConfigured();
  if (configured) await ensureSchema().catch(() => undefined);

  const [users, sent] = configured
    ? await Promise.all([
        query<UserRow>(
          `SELECT * FROM users ORDER BY full_name ASC LIMIT 200`,
        ).catch(() => [] as UserRow[]),
        query<AdminMessageRow>(
          `SELECT id, recipient_email, recipient_user_id, subject, body, status, error, created_at
           FROM admin_messages ORDER BY created_at DESC LIMIT 25`,
        ).catch(() => [] as AdminMessageRow[]),
      ])
    : [[], []];

  const customers: MessageCustomer[] = users.map((u) => ({
    id: u.id,
    accountId: u.account_id,
    fullName: u.full_name,
    email: u.email,
  }));

  const mailerReady = mailerConfigured();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations console"
        title="Messages"
        description="Email any registered customer, or write to an address that is not on the platform. Every send is recorded below, including failures."
        actions={
          <>
            <Link href="/admin" className="btn-secondary px-5 py-3 text-[13.5px]">
              <LayoutDashboard size={16} />
              Overview
            </Link>
            <Link href="/admin/users" className="btn-secondary px-5 py-3 text-[13.5px]">
              <Users size={16} />
              Customers
            </Link>
          </>
        }
      />

      {!configured && <AdminDatabaseNotice context="messages cannot be sent." />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-6">
          <MessageComposer customers={customers} mailerReady={mailerReady} />

          <MailDiagnostics initial={mailTransportInfo()} />
        </div>

        <section className="rounded-2xl border border-white/[0.07] bg-ink-700/50 shadow-card">
          <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-[15.5px] font-bold text-brand-100">
              <Mail size={16} className="text-brand-400" />
              Recently sent
            </h2>
            {sent.length > 0 && (
              <span className="numeric text-[11.5px] text-brand-300/55">{sent.length} shown</span>
            )}
          </header>

          {sent.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {sent.map((message) => {
                const failed = message.status !== "sent";
                return (
                  <li key={message.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-brand-100">
                          {message.subject}
                        </p>
                        <p className="mt-0.5 truncate text-[11.5px] text-brand-300/60">
                          {message.recipient_email}
                        </p>
                        <p className="mt-0.5 text-[11px] text-brand-300/45">
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                      <span
                        className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          failed
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                            : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {failed ? <CircleAlert size={10} /> : <CircleCheck size={10} />}
                        {message.status}
                      </span>
                    </div>
                    {message.error && (
                      <p className="mt-2 rounded-lg border border-rose-400/20 bg-rose-500/[0.08] px-3 py-2 text-[11.5px] leading-relaxed text-rose-200">
                        {message.error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-12 text-center text-[13px] leading-relaxed text-brand-300/60">
              Nothing sent yet.
              <br />
              Messages you send will appear here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
