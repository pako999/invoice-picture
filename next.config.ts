import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      // Near-duplicate of /programi-za-racune; consolidated to stop the two
      // pages competing for "program za račune" queries.
      { source: "/program-za-racune", destination: "/programi-za-racune", permanent: true },
    ];
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
