import { SITE, CONTACT, WALLETS } from "@/config/site";

/**
 * Transactional email delivery.
 *
 * Two transports are supported and auto-detected:
 *   1. Resend HTTP API  — set RESEND_API_KEY            (recommended on Netlify)
 *   2. SMTP             — set SMTP_HOST / SMTP_USER / SMTP_PASS
 *
 * If neither is configured the send is skipped and logged, so the site keeps
 * working in preview environments without a mail provider.
 */

type MailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type MailResult = { ok: boolean; skipped?: boolean; error?: string; id?: string };

const FROM_NAME = process.env.MAIL_FROM_NAME || SITE.name;
const FROM_EMAIL =
  process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${SITE.domain}`;

export function mailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

/**
 * Describes how this deployment sends mail, for the diagnostics panel in the
 * operations console. Credentials are never included.
 *
 * Note: this app cannot deliver mail by connecting to recipients' servers
 * directly. Netlify runs on AWS, which blocks outbound port 25 for every
 * Lambda function, so an SMTP relay or hosted mailbox must be configured.
 */
export function mailTransportInfo() {
  const resend = Boolean(process.env.RESEND_API_KEY);
  const smtp = Boolean(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);

  return {
    configured: resend || smtp,
    transport: resend ? "resend" : smtp ? "smtp" : "none",
    from: FROM_EMAIL,
    fromName: FROM_NAME,
    /** Customer replies land here — the support mailbox. */
    replyTo: CONTACT.supportEmail,
    smtpHost: smtp ? process.env.SMTP_HOST! : null,
    smtpPort: smtp ? port : null,
    smtpSecure: smtp ? port === 465 : null,
    smtpUser: process.env.SMTP_USER || null,
    smtpAuthenticated: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  } as const;
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const from = `${FROM_NAME} <${FROM_EMAIL}>`;

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(input.to) ? input.to : [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo || CONTACT.supportEmail,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const payload = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) return { ok: false, error: payload.message || `Resend HTTP ${res.status}` };
      return { ok: true, id: payload.id };
    }

    if (process.env.SMTP_HOST) {
      const nodemailer = await import("nodemailer");
      const port = Number(process.env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
      });
      const info = await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo || CONTACT.supportEmail,
      });
      return { ok: true, id: info.messageId };
    }

    console.info(`[mail] skipped (no transport configured): "${input.subject}" -> ${input.to}`);
    return { ok: false, skipped: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    console.error("[mail] delivery failed:", message);
    return { ok: false, error: message };
  }
}

/* ------------------------------------------------------------------ layout */

function shell(inner: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE.name}</title></head>
<body style="margin:0;padding:0;background:#04191F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E3F3F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04191F;padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#07283A;border:1px solid rgba(153,216,208,0.14);border-radius:18px;overflow:hidden;">
    <tr><td style="padding:26px 30px;background:linear-gradient(115deg,#07283A 0%,#0B3C4A 100%);border-bottom:1px solid rgba(153,216,208,0.14);">
      <table role="presentation" width="100%"><tr>
        <td style="font-size:19px;font-weight:800;letter-spacing:0.14em;color:#E3F3F0;">
          <span style="color:#27B58D;">VALTRA</span><span style="color:#4FB8B4;">L</span>ASSETS
        </td>
        <td align="right" style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#99D8D0;">${SITE.domain}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:32px 30px;">${inner}</td></tr>
    <tr><td style="padding:22px 30px;background:#05212C;border-top:1px solid rgba(153,216,208,0.12);font-size:11.5px;line-height:1.7;color:#7FA6AC;">
      <div style="color:#99D8D0;font-weight:700;letter-spacing:0.1em;margin-bottom:6px;">${SITE.name.toUpperCase()}</div>
      ${SITE.tagline}<br/>
      Support: <a href="mailto:${CONTACT.supportEmail}" style="color:#4FB8B4;text-decoration:none;">${CONTACT.supportEmail}</a> &nbsp;•&nbsp;
      <a href="${SITE.url}/terms" style="color:#4FB8B4;text-decoration:none;">Terms</a> &nbsp;•&nbsp;
      <a href="${SITE.url}/privacy" style="color:#4FB8B4;text-decoration:none;">Privacy</a>
      <div style="margin-top:10px;color:#5C8089;">© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0;"><tr><td style="border-radius:12px;background:linear-gradient(115deg,#27B58D,#4FB8B4);">
  <a href="${href}" style="display:inline-block;padding:14px 30px;font-size:14.5px;font-weight:700;color:#04191F;text-decoration:none;border-radius:12px;">${label}</a>
  </td></tr></table>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;color:#E3F3F0;letter-spacing:-0.01em;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.75;color:#B9D6D6;">${text}</p>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;font-size:13px;color:#7FA6AC;width:44%;border-bottom:1px solid rgba(153,216,208,0.1);">${label}</td>
    <td style="padding:9px 0;font-size:13.5px;color:#E3F3F0;font-weight:600;text-align:right;border-bottom:1px solid rgba(153,216,208,0.1);">${value}</td>
  </tr>`;
}

