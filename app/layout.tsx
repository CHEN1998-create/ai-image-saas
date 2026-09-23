import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Lumen — 现代 AI 生图平台",
  description:
    "面向创作者与独立开发者的现代 AI 生图 SaaS 平台：生成、分享、互动。",
  keywords: ["AI 生图", "AI image generation", "text to image", "SaaS"]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
