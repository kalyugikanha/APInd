import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard, Code, ArrowRight } from "lucide-react";

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
      <body className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
        {/* Global Clean Navigation Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-extrabold text-white text-sm shadow-sm group-hover:scale-105 transition">
                  C
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-950">
                  COLLADOME
                </span>
              </Link>

              {/* Public Marketing Links */}
              <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
                <Link href="/apis" className="hover:text-slate-950 transition">
                  APIs
                </Link>
                <Link href="/industries" className="hover:text-slate-950 transition">
                  Industries
                </Link>
                <Link href="/about" className="hover:text-slate-950 transition">
                  About Us
                </Link>
                <Link href="/contact" className="hover:text-slate-950 transition">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Portal Switcher & Action Links */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-1 rounded-full text-slate-600 hover:text-slate-950 hover:bg-white transition"
                >
                  Admin Portal
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 py-1 rounded-full text-slate-600 hover:text-slate-950 hover:bg-white transition"
                >
                  Client Portal
                </Link>
              </div>

              <Link
                href="/login"
                className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 hover:border-slate-950 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>

              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-slate-950 hover:bg-black text-white font-bold transition shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
