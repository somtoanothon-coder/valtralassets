import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#05212C",
          900: "#04191F",
          800: "#05212C",
          700: "#07283A",
          600: "#0A3140",
          500: "#0B3C4A",
        },
        brand: {
          navy: "#09254A",
          deep: "#0B3C4A",
          700: "#11606F",
          600: "#127D77",
          500: "#1E8A94",
          400: "#4FB8B4",
          300: "#99D8D0",
          200: "#C6EAE3",
          100: "#E3F3F0",
          green: "#27B58D",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(79,184,180,0.18), 0 18px 60px -18px rgba(39,181,141,0.45)",
        card: "0 1px 0 0 rgba(227,243,240,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.9)",
        pill: "0 10px 30px -12px rgba(39,181,141,0.6)",
      },
      backgroundImage: {
        "brand-grad": "linear-gradient(115deg,#27B58D 0%,#4FB8B4 45%,#1E8A94 100%)",
        "brand-grad-soft": "linear-gradient(135deg,rgba(39,181,141,0.18) 0%,rgba(30,138,148,0.14) 100%)",
        "panel": "linear-gradient(180deg,rgba(11,60,74,0.55) 0%,rgba(7,40,58,0.35) 100%)",
        grid: "linear-gradient(rgba(153,216,208,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(153,216,208,0.055) 1px,transparent 1px)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(-50%,0,0)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.55" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        marquee: "marquee 46s linear infinite",
        "marquee-fast": "marquee 28s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        "pulse-ring": "pulseRing 3.2s cubic-bezier(0.24,0.8,0.32,1) infinite",
        rise: "rise .6s cubic-bezier(0.22,1,0.36,1) both",
        sweep: "sweep 3.4s ease-in-out infinite",
        "spin-slow": "spinSlow 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
