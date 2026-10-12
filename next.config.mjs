/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    // Lint is run separately in CI; a lint warning must never break a production deploy.
    ignoreDuringBuilds: true,
  },
  // The embedded development database ships WASM that must not be bundled.
  // The Postgres drivers are left to the bundler so every deployment carries
  // them, instead of depending on runtime node_modules resolution.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
