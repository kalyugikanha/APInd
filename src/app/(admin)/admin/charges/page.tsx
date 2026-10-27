"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, Save, RefreshCw, CheckCircle2, Trash2, Plus } from "lucide-react";

export default function AdminChargesPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

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
    const setupInput = (document.getElementById(`setup_${apiId}`) as HTMLInputElement)?.value;

    setSavingId(apiId);
    try {
      const res = await fetch(`/api/internal/admin/apis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId,
          defaultCostPrice: Number(costInput),
          defaultSellPrice: Number(sellInput),
          defaultSetupFee: Number(setupInput) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedId(apiId);
        setTimeout(() => setSavedId(null), 2500);
        fetchApis();
      } else {
        alert(data.error || "Failed to update charges");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteApi = async (apiId: string, apiName: string) => {
    if (!confirm(`Are you sure you want to delete '${apiName}' from the gateway catalog?`)) return;
    try {
      const res = await fetch(`/api/internal/admin/apis?id=${apiId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchApis();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete API");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Charges & Surcharge Section</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure per-hit base costs, standard retail prices, and profit margin rules for all gateway APIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/apis"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Morph New API</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Per-API Base Hit Charges</h2>
            <p className="text-xs text-slate-500">
              These standard charges apply automatically to all clients unless a custom rate is set in the Client 360° Hub.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            {apis.length} Active Endpoint{apis.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">API Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Colladome Morphed Endpoint</th>
                <th className="p-3.5">Upstream Route</th>
                <th className="p-3.5">Base Upstream Cost (₹)</th>
                <th className="p-3.5">Retail Sell Price (₹)</th>
                <th className="p-3.5">One-Time Setup Fee (₹)</th>
                <th className="p-3.5">Standard Net Margin (₹)</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apis.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No active APIs in catalog. Click &quot;Add / Morph New API&quot; to integrate an upstream endpoint.
                  </td>
                </tr>
              ) : (
                apis.map((api) => {
                  const margin = api.defaultSellPrice - api.defaultCostPrice;
                  const primaryMapping = api.providerMappings?.[0];
                  return (
                    <tr key={api.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900">{api.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {api.category?.name || "General"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        {api.endpointPath.endsWith("/") ? api.endpointPath : `${api.endpointPath}/`}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        <div>{primaryMapping?.provider?.name || "Primary Gateway"}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {primaryMapping?.providerEndpoint || "-"}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          <span>₹</span>
                          <input
                            type="number"
                            step="0.05"
                            id={`cost_${api.id}`}
                            defaultValue={api.defaultCostPrice}
                            className="w-20 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          <span>₹</span>
                          <input
                            type="number"
                            step="0.05"
                            id={`sell_${api.id}`}
                            defaultValue={api.defaultSellPrice}
                            className="w-20 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-emerald-600 focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          <span>₹</span>
                          <input
                            type="number"
                            step="1"
                            id={`setup_${api.id}`}
                            defaultValue={api.defaultSetupFee ?? 0}
                            className="w-24 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-amber-700 bg-amber-50/40 focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-3.5 font-bold">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          +₹{margin.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateCharges(api.id)}
                            disabled={savingId === api.id}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition flex items-center gap-1 ${
                              savedId === api.id
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900 hover:bg-black text-white"
                            } disabled:opacity-50`}
                          >
                            {savedId === api.id ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Saved</span>
                              </>
                            ) : savingId === api.id ? (
                              <span>Saving...</span>
                            ) : (
                              <span>Save Rate</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteApi(api.id, api.name)}
                            title="Delete API from Catalog"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
