export type Nft = {
  slug: string;
  name: string;
  series: string;
  category: "Photography" | "Sports" | "Music" | "Collectibles";
  priceUsd: number;
  priceEth: number;
  edition: string;
  rarity: string;
  chain: string;
  tokenStandard: string;
  contract: string;
  tokenId: string;
  creator: string;
  createdOn: string;
  description: string;
  highlights: string[];
  traits: { label: string; value: string; rarity: string }[];
  palette: [string, string, string];
  /** Deterministic art recipe rendered as inline SVG by <NftArtwork />. */
  art:
    | { kind: "rings"; rings: number; core: string; glow: string; hue: number }
    | { kind: "target"; rings: number; core: string; glow: string; stripes: [string, string, string] }
    | { kind: "waveform"; stroke: string; node: string; glow: string }
    | { kind: "gem"; stroke: string; core: string; glow: string; facets: number };
};

export const NFTS: Nft[] = [
  {
    slug: "dream-catcher-010",
    name: "Dream Catcher #010",
    series: "Photography Series",
    category: "Photography",
    priceUsd: 120.0,
    priceEth: 0.0343,
    edition: "1 of 25",
    rarity: "Rare",
    chain: "Ethereum",
    tokenStandard: "ERC-721",
    contract: "0x4b1d…9fA2",
    tokenId: "010",
    creator: "Studio Halcyon",
    createdOn: "2026-02-14",
    description:
      "A long-exposure study of light passing through hand-woven fibre. Dream Catcher #010 is the tenth frame from a 25-piece photography series captured across four nights in northern Portugal. Each ring is a separate exposure stacked in-camera — no compositing, no filters.",
    highlights: [
      "Original RAW file and 8000×8000 TIFF delivered to the holder",
      "Printed once at 1.4 m on museum cotton rag for the primary sale",
      "Commercial licensing rights transfer to the holder",
      "Unlockable gallery walkthrough video for verified owners",
    ],
    traits: [
      { label: "Medium", value: "Long-exposure photography", rarity: "—" },
      { label: "Rings", value: "6 stacked exposures", rarity: "12% have 6+" },
      { label: "Palette", value: "Amethyst / Rose", rarity: "18%" },
      { label: "Location", value: "Northern Portugal", rarity: "8%" },
      { label: "Resolution", value: "8000 × 8000 px", rarity: "Top 5%" },
    ],
    palette: ["#2B0E33", "#7B3350", "#F0A6B7"],
    art: { kind: "rings", rings: 6, core: "#F4B9C6", glow: "#C05E86", hue: 322 },
  },
  {
    slug: "golden-bull-008",
    name: "Golden Bull #008",
    series: "Sports Trading Card",
    category: "Sports",
    priceUsd: 350.0,
    priceEth: 0.1,
    edition: "1 of 10",
    rarity: "Epic",
    chain: "Ethereum",
    tokenStandard: "ERC-721",
    contract: "0x91cE…44Bd",
    tokenId: "008",
    creator: "Valtra Assets Studio",
    createdOn: "2026-01-08",
    description:
      "The flagship card of the Sports Trading Card collection. Golden Bull #008 renders a bullseye formation in the classic market-red / amber / green triple stripe — a nod to the candlestick three-line strike pattern traders watch for before a breakout.",
    highlights: [
      "Physical twin card minted in brushed brass and shipped free worldwide",
      "Guaranteed allocation in the next Valtra IPO tranche",
      "0.5% lifetime rebate on all trading fees for the holder",
      "Access to the quarterly holders' trading desk briefing",
    ],
    traits: [
      { label: "Strike pattern", value: "Triple-line bullish", rarity: "9%" },
      { label: "Foil", value: "Anodised gold", rarity: "15%" },
      { label: "Card grade", value: "Gem mint 10", rarity: "4%" },
      { label: "Sub-collection", value: "Market Icons", rarity: "20%" },
      { label: "Utility", value: "IPO allocation", rarity: "Top 3%" },
    ],
    palette: ["#1A1A1A", "#C9A227", "#E2452F"],
    art: {
      kind: "target",
      rings: 4,
      core: "#FFD056",
      glow: "#E2452F",
      stripes: ["#E2452F", "#F2A63B", "#2FBF71"],
    },
  },
  {
    slug: "waveform-007",
    name: "Waveform #007",
    series: "Audio NFT — Electronic",
    category: "Music",
    priceUsd: 45.0,
    priceEth: 0.0129,
    edition: "1 of 100",
    rarity: "Uncommon",
    chain: "Polygon",
    tokenStandard: "ERC-721",
    contract: "0x7aF3…10Cc",
    tokenId: "007",
    creator: "Nadia Volkov",
    createdOn: "2026-03-02",
    description:
      "A generative audio piece: 24 minutes of modular synthesis compressed into a single on-chain waveform. The artwork you see is the actual master waveform of the track — rendered straight from the audio buffer, so each holder owns provably unique sound.",
    highlights: [
      "Lossless 24-bit WAV master + 4 stems unlocked on purchase",
      "Royalty split: 7.5% of secondary sales back to the artist AND holder",
      "Licence to remix commercially with attribution",
      "Private listening room invite for the first 100 holders",
    ],
    traits: [
      { label: "Genre", value: "Modular electronic", rarity: "22%" },
      { label: "Duration", value: "24 min 06 s", rarity: "7%" },
      { label: "Stems", value: "4 included", rarity: "11%" },
      { label: "Rendering", value: "Direct from master", rarity: "Top 10%" },
      { label: "Royalty", value: "7.5% split", rarity: "13%" },
    ],
    palette: ["#05263B", "#0E5C6B", "#6FE3C4"],
    art: { kind: "waveform", stroke: "#6FE3C4", node: "#9BF3DC", glow: "#1FA9A0" },
  },
  {
    slug: "ruby-heart-005",
    name: "Ruby Heart #005",
    series: "Valentine Special",
    category: "Collectibles",
    priceUsd: 99.99,
    priceEth: 0.0286,
    edition: "1 of 50",
    rarity: "Rare",
    chain: "Ethereum",
    tokenStandard: "ERC-721",
    contract: "0x33Ab…7e19",
    tokenId: "005",
    creator: "Atelier Rouge",
    createdOn: "2026-02-14",
    description:
      "A faceted ruby heart cut into 12 planes and lit from within. Ruby Heart #005 is the anniversary drop of the Valentine Special line — each edition carries a different facet count, and #005 is the only piece with a centred six-point core.",
    highlights: [
      "Hand-cut gemstone miniature posted to the holder on request",
      "Guaranteed seat at the annual Valtra collectors' gala",
      "Staking eligibility: 3% annual yield on the floor price",
      "Airdrop eligibility for all future Atelier Rouge mints",
    ],
    traits: [
      { label: "Facets", value: "12 planes", rarity: "10%" },
      { label: "Core", value: "Six-point star", rarity: "2%" },
      { label: "Cut", value: "Brilliant", rarity: "16%" },
      { label: "Sub-collection", value: "Valentine Special", rarity: "25%" },
      { label: "Yield", value: "3% p.a. staking", rarity: "Top 6%" },
    ],
    palette: ["#2A0508", "#8E1020", "#F24B5E"],
    art: { kind: "gem", stroke: "#F24B5E", core: "#FFD8DE", glow: "#B01230", facets: 6 },
  },
];

