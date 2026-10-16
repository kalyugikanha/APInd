"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Key,
  Wallet,
  Lock,
  FileCheck2,
  Bell,
  ChevronDown,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) setProfile(data.client);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/internal/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/login";
  };

  const sections = [
    {
      title: "WORKSPACE",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "API House & Console", href: "/dashboard/apis", icon: Layers },
      ],
    },
    {
      title: "DEVELOPER ACCESS",
      items: [
        { label: "API Credentials", href: "/dashboard/keys", icon: Key },
        { label: "IP Whitelist & Security", href: "/dashboard/security", icon: Lock },
      ],
    },
    {
      title: "BILLING & AUDIT",
      items: [
        { label: "Wallet & Passbook", href: "/dashboard/wallet", icon: Wallet },
        { label: "Verification Reports", href: "/dashboard/reports", icon: FileCheck2 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Bar Matching Reference Image 2 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-extrabold text-white text-sm shadow-sm">
              C
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Client Portal
            </span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {profile?.companyName || "Client Workspace"} {profile?.clientCode ? `(${profile.clientCode})` : ""}
          </span>
        </div>

        {/* Right User Bar matching Reference Image 2 */}
        <div className="flex items-center gap-4">
          {/* Live Wallet Balance Pill */}
          <div className="bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Balance:</span>
            <strong className="text-slate-900 font-bold font-mono">
              ₹{(profile?.wallet?.balance ?? 0).toFixed(2)}
            </strong>
          </div>

          {/* Notification Bell */}
          <div className="relative cursor-pointer text-slate-500 hover:text-slate-800 transition">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white font-bold text-[9px] flex items-center justify-center">
              1
            </span>
          </div>

          {/* User Profile */}
          <div className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 cursor-pointer select-none p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                {profile?.fullName ? profile.fullName[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {profile?.companyName || profile?.fullName || "Client Workspace"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 p-2 text-xs space-y-1 z-50">
                <div className="px-3 py-1.5 font-semibold text-slate-900 border-b border-slate-100">
                  {profile?.fullName || "Vikram Malhotra"}
                  <div className="text-[10px] text-slate-400 font-normal">{profile?.email}</div>
                </div>
                {(profile?.role === "SUPER_ADMIN" || profile?.role === "ADMIN_STAFF") && (
                  <Link
                    href="/admin/dashboard"
                    className="block px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-blue-600"
                  >
                    Super Admin Console
                  </Link>
                )}
                <Link
                  href="/dashboard/apis"
                  className="block px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  API Catalog & Docs
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Crisp White Sidebar Matching Reference Image 2 */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-5 flex-1">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                        isActive
                          ? "bg-slate-100 text-slate-950 font-bold"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Viewport Content */}
        <main className="flex-1 overflow-x-hidden p-6 sm:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
