import Link from "next/link";
import clsx from "clsx";

type LogoProps = {
  className?: string;
  /** Height of the mark in pixels. */
  markSize?: number;
  showWordmark?: boolean;
  href?: string | null;
  subtitle?: string | null;
};

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="va-blade" x1="0.1" y1="1" x2="0.9" y2="0">
          <stop offset="0%" stopColor="#11606F" />
          <stop offset="52%" stopColor="#1E8A94" />
          <stop offset="100%" stopColor="#27B58D" />
        </linearGradient>
        <linearGradient id="va-blade-2" x1="0.1" y1="1" x2="0.9" y2="0">
          <stop offset="0%" stopColor="#1E8A94" />
          <stop offset="100%" stopColor="#4FB8B4" />
        </linearGradient>
        <linearGradient id="va-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D3055" />
          <stop offset="100%" stopColor="#09254A" />
        </linearGradient>
      </defs>

      {/* Ascending growth blades */}
      <path d="M31.5 62 L46.5 15 L53.5 15 L38.5 62 Z" fill="url(#va-blade-2)" opacity="0.9" />
      <path d="M20.5 62 L34 20 L40.5 20 L27 62 Z" fill="url(#va-blade)" opacity="0.78" />
      <path d="M43 58 L57 12 L64 12 L50 58 Z" fill="url(#va-blade)" />

      {/* Navy chevron */}
      <path d="M3 9 H16.5 L34 51 L29.5 63 H23.5 Z" fill="url(#va-navy)" />
    </svg>
  );
}

export function Logo({
  className,
  markSize = 34,
  showWordmark = true,
  href = "/",
  subtitle = null,
}: LogoProps) {
  const body = (
    <span className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-extrabold tracking-[0.13em] text-brand-100">
            VALTRA
            <span className="bg-brand-grad bg-clip-text text-transparent">L</span>
            ASSETS
          </span>
          {subtitle && (
            <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-brand-400/80">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) return body;

  return (
    <Link href={href} aria-label={`Valtra Assets — home`} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
      {body}
    </Link>
  );
}

export default Logo;
