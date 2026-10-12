/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    // Lint is run separately in CI; a lint warning must never break a production deploy.
    ignoreDuringBuilds: true,
  },
  // The embedded development database ships WASM and the Postgres driver opens
  // TCP sockets, so neither may be bundled by the server compiler.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