function panel(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;background:#05212C;border:1px solid rgba(153,216,208,0.13);border-radius:14px;padding:6px 18px;border-collapse:separate;">${rows}</table>`;
}

const esc = (value: string) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

/* ---------------------------------------------------------------- templates */

export type WelcomePayload = {
  fullName: string;
  email: string;
  accountId: string;
  referralCode: string;
  accountType: string;
  referredBy?: string | null;
};

export function welcomeEmail(data: WelcomePayload) {
  const subject = `Welcome to ${SITE.name} — your account is ready`;
  const html = shell(`
    ${h1(`Welcome aboard, ${esc(data.fullName.split(" ")[0])}.`)}
    ${p(`Your ${SITE.name} account has been created successfully. You can now sign in, fund your wallet and start trading global markets or earning fixed ROI on our investment plans.`)}
    ${panel(`
      ${row("Account ID", `<span style="font-family:monospace;">${esc(data.accountId)}</span>`)}
      ${row("Login email", esc(data.email))}
      ${row("Account type", esc(data.accountType === "joint" ? "Joint / Corporate" : "Individual"))}
      ${row("Referral code", `<span style="font-family:monospace;">${esc(data.referralCode)}</span>`)}
      ${data.referredBy ? row("Referred by", esc(data.referredBy)) : ""}
    `)}
    ${p(`<strong style="color:#99D8D0;">Keep your Account ID safe.</strong> It is required every time you sign in — we use it instead of your email so your address is never exposed.`)}
    ${button(`${SITE.url}/login`, "Sign in to your dashboard")}
    ${p(`Next step: fund your wallet via crypto (USDT-TRC20, BTC, ETH, BNB or SOL) and submit your payment reference. Our team verifies every deposit before it is credited — usually in under 30 minutes.`)}
    ${p(`Need help? Reply to this email or write to <a href="mailto:${CONTACT.supportEmail}" style="color:#4FB8B4;text-decoration:none;">${CONTACT.supportEmail}</a> and a human will get back to you.`)}
  `);
  const text = `Welcome to ${SITE.name}, ${data.fullName}.

Your account is ready.

Account ID:   ${data.accountId}
Login email:  ${data.email}
Referral code: ${data.referralCode}

Keep your Account ID safe — it is required every time you sign in.
Sign in: ${SITE.url}/login

Support: ${CONTACT.supportEmail}
© ${new Date().getFullYear()} ${SITE.name}`;
  return { subject, html, text };
}

export type PaymentPayload = {
  reference: string;
  userName: string;
  userEmail: string;
  accountId: string;
  amount: number;
  purpose: string;
  method: string;
  network?: string | null;
  walletAddress?: string | null;
  providerRef?: string | null;
  note?: string | null;
  createdAt: string;
};

