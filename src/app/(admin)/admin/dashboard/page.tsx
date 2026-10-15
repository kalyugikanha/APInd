"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Users,
  Layers,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "success" | "failed">("all");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState("");

  const fetchStats = () => {
    setLoading(true);
    fetch("/api/internal/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredHits = (stats?.recentHits || []).filter((hit: any) => {
    if (activeTab === "success" && hit.status !== "SUCCESS") return false;
    if (activeTab === "failed" && hit.status === "SUCCESS") return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        hit.orderId.toLowerCase().includes(q) ||
        hit.clientName.toLowerCase().includes(q) ||
        hit.apiName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header matching Reference Image 2 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Gateway Overview & Reconciliations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time verification hit stream, profit margins, and provider health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/clients/new"
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-black text-white text-xs font-bold transition"
          >
            + Register Client
          </Link>
        </div>
      </div>

      {/* KPI Cards Row (Monochrome & Clean White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total API Hits</div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {stats?.summary?.totalHits?.toLocaleString() || "0"}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {stats?.summary?.successRate || "100"}% Success Rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales (Retail)</div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            ₹{(stats?.summary?.grossRevenue || 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Wallet deductions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Commission / Profit</div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            ₹{(stats?.summary?.netProfitMargin || 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Provider Cost: ₹{(stats?.summary?.totalProviderCost || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Onboarded Clients</div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {stats?.summary?.totalClients || "0"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats?.summary?.activeClients || "0"} Active • {stats?.summary?.pendingClients || "0"} Pending KYC
          </div>
        </div>
      </div>

      {/* Upstream Provider Latency Benchmark Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: "Zoop.one", latency: "185ms", uptime: "99.92%", role: "Primary PAN" },
          { name: "IDFY (Baldor)", latency: "210ms", uptime: "99.88%", role: "Failover Redundant" },
          { name: "Decentro", latency: "310ms", uptime: "99.95%", role: "Primary Bank IMPS" },
          { name: "Surpass Data", latency: "140ms", uptime: "99.90%", role: "Primary GSTIN" },
        ].map((prov) => (
          <div key={prov.name} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{prov.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100">
              <span>{prov.latency}</span>
              <span className="font-bold text-slate-800">{prov.uptime}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-Navigation Underline Tabs Matching Reference Image 2 */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 transition ${
            activeTab === "all"
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          All Hits ({stats?.summary?.totalHits || 0})
        </button>
        <button
          onClick={() => setActiveTab("success")}
          className={`pb-3 transition ${
            activeTab === "success"
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Success ({stats?.summary?.successHits || 0})
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`pb-3 transition ${
            activeTab === "failed"
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Failed / Timeout ({stats?.summary?.failedHits || 0})
        </button>
      </div>

      {/* Filter Bar Matching Reference Image 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, client or API..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-950"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium">
            <span>All Providers</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium">
            <span>Payment Date</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Data Table Matching Reference Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Live Gateway Hits Stream</h2>
          <span className="text-xs text-slate-400 font-mono">100% Provider Masked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" className="rounded accent-slate-900" />
                </th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Reference / Order ID</th>
                <th className="p-3">API Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHits.length > 0 ? (
                filteredHits.map((hit: any) => {
                  const isChecked = !!selectedRows[hit.id];
                  return (
                    <tr
                      key={hit.id}
                      onClick={() => toggleRow(hit.id)}
                      className={`cursor-pointer transition ${
                        isChecked ? "bg-emerald-50/70 text-slate-900" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(hit.id)}
                          className="rounded accent-slate-900"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{hit.clientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{hit.clientCode}</div>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(hit.createdAt).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400">
                          {new Date(hit.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">{hit.orderId}</td>
                      <td className="p-3 font-medium text-slate-700">{hit.apiName}</td>
                      <td className="p-3">
                        {hit.status === "SUCCESS" ? (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            SUCCESS
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            {hit.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">₹{hit.sellPrice.toFixed(2)}</td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href="/admin/reports/logs"
                          className="text-xs font-semibold text-neutral-900 hover:underline"
                        >
                          More Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-neutral-900 text-sm">No live API hits recorded yet</div>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                      Incoming verification requests to api.colladome.com will stream here in real time.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
