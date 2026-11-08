import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 아바타 업로드(최대 5MB) + multipart 오버헤드를 수용. 기본값은 1MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
