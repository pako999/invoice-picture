import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/en/:path*",
        headers: [{ key: "Content-Language", value: "en" }],
      },
      {
        source: "/en",
        headers: [{ key: "Content-Language", value: "en" }],
      },
    ];
  },
};

export default nextConfig;