export function getNft(slug: string | null | undefined): Nft | undefined {
  if (!slug) return undefined;
  return NFTS.find((n) => n.slug === slug.toLowerCase());
}

export function nftHref(slug: string): string {
  return `/dashboard/nft/${slug}`;
}

export const NFT_STATS = [
  { value: "$2.4B", label: "Total Market Volume" },
  { value: "1.2M", label: "Active Collectors" },
  { value: "85K", label: "Collections Listed" },
  { value: "$450K", label: "Highest Sale (24h)" },
];

export type NftNewsItem = {
  tag: string;
  tone: string;
  time: string;
  title: string;
  body: string;
  metric: string;
};

export const NFT_NEWS: NftNewsItem[] = [
  {
    tag: "Trending",
    tone: "#27B58D",
    time: "2 hours ago",
    title: "Valtra Launches Native NFT Marketplace",
    body: "The platform now supports minting, trading and collecting digital assets across multiple blockchains including Ethereum, Polygon and Solana.",
    metric: "Trading volume up 240% since launch",
  },
  {
    tag: "Market",
    tone: "#4FB8B4",
    time: "5 hours ago",
    title: "Digital Art Sales Surge 340% This Quarter",
    body: "Generative art and 3D collections are leading the charge as collectors seek unique, verifiable digital ownership on-chain.",
    metric: "Art category up 340% QoQ",
  },
  {
    tag: "Gaming",
    tone: "#8B5CF6",
    time: "1 day ago",
    title: "Gaming NFTs Now Support Cross-Platform Use",
    body: "New interoperability standards allow in-game assets to transfer between metaverses. Valtra's Gaming category sees record volume.",
    metric: "Gaming assets +180% this month",
  },
  {
    tag: "Music",
    tone: "#F2A63B",
    time: "2 days ago",
    title: "Major Labels Enter the NFT Music Space",
    body: "Top recording artists now release limited-edition audio NFTs with built-in royalty splits for collectors and creators.",
    metric: "Music NFTs +95% new listings",
  },
  {
    tag: "Sports",
    tone: "#E2452F",
    time: "3 days ago",
    title: "Sports Memorabilia Goes Digital-First",
    body: "Trading cards and athlete moments are shifting to blockchain. Verified authenticity and instant global trading drive adoption.",
    metric: "Sports category top 3 by volume",
  },
  {
    tag: "Metaverse",
    tone: "#0E5C6B",
    time: "4 days ago",
    title: "Virtual Land NFTs Hit New Price Records",
    body: "Premium metaverse parcels trade at all-time highs. Location-based scarcity models drive value in virtual real estate.",
    metric: "Avg. land price up 65% this month",
  },
];
