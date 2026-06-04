import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    /** پیش‌فرض Next حدود ۱MB — برای پیوست تا ۲۵MB و آواتار ۱۰MB */
    serverActions: {
      bodySizeLimit: "35mb",
    },
  },
};

export default nextConfig;
