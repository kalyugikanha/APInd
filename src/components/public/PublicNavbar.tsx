"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicNavbar() {
  const pathname = usePathname();

  // Hide the public marketing navbar inside admin portal, client portal, and auth screens
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center font-extrabold text-white text-sm shadow-sm group-hover:scale-105 transition">
              C
            </div>
            <span className="font-extrabold text-lg tracking-tight text-neutral-900">
              COLLADOME
            </span>
          </Link>

          {/* Public Marketing Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-neutral-600">
            <Link href="/apis" className="hover:text-black transition">
              APIs
            </Link>
            <Link href="/industries" className="hover:text-black transition">
              Industries
            </Link>
            <Link href="/about" className="hover:text-black transition">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-black transition">
              Contact
            </Link>
          </nav>
        </div>

        {/* Portal Switcher & Action Links */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="hidden lg:flex items-center gap-1 bg-neutral-100 p-1 rounded-full border border-neutral-200">
            <Link
              href="/admin/dashboard"
              className="px-3 py-1 rounded-full text-neutral-600 hover:text-black hover:bg-white transition"
            >
              Admin Portal
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded-full text-neutral-600 hover:text-black hover:bg-white transition"
            >
              Client Portal
            </Link>
          </div>

          <Link
            href="/login"
            className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-800 hover:border-black hover:bg-neutral-50 transition"
          >
            Sign In
          </Link>

          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white font-bold transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
