import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "1024mb",
    serverActions: {
      bodySizeLimit: "1024mb",
    },
  },
};

export default nextConfig;
