export type IconName =
  | "candlestick"
  | "piggy"
  | "rocket"
  | "shield"
  | "users"
  | "headset"
  | "userPlus"
  | "wallet"
  | "pie"
  | "coins"
  | "lock"
  | "chart"
  | "bolt";

export type Feature = {
  icon: IconName;
  title: string;
  body: string;
};

export const FEATURES: Feature[] = [
  {
    icon: "candlestick",
    title: "Advanced Trading",
    body: "Trade Forex, Crypto, Stocks, Indices, Commodities and ETFs with real-time charts and competitive spreads.",
  },
  {
    icon: "piggy",
    title: "Investment Plans",
    body: "Earn fixed ROI on daily, weekly, monthly or maturity-term plans with full capital protection options.",
  },
  {
    icon: "rocket",
    title: "IPO & Pre-IPO",
    body: "Get early access to promising companies before they hit the public markets.",
  },
  {
    icon: "shield",
    title: "Secure Wallet",
    body: "Your balances are protected with encrypted sessions, CSRF tokens, and detailed audit logs.",
  },
  {
    icon: "users",
    title: "Referral Rewards",
    body: "Invite friends and earn commissions on their trades and plan purchases.",
  },
  {
    icon: "headset",
    title: "24/7 Support",
    body: "Reach our support team anytime through tickets and in-app messaging.",
  },
];

export type Step = {
  number: string;
  icon: IconName;
  title: string;
  body: string;
};

export const STEPS: Step[] = [
  {
    number: "01",
    icon: "userPlus",
    title: "Create Account",
    body: "Register in minutes with your email and basic details.",
  },
  {
    number: "02",
    icon: "wallet",
    title: "Fund Wallet",
    body: "Deposit via your preferred crypto network — USDT, BTC, ETH, BNB or SOL.",
  },
  {
    number: "03",
    icon: "pie",
    title: "Trade or Invest",
    body: "Choose active trading or fixed-term investment plans.",
  },
  {
    number: "04",
    icon: "coins",
    title: "Earn & Withdraw",
    body: "Watch your portfolio grow and withdraw anytime.",
  },
];

export const SECURITY_POINTS = [
  "CSRF-protected forms and rate-limited login",
  "Complete transaction and audit history",
  "Encrypted password storage with bcrypt",
  "Manual review on every fiat and crypto deposit",
  "Two-factor authentication support",
  "Segregated client wallets with cold storage",
];

export type SecurityPillar = { icon: IconName; label: string };

export const SECURITY_PILLARS: SecurityPillar[] = [
  { icon: "lock", label: "Secure" },
  { icon: "chart", label: "Transparent" },
  { icon: "bolt", label: "Fast Execution" },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  rating: number;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Clear interface, fast execution, and the investment plans are a great way to earn passive ROI.",
    name: "Alex R.",
    role: "Crypto Trader",
    rating: 5,
  },
  {
    quote:
      "I love the transparent fee structure and the detailed portfolio tracking. Support is super helpful too.",
    name: "Maria T.",
    role: "Retail Investor",
    rating: 5,
  },
  {
    quote:
      "The charting integration and asset variety make this my go-to trading platform every morning.",
    name: "James K.",
    role: "Forex Trader",
    rating: 5,
  },
];

export type Faq = { question: string; answer: string };

export const FAQS: Faq[] = [
  {
    question: "How do I create an account?",
    answer:
      "Click “Create Free Account”, choose whether you are registering as an individual or a joint account, then complete the short form with your name, email, phone number, date of birth, address, country and occupation. You will set a password on the same screen. Registration takes about three minutes, and a welcome email with your unique Account ID is sent to your inbox immediately.",
  },
  {
    question: "What assets can I trade?",
    answer:
      "Valtra Assets gives you access to 85+ tradeable instruments across six categories: Forex majors and crosses such as EUR/USD, GBP/USD and USD/JPY; crypto including Bitcoin, Ethereum, Solana and BNB; metals such as gold and silver; energy and agricultural commodities; global indices including the S&P 500 and Nasdaq 100; and a curated list of ETFs and pre-IPO allocations.",
  },
  {
    question: "How do investment plans work?",
    answer:
      "Choose one of our three fixed-term plans — Starter (5% over 30 days), Growth (12% over 90 days, paid monthly) or Premium Weekly Yield (18% over 60 days, paid weekly). Select the amount within the plan's minimum and maximum, confirm it, and transfer the funds to the settlement wallet shown on the deposit page with your reference. Once our team verifies the transfer, ROI accrues from that moment. Capital is returned with your final payout.",
  },
  {
    question: "Is my money safe?",
    answer:
      "Client funds are held in segregated wallets with cold storage for the majority of balances, and every deposit passes a manual verification step before it is credited. Your account is protected by bcrypt-hashed credentials, CSRF-protected forms, rate-limited login attempts, secure HTTP-only sessions and a full audit trail of every balance movement. We never ask for your password or your seed phrase.",
  },
  {
    question: "How do I deposit or withdraw?",
    answer:
      "Open your dashboard, go to Deposit, pick the network you want to use and copy the settlement address. Send the crypto, then submit the transaction hash together with the amount on the same page — this creates a trackable payment record and alerts our team instantly. Withdrawals can be requested from the dashboard at any time and are processed to the same wallet you deposited from.",
  },
  {
    question: "How long does approval take?",
    answer:
      "Deposits are manually verified against the blockchain, which usually takes under 30 minutes during business hours and never longer than 12 hours. Bitcoin deposits require one network confirmation before we can match them. Withdrawals on the Premium weekly plan are prioritised and settle within 24 hours.",
  },
  {
    question: "Can I open a joint or corporate account?",
    answer:
      "Yes. Select “Joint / Corporate” during registration and a second account-holder section appears. Both holders' details are stored on the same account, which is useful for family, trust or company registration. You can also add a secondary holder later by contacting support from your registered email address.",
  },
];

export const HERO_SLIDES = [
  {
    word: "Investment Plans",
    tone: "#C9A227",
    eyebrow: "Fixed-term returns",
  },
  {
    word: "Global Markets",
    tone: "#2FBF71",
    eyebrow: "85+ instruments",
  },
  {
    word: "Live Wallet",
    tone: "#4FB8B4",
    eyebrow: "Instant settlement",
  },
] as const;

export const HERO_STATS = [
  { value: "5+", label: "Active Traders" },
  { value: "85+", label: "Tradeable Assets" },
  { value: "4+", label: "Investment Plans" },
] as const;
