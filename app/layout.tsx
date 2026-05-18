import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Notifications } from "./components/notification/notifications";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
const yekanbakh = localFont({
  src: [
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/yekanbakh/YekanBakhFaNum-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-yekanbakh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سامانه اتوماسیون اداری",
  description: "اتوماسیون دیجیتالی فرآیندهای اداری، مالی و انباری",
};

/** موبایل‌اول: عرض دستگاه، امن‌ایrea، و اجازهٔ زوم برای دسترسی‌پذیری */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.9755 0.0029 264.54)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.145 0.00 260)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" className={`h-full ${yekanbakh.variable} ${yekanbakh.className}`}>
      <body
        className="h-dvh max-h-dvh overflow-hidden bg-background font-sans touch-manipulation overflow-x-hidden antialiased"
        dir="rtl"
      >
        <Notifications />
        {children}
      </body>
    </html>
  );
}
