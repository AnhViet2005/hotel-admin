import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

import LayoutContent from "@/components/layout/LayoutContent";

export const metadata: Metadata = {
  title: "Cybertron Hotel Admin Dashboard",
  description: "Dịch vụ quản trị khách sạn cao cấp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased h-screen overflow-hidden`}>
        <LayoutContent>
          {children}
        </LayoutContent>
      </body>
    </html>
  );
}
