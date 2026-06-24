import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    /** پیش‌فرض Next حدود ۱MB — برای پیوست تا ۲۵MB و آواتار ۱۰MB */
    serverActions: {
      bodySizeLimit: "35mb",
    },
  },
  turbopack: {
    resolveAlias: {
      "@classbon/icons": path.join(__dirname, "lib/classbon-icons.tsx"),
      "@/_components/general/button": path.join(
        __dirname,
        "app/components/button.tsx"
      ),
      "@/_components/general/textbox": path.join(
        __dirname,
        "app/components/textbox.tsx"
      ),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@classbon/icons": path.join(__dirname, "lib/classbon-icons.tsx"),
      "@/_components/general/button": path.join(
        __dirname,
        "app/components/button.tsx"
      ),
      "@/_components/general/textbox": path.join(
        __dirname,
        "app/components/textbox.tsx"
      ),
    };
    return config;
  },
};

export default nextConfig;
