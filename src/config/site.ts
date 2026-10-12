/**
 * Central site configuration for Valtra Assets.
 *
 * Everything brand-related that the owner may want to change without touching
 * application logic lives here. Values can be overridden at deploy time with
 * environment variables (see .env.example) so nothing secret ends up in git.
 */

export const SITE = {
  name: "Valtra Assets",
  shortName: "Valtra",
  /** Wordmark exactly as it appears in the brand logo. */
  wordmark: "VALTRALASSETS",
  domain: "valtralassets.online",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://valtralassets.online",
  tagline: "A secure, all-in-one trading and investment platform for modern investors.",
  description:
    "Valtra Assets gives you access to global markets, fixed-term investment plans, IPOs and a secure multi-asset wallet — all in one powerful platform built for modern traders and investors.",
  foundedYear: 2026,
} as const;

export const CONTACT = {
  /** Public support inbox shown across the site. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@valtralassets.online",
  /** Where new-account / payment notifications are delivered (the owner's inbox). */
  adminEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    "support@valtralassets.online",
  /** Where users are told to send proof-of-payment details. */
  paymentsEmail: process.env.NEXT_PUBLIC_PAYMENTS_EMAIL || "payments@valtralassets.online",
  responseTime: "Under 6 hours, 24/7",
} as const;

/**
 * Deposit / settlement wallet addresses.
 *
 * ⚠️  REPLACE THE PLACEHOLDERS BELOW WITH THE CLIENT'S REAL WALLET ADDRESSES,
 *     or set the matching environment variables in Netlify (recommended).
 *     Either place works — environment variables win.
 */
export const WALLETS = [
  {
    id: "usdt-bep20",
    asset: "USDT",
    network: "BNB Smart Chain (BEP20)",
    address: process.env.NEXT_PUBLIC_WALLET_USDT_BEP20 || "0xD1D9cb3318191e4486fC3Fd289b350BbD925822e",
    note: "BEP20 USDT only. Do not send ERC20 or TRC20 USDT here.",
    color: "#26A17B",
    image: "/crypto/usdt.svg",
  },
  {
    id: "usdt-trc20",
    asset: "USDT",
    network: "TRON (TRC20)",
    address: process.env.NEXT_PUBLIC_WALLET_USDT_TRC20 || "TPRaxuUZtGVTBZEftweZgfWkh9XjpCp82z",
    note: "Lowest network fee. Use TRC20 only — do not send ERC20 USDT here.",
    color: "#26A17B",
    image: "/crypto/trc20.jpeg",
  },
  {
    id: "btc",
    asset: "Bitcoin",
    network: "Bitcoin Network",
    address: process.env.NEXT_PUBLIC_WALLET_BTC || "bc1qq0tllkehv0wt0ernjdzal73eylne05ku7nky6c",
    note: "BTC only. Confirmations take ~10–30 minutes.",
    color: "#F7931A",
    image: "/crypto/btc.svg",
  },
  {
    id: "bnb",
    asset: "BNB",
    network: "BNB Smart Chain (BEP20)",
    address: process.env.NEXT_PUBLIC_WALLET_BNB || "0xD1D9cb3318191e4486fC3Fd289b350BbD925822e",
    note: "BNB Smart Chain only. Fast and inexpensive.",
    color: "#F3BA2F",
    image: "/crypto/bnb-coin.jpeg",
  },
  {
    id: "usdc-bep20",
    asset: "USDC",
    network: "BNB Smart Chain (BEP20)",
    address: process.env.NEXT_PUBLIC_WALLET_USDC_BEP20 || "0xD1D9cb3318191e4486fC3Fd289b350BbD925822e",
    note: "BEP20 USDC only. Send on BNB Smart Chain.",
    color: "#2775CA",
    image: "/crypto/usdc-coin.jpeg",
  },
  {
    id: "sol",
    asset: "Solana",
    network: "Solana Network",
    address: process.env.NEXT_PUBLIC_WALLET_SOL || "GmbvkMDqX2CjWigvMzyjjPoKsGvLVgbp1Pp3kwn9Q2Un",
    note: "SOL only. Send on the Solana network.",
    color: "#14F195",
    image: "/crypto/solana-coin.jpeg",
  },
  {
    id: "usdc-sui",
    asset: "USDC",
    network: "Sui Network",
    address: process.env.NEXT_PUBLIC_WALLET_USDC_SUI || "0xff464182256b935b73febb5b140e55249922a6a65f2204e17c54b998ab0081dc",
    note: "USDC on Sui only. Send on the Sui network.",
    color: "#2775CA",
    image: "/crypto/usdc-coin.jpeg",
  },
] as const;

export type WalletOption = (typeof WALLETS)[number];

export const DEFAULT_PAYMENT_WALLET_ID = "usdt-trc20";

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#markets", label: "Markets" },
  { href: "/#nft", label: "NFT Marketplace" },
  { href: "/#plans", label: "Investment Plans" },
  { href: "/#faq", label: "FAQ" },
] as const;

/** Countries offered on the registration form. */
export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "New Zealand", "Ireland",
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
  "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iraq", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
  "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;
