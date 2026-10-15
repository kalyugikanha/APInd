import type { Metadata } from "next";
import "./globals.css";
import PublicNavbar from "@/components/public/PublicNavbar";

export const metadata: Metadata = {
  title: "Colladome - Unified Verification & Banking API Infrastructure",
  description: "Enterprise Indian Identity, Banking, and Compliance APIs with 99.9% multi-provider redundancy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans antialiased selection:bg-black selection:text-white">
        {/* Route-aware Public Header (only visible on marketing pages, auto-hidden on /admin and /dashboard) */}
        <PublicNavbar />

        {/* Content Body */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
