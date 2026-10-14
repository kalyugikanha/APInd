"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  DollarSign,
  Search,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";

export default function AdminWalletPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClients = () => {
    setLoading(true);
    fetch("/api/internal/admin/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const totalWalletLiability = clients.reduce((acc, c) => acc + (c.walletBalance || 0), 0);

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.clientCode && c.clientCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallet & Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global client wallet balances, prepaid credits, and manual financial adjustments
          </p>
        </div>

        <button
          onClick={fetchClients}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total Client Wallet Liability</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            ₹{totalWalletLiability.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total outstanding prepaid balance across all clients</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Prepaid Wallets</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {clients.filter((c) => c.walletBalance > 0).length} / {clients.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Clients ready for API hits</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Low Balance Warnings</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            {clients.filter((c) => c.walletBalance < 1000).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Clients under ₹1,000 threshold</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="font-bold text-sm text-slate-900">Client Wallet Master List</h3>
          <div className="w-64">
            <input
              type="text"
              placeholder="Search by client or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Client Code</th>
                <th className="p-3">Company Name</th>
                <th className="p-3">Billing Type</th>
                <th className="p-3">Current Balance</th>
                <th className="p-3">Total API Calls</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-blue-600">{c.clientCode}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{c.companyName}</div>
                    <div className="text-[10px] text-slate-400">{c.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {c.billingModel}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-extrabold text-emerald-600 text-sm">₹{c.walletBalance.toFixed(2)}</div>
                  </td>
                  <td className="p-3 font-mono font-medium">{c.totalHits} hits</td>
                  <td className="p-3">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                      {c.accountStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transition"
                    >
                      <span>Adjust / Passbook</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
