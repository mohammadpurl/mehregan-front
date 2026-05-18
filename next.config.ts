import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    /** محدودیت پیش‌فرض Server Action = 1MB؛ برای آپلود آواتار تا ۵MB */
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
