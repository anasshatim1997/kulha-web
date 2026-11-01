import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/ary", destination: "/ar", permanent: true },
      { source: "/ary/:path*", destination: "/ar/:path*", permanent: true },
      { source: "/ary-latn", destination: "/ar", permanent: true },
      { source: "/ary-latn/:path*", destination: "/ar/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
