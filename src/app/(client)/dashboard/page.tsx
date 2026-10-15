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
          <Zap className="w-3.5 h-3.5" />
          <span>Open API House & Console</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Wallet Balance</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">
            ₹{(profile?.wallet?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Billing Model: {profile?.billingModel || "PREPAID"}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total API Hits</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">
            {profile?.stats?.totalHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">Live Gateway Hits</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">PAN Verifications</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">
            {profile?.stats?.totalPanHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Identity Suite</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Bank Verifications</div>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">
            {profile?.stats?.totalBankHits ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Penny Drop Suite</div>
        </div>
      </div>

      {/* Quick Integration Banner */}
      <div className="bg-[#09090b] text-white rounded-xl p-6 border border-neutral-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Live Gateway URL</div>
            <code className="text-base font-mono font-bold text-white mt-1 block">
              https://api.colladome.com/api/v1/...
            </code>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">Your Key:</span>
            <code className="text-xs bg-black px-2.5 py-1 rounded text-neutral-200 font-mono border border-neutral-800">
              {keyDisplay}
            </code>
            <Link
              href="/dashboard/keys"
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
            >
              Manage Keys
            </Link>
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-400 mb-1">Quick Sample cURL Request:</div>
          <pre className="p-3 bg-black rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto leading-relaxed">
{`curl -X POST "https://api.colladome.com/api/v1/verification/pan" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "x-client-order-id: ORDER_001" \\
  -H "Content-Type: application/json" \\
  -d '{"pan_number": "ABCDE1234F", "consent": "Y"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