export function adminPaymentEmail(data: PaymentPayload) {
  const subject = `💰 New payment submitted — $${data.amount.toFixed(2)} from ${data.userName} (${data.accountId})`;
  const html = shell(`
    ${h1("New payment submitted")}
    ${p(`A customer has submitted a payment for manual verification. Review it in the admin dashboard and credit the account once the funds are confirmed on-chain.`)}
    ${panel(`
      ${row("Reference", `<span style="font-family:monospace;">${esc(data.reference)}</span>`)}
      ${row("Customer", esc(data.userName))}
      ${row("Account ID", `<span style="font-family:monospace;">${esc(data.accountId)}</span>`)}
      ${row("Email", esc(data.userEmail))}
      ${row("Amount", `$${data.amount.toFixed(2)} USD`)}
      ${row("Purpose", esc(data.purpose))}
      ${row("Method", esc(data.method))}
      ${data.network ? row("Network", esc(data.network)) : ""}
      ${data.walletAddress ? row("Paid to", `<span style="font-family:monospace;font-size:11.5px;">${esc(data.walletAddress)}</span>`) : ""}
      ${data.providerRef ? row("Sender / TX hash", `<span style="font-family:monospace;font-size:11.5px;">${esc(data.providerRef)}</span>`) : ""}
      ${row("Submitted", esc(data.createdAt))}
    `)}
    ${data.note ? p(`<strong style="color:#99D8D0;">Customer note:</strong> ${esc(data.note)}`) : ""}
    ${button(`${SITE.url}/admin`, "Open admin dashboard")}
    ${p(`Tip: the fastest way to verify is to search the blockchain explorer for the TX hash above. Once confirmed, open the customer's profile, enter the approved amount and click <strong>Credit account</strong>.`)}
  `);
  const text = `New payment submitted — $${data.amount.toFixed(2)} USD

Reference:  ${data.reference}
Customer:   ${data.userName} (${data.accountId})
Email:      ${data.userEmail}
Purpose:    ${data.purpose}
Method:     ${data.method}${data.network ? ` / ${data.network}` : ""}
TX hash:    ${data.providerRef || "—"}
Submitted:  ${data.createdAt}

Open the dashboard: ${SITE.url}/admin`;
  return { subject, html, text };
}

export type PaymentReceivedPayload = {
  fullName: string;
  reference: string;
  amount: number;
  purpose: string;
  status: "received" | "approved" | "rejected";
  adminNote?: string | null;
  newBalance?: number | null;
};

export function userPaymentEmail(data: PaymentReceivedPayload) {
  const copy = {
    received: {
      tag: "Payment received",
      subject: `We received your payment — ${data.reference}`,
      body: p(
        `Thanks — we have your payment of <strong style="color:#E3F3F0;">$${data.amount.toFixed(2)}</strong>. Our team is confirming it on-chain now. You will get another email the moment it is credited, usually within 30 minutes.`,
      ),
    },
    approved: {
      tag: "Payment approved",
      subject: `Payment approved — $${data.amount.toFixed(2)} credited`,
      body: p(
        `Your payment of <strong style="color:#E3F3F0;">$${data.amount.toFixed(2)}</strong> has been verified and credited to your ${SITE.name} wallet.`,
      ),
    },
    rejected: {
      tag: "Payment needs attention",
      subject: `Action needed — we could not verify ${data.reference}`,
      body: p(
        `We could not verify the payment of <strong style="color:#E3F3F0;">$${data.amount.toFixed(2)}</strong>. No funds have been credited. Please reply to this email with a screenshot or the transaction hash so we can look again.`,
      ),
    },
  }[data.status];

  const html = shell(`
    <div style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(39,181,141,0.14);color:#4FB8B4;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;">${copy.tag}</div>
    ${h1(`Hi ${esc(data.fullName.split(" ")[0])},`)}
    ${copy.body}
    ${panel(`
      ${row("Reference", `<span style="font-family:monospace;">${esc(data.reference)}</span>`)}
      ${row("Amount", `$${data.amount.toFixed(2)} USD`)}
      ${row("Purpose", esc(data.purpose))}
      ${row("Status", data.status.toUpperCase())}
      ${typeof data.newBalance === "number" ? row("Wallet balance", `$${data.newBalance.toFixed(2)} USD`) : ""}
      ${data.adminNote ? row("Note from our team", esc(data.adminNote)) : ""}
    `)}
    ${button(`${SITE.url}/dashboard`, "Open your dashboard")}
  `);
  const text = `${copy.tag}

Reference: ${data.reference}
Amount:    $${data.amount.toFixed(2)} USD
Purpose:   ${data.purpose}
Status:    ${data.status.toUpperCase()}
${typeof data.newBalance === "number" ? `Balance:   $${data.newBalance.toFixed(2)} USD\n` : ""}${data.adminNote ? `Note:      ${data.adminNote}\n` : ""}
Dashboard: ${SITE.url}/dashboard`;
  return { subject: copy.subject, html, text };
}

export function adminNewUserEmail(data: {
  fullName: string;
  email: string;
  accountId: string;
  phone?: string | null;
  country?: string | null;
  occupation?: string | null;
  accountType?: string | null;
  referralCode?: string | null;
}) {
  const subject = `🆕 New account — ${data.fullName} (${data.accountId})`;
  const html = shell(`
    ${h1("A new customer just registered")}
    ${p(`Someone created an account on ${SITE.domain}. Their details are below.`)}
    ${panel(`
      ${row("Name", esc(data.fullName))}
      ${row("Account ID", `<span style="font-family:monospace;">${esc(data.accountId)}</span>`)}
      ${row("Email", esc(data.email))}
      ${data.phone ? row("Phone", esc(data.phone)) : ""}
      ${data.country ? row("Country", esc(data.country)) : ""}
      ${data.occupation ? row("Occupation", esc(data.occupation)) : ""}
      ${data.accountType ? row("Account type", esc(data.accountType)) : ""}
      ${data.referralCode ? row("Referral code", esc(data.referralCode)) : ""}
    `)}
    ${button(`${SITE.url}/admin`, "Open admin dashboard")}
  `);
  return {
    subject,
    html,
    text: `New account: ${data.fullName} — ${data.email} (${data.accountId})`,
  };
}

export function walletsTableText(): string {
  return WALLETS.map((w) => `${w.asset} · ${w.network}: ${w.address}`).join("\n");
}

export type AdminMessagePayload = {
  subject: string;
  body: string;
  recipientName?: string | null;
  accountId?: string | null;
};

/**
 * A message written by an administrator in the operations console. The author's
 * line breaks are preserved and every interpolated value is escaped, so message
 * text cannot inject markup into the email.
 */
export function adminMessageEmail(data: AdminMessagePayload) {
  const greeting = data.recipientName
    ? `Hello ${esc(data.recipientName.split(" ")[0])},`
    : "Hello,";

  const paragraphs = data.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => p(esc(block).replace(/\n/g, "<br/>")));

  const html = shell(`
    ${h1(esc(data.subject))}
    ${p(greeting)}
    ${paragraphs.join("")}
    ${
      data.accountId
        ? panel(row("Account ID", esc(data.accountId)))
        : ""
    }
    ${p(`Need anything else? Reply to this email or write to <a href="mailto:${CONTACT.supportEmail}" style="color:#4FB8B4;text-decoration:none;">${CONTACT.supportEmail}</a>.`)}
  `);

  const text = [
    data.subject,
    "",
    data.recipientName ? `Hello ${data.recipientName.split(" ")[0]},` : "Hello,",
    "",
    data.body,
    "",
    data.accountId ? `Account ID: ${data.accountId}` : "",
    `Support: ${CONTACT.supportEmail}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject: data.subject, html, text };
}
