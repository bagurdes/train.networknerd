/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  images: {
    // Phase 2: add R2 / Cloudflare hostname here once media uploads land.
    remotePatterns: [],
  },
};
export default nextConfig;
