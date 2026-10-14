"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Save, RefreshCw, CheckCircle2 } from "lucide-react";

export default function AdminChargesPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchApis = () => {
    setLoading(true);
    fetch("/api/internal/admin/apis")
      .then((res) => res.json())
      .then((data) => {
        setApis(data.apis || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleUpdateCharges = async (apiId: string) => {
    const costInput = (document.getElementById(`cost_${apiId}`) as HTMLInputElement)?.value;
    const sellInput = (document.getElementById(`sell_${apiId}`) as HTMLInputElement)?.value;

    setSavingId(apiId);
    try {
      // In our current design, we can update prices in the API model
      const res = await fetch(`/api/internal/admin/apis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId,
          defaultCostPrice: Number(costInput),
          defaultSellPrice: Number(sellInput),
        }),
      });
      alert(`Charges updated! Default Retail Sell: ₹${sellInput}`);
      fetchApis();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Charges & Surcharge Section</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure per-hit base costs, standard retail prices, and profit margin rules for all APIs
          </p>
        </div>

        <button
          onClick={fetchApis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">Per-API Base Hit Charges</h2>
          <p className="text-xs text-slate-500">
            These standard charges apply automatically to all clients unless a custom rate is set in the Client 360° Hub.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">API Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">Base Cost (Zoop/IDFY) (₹)</th>
                <th className="p-3">Retail Sell Price (₹)</th>
                <th className="p-3">Standard Net Margin (₹)</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apis.map((api) => {
                const margin = api.defaultSellPrice - api.defaultCostPrice;
                return (
                  <tr key={api.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{api.name}</td>
                    <td className="p-3">{api.category?.name}</td>
                    <td className="p-3 font-mono text-blue-600">{api.endpointPath}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          step="0.05"
                          id={`cost_${api.id}`}
                          defaultValue={api.defaultCostPrice}
                          className="w-20 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-800"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          step="0.05"
                          id={`sell_${api.id}`}
                          defaultValue={api.defaultSellPrice}
                          className="w-20 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-600"
                        />
                      </div>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">+₹{margin.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleUpdateCharges(api.id)}
                        disabled={savingId === api.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50"
                      >
                        {savingId === api.id ? "Saving..." : "Save Rate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
