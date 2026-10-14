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
  const sampleKey = "cd_live_acme_prod_secret_88319a2b";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {profile?.companyName || "Acme Fintech Solutions"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time API consumption metrics, wallet balance, and integration credentials
          </p>
        </div>

        <Link
          href="/dashboard/apis"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Open API House & Console</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wallet Balance</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{profile?.wallet?.balance?.toFixed(2) || "45,200.00"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Billing Model: {profile?.billingModel || "PREPAID"}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total API Hits</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {profile?.stats?.totalHits || "6"}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">100% Success Rate</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PAN Verifications</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {profile?.stats?.totalPanHits || "4"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Special Volume Rate: ₹2.10 / hit</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank Verifications</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {profile?.stats?.totalBankHits || "2"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Penny Drop Rate: ₹3.50 / hit</div>
        </div>
      </div>

      {/* Quick Integration Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Live Gateway URL</div>
            <code className="text-base font-mono font-bold text-white mt-1 block">
              https://api.colladome.com/v1/...
            </code>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Your Key:</span>
            <code className="text-xs bg-slate-950 px-2 py-1 rounded text-emerald-400 font-mono border border-slate-800">
              {sampleKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleKey);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1">Quick Sample cURL Request:</div>
          <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
{`curl -X POST "http://localhost:3000/api/v1/verification/pan" \\
  -H "x-api-key: ${sampleKey}" \\
  -H "x-client-order-id: CLI_PAN_001" \\
  -H "Content-Type: application/json" \\
  -d '{"pan_number": "AAACA5678B", "consent": "Y"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
