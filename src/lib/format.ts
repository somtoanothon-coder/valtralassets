export function formatUsd(value: number | string | null | undefined, decimals = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return "$0.00";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const table: [number, string][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [604800, "week"],
    [2592000, "month"],
    [31536000, "year"],
  ];
  let unit = "minute";
  let divisor = 60;
  for (let i = table.length - 1; i >= 0; i -= 1) {
    if (seconds >= table[i][0]) {
      unit = table[i][1];
      divisor = table[i][0];
      break;
    }
  }
  const count = Math.floor(seconds / divisor);
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function initials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Human label for transaction types used across dashboards. */
export const TX_TYPE_LABEL: Record<string, string> = {
  deposit: "Wallet deposit",
  investment: "Plan investment",
  nft: "NFT purchase",
  withdrawal: "Withdrawal",
  bonus: "Bonus credit",
  adjustment: "Manual adjustment",
  referral: "Referral reward",
};

export const TX_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function statusTone(status: string): string {
  switch (status) {
    case "approved":
    case "completed":
    case "active":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
    case "pending":
      return "border-amber-400/25 bg-amber-400/10 text-amber-300";
    case "rejected":
    case "cancelled":
    case "matured":
      return "border-rose-400/25 bg-rose-400/10 text-rose-300";
    default:
      return "border-white/12 bg-white/[0.05] text-brand-300";
  }
}
