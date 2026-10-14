"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  DollarSign,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from "lucide-react";

export default function ClientWalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(10000);
  const [recharging, setRecharging] = useState(false);

  const fetchWallet = () => {
    setLoading(true);
    fetch("/api/internal/client/wallet")
      .then((res) => res.json())
      .then((data) => {
        setWalletData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecharging(true);
    try {
      const res = await fetch("/api/internal/client/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: rechargeAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowRechargeModal(false);
        fetchWallet();
      } else {
        alert(data.error || "Recharge failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallet & Passbook</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time balance, transaction passbook, and instant credit top-up
          </p>
        </div>

        <button
          onClick={() => setShowRechargeModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Recharge Wallet</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Available Wallet Balance</div>
          <div className="text-4xl font-extrabold mt-1">
            ₹{(walletData?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-200 mt-2">
            Auto-deducted per successful API hit with double-entry ledger guarantee
          </div>
        </div>

        <button
          onClick={() => setShowRechargeModal(true)}
          className="px-5 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition shadow"
        >
          + Add Funds Instantly
        </button>
      </div>

      {/* Passbook Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Wallet Passbook & Debit Logs</h3>
          <button onClick={fetchWallet} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Reference / Order ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Balance Before</th>
                <th className="p-3">Balance After</th>
                <th className="p-3">Description</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {walletData?.transactions && walletData.transactions.length > 0 ? (
                walletData.transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-blue-600">{tx.referenceId || "TXN"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          tx.type === "CREDIT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`p-3 font-bold ${
                        tx.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "CREDIT" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono">₹{tx.balanceBefore.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{tx.balanceAfter.toFixed(2)}</td>
                    <td className="p-3 text-slate-800">{tx.description}</td>
                    <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowRechargeModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900">Recharge Client Wallet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Select or enter top-up amount to instantly replenish your API credit balance.
            </p>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      rechargeAmount === amt
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Amount (₹)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={recharging}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
              >
                {recharging ? "Processing Recharge..." : `Confirm Payment of ₹${rechargeAmount.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
