import clsx from "clsx";
import type { Nft } from "@/lib/nft";

/**
 * Hand-built vector artwork for each marketplace piece.
 * Everything is inline SVG so cards stay razor sharp at any size and add
 * zero network weight — a deliberate upgrade over raster thumbnails.
 */
export function NftArtwork({
  nft,
  className,
  animate = true,
}: {
  nft: Nft;
  className?: string;
  animate?: boolean;
}) {
  const uid = nft.slug;
  const [dark, mid, light] = nft.palette;

  return (
    <svg
      viewBox="0 0 400 400"
      className={clsx("h-full w-full", className)}
      role="img"
      aria-label={`${nft.name} artwork`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor={mid} stopOpacity="0.85" />
          <stop offset="55%" stopColor={dark} stopOpacity="0.98" />
          <stop offset="100%" stopColor="#04191F" stopOpacity="1" />
        </radialGradient>
        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light} stopOpacity="0.55" />
          <stop offset="60%" stopColor={mid} stopOpacity="0.18" />
          <stop offset="100%" stopColor={dark} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`blade-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={dark} stopOpacity="0" />
          <stop offset="100%" stopColor={light} stopOpacity="0.5" />
        </linearGradient>
        <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={`grain-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.055" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width="400" height="400" fill={`url(#bg-${uid})`} />

      {nft.art.kind === "rings" && <RingsArt uid={uid} art={nft.art} animate={animate} />}
      {nft.art.kind === "target" && <TargetArt uid={uid} art={nft.art} light={light} animate={animate} />}
      {nft.art.kind === "waveform" && (
        <WaveformArt uid={uid} art={nft.art} light={light} mid={mid} animate={animate} />
      )}
      {nft.art.kind === "gem" && <GemArt uid={uid} art={nft.art} light={light} animate={animate} />}

      <rect width="400" height="400" filter={`url(#grain-${uid})`} opacity="0.55" />

      {/* Corner ticks — collectible framing */}
      {[
        [22, 22, 1, 1],
        [378, 22, -1, 1],
        [22, 378, 1, -1],
        [378, 378, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path
          key={i}
          d={`M${x} ${y + 16 * sy} L${x} ${y} L${x + 16 * sx} ${y}`}
          stroke={light}
          strokeOpacity="0.35"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

type RingArt = Extract<Nft["art"], { kind: "rings" }>;

function RingsArt({ uid, art, animate }: { uid: string; art: RingArt; animate: boolean }) {
  const rings = Array.from({ length: art.rings }, (_, i) => i);
  return (
    <g>
      <circle cx="200" cy="196" r="150" fill={`url(#halo-${uid})`} />
      {rings
        .slice()
        .reverse()
        .map((i) => {
          const r = 46 + i * 20;
          const opacity = 0.1 + i * 0.045;
          return (
            <circle
              key={`f-${i}`}
              cx="200"
              cy="196"
              r={r}
              fill={i % 2 === 0 ? art.glow : art.core}
              opacity={opacity}
              filter={`url(#soft-${uid})`}
            />
          );
        })}
      {rings.map((i) => {
        const r = 46 + i * 20;
        return (
          <circle
            key={`s-${i}`}
            cx="200"
            cy="196"
            r={r}
            fill="none"
            stroke={art.core}
            strokeOpacity={0.42 - i * 0.045}
            strokeWidth={i === 1 ? 2.2 : 1.2}
          />
        );
      })}
      <ellipse cx="200" cy="196" rx="44" ry="56" fill={art.core} opacity="0.5" />
      <ellipse cx="200" cy="190" rx="30" ry="40" fill={art.core} opacity="0.62" />
      {animate && (
        <>
          <circle cx="200" cy="196" r="150" fill="none" stroke={art.core} strokeOpacity="0.35" strokeWidth="1.4" className="origin-center animate-pulse-ring" />
          <circle cx="200" cy="196" r="150" fill="none" stroke={art.core} strokeOpacity="0.22" strokeWidth="1.2" className="origin-center animate-pulse-ring [animation-delay:1.6s]" />
        </>
      )}
      <rect width="400" height="400" fill={`url(#blade-${uid})`} opacity="0.35" />
    </g>
  );
}

type TargetArt = Extract<Nft["art"], { kind: "target" }>;

function TargetArt({ uid, art, light, animate }: { uid: string; art: TargetArt; light: string; animate: boolean }) {
  const rings = Array.from({ length: art.rings }, (_, i) => art.rings - i);
  return (
    <g>
      {/* Mounted card */}
      <rect x="72" y="86" width="256" height="188" rx="12" fill="#141517" stroke={light} strokeOpacity="0.14" />
      <rect x="94" y="106" width="212" height="128" rx="8" fill="#0B0C0E" />

      <circle cx="200" cy="170" r="76" fill={`url(#halo-${uid})`} opacity="0.55" />

      {rings.map((level, i) => (
        <circle
          key={i}
          cx="200"
          cy="170"
          r={level * 15}
          fill="none"
          stroke={i % 2 === 0 ? art.glow : art.core}
          strokeOpacity={0.75 - i * 0.12}
          strokeWidth={i === 0 ? 3 : 2.2}
        />
      ))}
      <circle cx="200" cy="170" r="7" fill={art.core} />
      <circle cx="200" cy="170" r="16" fill={art.core} opacity="0.35" filter={`url(#soft-${uid})`} />

      {animate && (
        <circle
          cx="200"
          cy="170"
          r="60"
          fill="none"
          stroke={art.core}
          strokeOpacity="0.4"
          strokeWidth="1.4"
          className="origin-[200px_170px] animate-pulse-ring"
        />
      )}

      {/* Triple-line strike */}
      {art.stripes.map((color, i) => (
        <rect
          key={color + i}
          x={84 + i * 80}
          y="256"
          width="68"
          height="12"
          rx="4"
          fill={color}
          opacity="0.95"
        />
      ))}
      <rect x="72" y="86" width="256" height="188" rx="12" fill="none" stroke={light} strokeOpacity="0.22" />
    </g>
  );
}

type WaveArt = Extract<Nft["art"], { kind: "waveform" }>;

function WaveformArt({
  uid,
  art,
  light,
  mid,
  animate,
}: {
  uid: string;
  art: WaveArt;
  light: string;
  mid: string;
  animate: boolean;
}) {
  return (
    <g>
      <circle cx="96" cy="120" r="86" fill={mid} opacity="0.35" filter={`url(#soft-${uid})`} />
      <circle cx="316" cy="286" r="104" fill={mid} opacity="0.28" filter={`url(#soft-${uid})`} />
      <circle cx="312" cy="104" r="58" fill={light} opacity="0.08" />
      <circle cx="96" cy="120" r="86" fill="none" stroke={light} strokeOpacity="0.09" />
      <circle cx="316" cy="286" r="104" fill="none" stroke={light} strokeOpacity="0.08" />

      {/* Grid */}
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={`gh-${i}`}
          x1="40"
          x2="360"
          y1={72 + i * 32}
          y2={72 + i * 32}
          stroke={light}
          strokeOpacity="0.05"
        />
      ))}

      {/* Waveform */}
      <path
        d="M40 236 C 96 236, 104 148, 152 148 C 200 148, 206 262, 254 262 C 296 262, 306 186, 360 186"
        fill="none"
        stroke={art.glow}
        strokeOpacity="0.35"
        strokeWidth="16"
        strokeLinecap="round"
        filter={`url(#soft-${uid})`}
      />
      <path
        d="M40 236 C 96 236, 104 148, 152 148 C 200 148, 206 262, 254 262 C 296 262, 306 186, 360 186"
        fill="none"
        stroke={art.stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M40 236 C 96 236, 104 148, 152 148 C 200 148, 206 262, 254 262 C 296 262, 306 186, 360 186"
        fill="none"
        stroke={light}
        strokeOpacity="0.5"
        strokeWidth="1.2"
        strokeDasharray="4 8"
      />
      <circle cx="152" cy="148" r="9" fill={art.node} />
      <circle cx="152" cy="148" r="22" fill={art.node} opacity="0.28" filter={`url(#soft-${uid})`} />
      <circle cx="254" cy="262" r="7" fill={art.node} opacity="0.85" />
      <circle cx="152" cy="148" r="30" fill="none" stroke={art.node} strokeOpacity="0.4" strokeWidth="1.3" className={animate ? "origin-[152px_148px] animate-pulse-ring" : undefined} />

      {/* Level meters */}
      {Array.from({ length: 22 }, (_, i) => {
        const h = 8 + ((i * 37) % 46);
        return (
          <rect
            key={`m-${i}`}
            x={54 + i * 14}
            y={340 - h}
            width="6"
            height={h}
            rx="3"
            fill={i % 3 === 0 ? art.node : art.stroke}
            opacity={0.55}
          />
        );
      })}
    </g>
  );
}

type GemArt = Extract<Nft["art"], { kind: "gem" }>;

function GemArt({ uid, art, light, animate }: { uid: string; art: GemArt; light: string; animate: boolean }) {
  const facetIndexes = Array.from({ length: art.facets }, (_, i) => i);
  const cx = 200;
  const cy = 194;
  const R = 96;

  const points = facetIndexes.map((i) => {
    const angle = (Math.PI * 2 * i) / art.facets - Math.PI / 2;
    return [cx + Math.cos(angle) * R, cy + Math.sin(angle) * R] as const;
  });

  return (
    <g>
      <circle cx={cx} cy={cy} r="168" fill={`url(#halo-${uid})`} />
      {[1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={40 + i * 26}
          fill="none"
          stroke={art.stroke}
          strokeOpacity={0.22 + i * 0.05}
          strokeWidth="1.3"
        />
      ))}
      <circle cx={cx} cy={cy} r="120" fill={art.glow} opacity="0.16" filter={`url(#soft-${uid})`} />

      {/* Faceted body */}
      <polygon
        points={points.map((p) => p.join(",")).join(" ")}
        fill={art.glow}
        opacity="0.35"
      />
      {points.map((p, i) => (
        <polygon
          key={i}
          points={`${cx},${cy} ${p[0]},${p[1]} ${points[(i + 1) % points.length].join(",")}`}
          fill={art.stroke}
          opacity={i % 2 === 0 ? 0.28 : 0.14}
          stroke={art.stroke}
          strokeOpacity="0.45"
          strokeWidth="1.1"
        />
      ))}
      <polygon
        points={points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={art.stroke}
        strokeWidth="2.4"
      />

      {/* Core star */}
      <circle cx={cx} cy={cy} r="16" fill={art.core} opacity="0.95" />
      <circle cx={cx} cy={cy} r="34" fill={art.core} opacity="0.28" filter={`url(#soft-${uid})`} />
      {art.facets % 2 === 0 &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return (
            <line
              key={`s-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(a) * 40}
              y2={cy + Math.sin(a) * 40}
              stroke={art.core}
              strokeOpacity="0.55"
              strokeWidth="1.6"
            />
          );
        })}

      {animate && (
        <>
          <circle cx={cx} cy={cy} r="132" fill="none" stroke={art.stroke} strokeOpacity="0.4" strokeWidth="1.3" className="origin-[200px_194px] animate-pulse-ring" />
          <circle cx={cx} cy={cy} r="132" fill="none" stroke={art.stroke} strokeOpacity="0.2" strokeWidth="1.1" className="origin-[200px_194px] animate-pulse-ring [animation-delay:1.4s]" />
        </>
      )}
    </g>
  );
}
