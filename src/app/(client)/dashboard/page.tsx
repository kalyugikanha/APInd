"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Layers,
  Key,
  Wallet,
  Lock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  Zap,
} from "lucide-react";

export default function ClientDashboardOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) setProfile(data.client);
      })
      .catch((err) => console.error(err));
  }, []);

  const activeLiveKey = profile?.apiKeys?.find((k: any) => k.type === "PRODUCTION" && k.isActive);
  const keyDisplay = activeLiveKey ? `${activeLiveKey.keyPrefix}${activeLiveKey.keyHint}` : "No Active Key";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome, {profile?.companyName || profile?.fullName || "Client Workspace"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time API consumption metrics, wallet balance, and integration credentials
          </p>
        </div>

        <Link
          href="/dashboard/apis"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Browse Available APIs</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Wallet Balance</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">
            ₹{(profile?.wallet?.balance ?? 0).toFixed(2)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[11px]">
            <span className="text-neutral-400">Model: {profile?.billingModel || "PREPAID"}</span>
            <Link href="/dashboard/wallet" className="text-neutral-900 font-semibold hover:underline">
              Manage Wallet →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total API Hits</span>
            <Activity className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">
            {profile?.stats?.totalHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-2 pt-2 border-t border-neutral-100">
            All Production & Test Calls
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">PAN Verifications</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">
            {profile?.stats?.totalPanHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-2 pt-2 border-t border-neutral-100">
            Detailed Identity Suite
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Bank Verifications</span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">
            {profile?.stats?.totalBankHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-2 pt-2 border-t border-neutral-100">
            Penny Drop Suite
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/apis"
          className="group bg-white p-5 rounded-xl border border-neutral-200 hover:border-black shadow-sm transition space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-black group-hover:text-white transition">
            <Layers className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-neutral-900">API Catalog & Documentation</div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            View available APIs, request endpoints, parameters, sample schemas, and cURL commands.
          </p>
          <span className="text-xs font-semibold text-neutral-900 inline-flex items-center gap-1 pt-1">
            Browse APIs <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </span>
        </Link>

        <Link
          href="/dashboard/keys"
          className="group bg-white p-5 rounded-xl border border-neutral-200 hover:border-black shadow-sm transition space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-black group-hover:text-white transition">
            <Key className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-neutral-900">API Credentials</div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Access your dedicated Production (<span className="font-mono text-[10px]">cd_live_</span>) and Sandbox (<span className="font-mono text-[10px]">cd_test_</span>) keys.
          </p>
          <span className="text-xs font-semibold text-neutral-900 inline-flex items-center gap-1 pt-1">
            Manage Keys <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </span>
        </Link>

        <Link
          href="/dashboard/security"
          className="group bg-white p-5 rounded-xl border border-neutral-200 hover:border-black shadow-sm transition space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-black group-hover:text-white transition">
            <Lock className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-neutral-900">Security & IP Whitelist</div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Restrict gateway requests to your authorized server IPs or configure open testing access.
          </p>
          <span className="text-xs font-semibold text-neutral-900 inline-flex items-center gap-1 pt-1">
            Configure Security <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </span>
        </Link>
      </div>
    </div>
  );
}
