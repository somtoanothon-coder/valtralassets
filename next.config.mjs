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
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
