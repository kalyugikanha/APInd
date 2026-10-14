"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  FileCheck2,
  ExternalLink,
  Save,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from "lucide-react";

export default function AdminApisPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "create" | "providers">("catalog");

  // Add API Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    categoryId: "",
    endpointPath: "",
    httpMethod: "POST",
    description: "",
    useCase: "",
    defaultCostPrice: 1.5,
    defaultSellPrice: 2.5,
    primaryProviderId: "",
    primaryEndpoint: "",
    secondaryProviderId: "",
    secondaryEndpoint: "",
    requestSchemaText: '{\n  "pan_number": { "type": "string", "required": true, "example": "ABCDE1234F" }\n}',
    responseSchemaText: '{\n  "status": "VALID",\n  "full_name": "JOHN DOE"\n}',
  });

  const fetchData = () => {
    setLoading(true);
    fetch("/api/internal/admin/apis")
      .then((res) => res.json())
      .then((data) => {
        setApis(data.apis || []);
        setCategories(data.categories || []);
        setProviders(data.providers || []);
        if (data.categories?.length > 0 && !form.categoryId) {
          setForm((prev) => ({
            ...prev,
            categoryId: data.categories[0].id,
            primaryProviderId: data.providers?.[0]?.id || "",
            secondaryProviderId: data.providers?.[1]?.id || "",
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/internal/admin/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          requestSchema: form.requestSchemaText,
          responseSchema: form.responseSchemaText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setActiveTab("catalog");
        fetchData();
      } else {
        alert(data.error || "Failed to add API");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Studio & Upstream Routing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Map 3rd-party provider endpoints (Zoop, IDFY, Decentro, Surpass) to Colladome Gateway with auto failover
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "catalog" ? "bg-blue-600 text-white" : "bg-white border text-slate-700"
            }`}
          >
            All APIs ({apis.length})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "create" ? "bg-blue-600 text-white" : "bg-white border text-slate-700"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New API</span>
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "providers" ? "bg-blue-600 text-white" : "bg-white border text-slate-700"
            }`}
          >
            Providers ({providers.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apis.map((api) => {
              const primaryMapping = api.providerMappings?.find((m: any) => m.priority === 1);
              const fallbackMapping = api.providerMappings?.find((m: any) => m.priority === 2);
              const margin = api.defaultSellPrice - api.defaultCostPrice;

              return (
                <div
                  key={api.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {api.category.name}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{api.name}</h3>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs font-bold rounded">
                      {api.httpMethod}
                    </span>
                  </div>

                  {/* Gateway Path */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Colladome Public Gateway:</div>
                    <code className="text-xs text-blue-600 font-mono font-bold">
                      https://api.colladome.com{api.endpointPath}
                    </code>
                  </div>

                  {/* Provider Routing Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400">Primary Provider:</div>
                      <div className="font-bold text-slate-800">
                        {primaryMapping?.provider?.name || "Configured Provider"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {primaryMapping?.providerEndpoint}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400">Secondary Failover:</div>
                      <div className="font-bold text-slate-800">
                        {fallbackMapping?.provider?.name || "Auto-Failover Active"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {fallbackMapping?.providerEndpoint || "Same Route"}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400">Cost: </span>
                      <strong className="text-slate-700">₹{api.defaultCostPrice.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Retail Sell: </span>
                      <strong className="text-emerald-600 font-bold">₹{api.defaultSellPrice.toFixed(2)}</strong>
                    </div>
                    <div className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                      +₹{margin.toFixed(2)} Margin
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Add API Form */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateApi} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Add New API & Route to Colladome Gateway</h2>
            <p className="text-xs text-slate-500">
              Paste upstream provider URL and payload. Colladome automatically binds it to your domain!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">API Display Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Passport Verification Suite"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colladome Gateway Endpoint Path *</label>
              <input
                type="text"
                required
                placeholder="/v1/verification/passport"
                value={form.endpointPath}
                onChange={(e) => setForm({ ...form, endpointPath: e.target.value })}
                className="w-full text-xs font-mono text-blue-600 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HTTP Method</label>
              <select
                value={form.httpMethod}
                onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-bold"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (Paid to Provider) (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.defaultCostPrice}
                onChange={(e) => setForm({ ...form, defaultCostPrice: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Retail Selling Price (Client Debit) (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.defaultSellPrice}
                onChange={(e) => setForm({ ...form, defaultSellPrice: Number(e.target.value) })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Upstream Provider Mapping Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Multi-Provider Routing & Redundancy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Upstream Provider</label>
                <select
                  value={form.primaryProviderId}
                  onChange={(e) => setForm({ ...form, primaryProviderId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Primary Provider URL Endpoint (e.g. /api/v1/in/identity/passport)"
                  value={form.primaryEndpoint}
                  onChange={(e) => setForm({ ...form, primaryEndpoint: e.target.value })}
                  className="w-full mt-2 text-xs font-mono border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Fallback Provider (Auto Failover)
                </label>
                <select
                  value={form.secondaryProviderId}
                  onChange={(e) => setForm({ ...form, secondaryProviderId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                >
                  <option value="">None (Single Provider)</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Fallback Endpoint (e.g. /v3/tasks/verify/passport)"
                  value={form.secondaryEndpoint}
                  onChange={(e) => setForm({ ...form, secondaryEndpoint: e.target.value })}
                  className="w-full mt-2 text-xs font-mono border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* JSON Schemas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Request Parameters Schema (JSON)
              </label>
              <textarea
                rows={5}
                value={form.requestSchemaText}
                onChange={(e) => setForm({ ...form, requestSchemaText: e.target.value })}
                className="w-full font-mono text-xs border border-slate-300 rounded-lg p-2.5 text-blue-600"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Sanitized Response Schema (JSON)
              </label>
              <textarea
                rows={5}
                value={form.responseSchemaText}
                onChange={(e) => setForm({ ...form, responseSchemaText: e.target.value })}
                className="w-full font-mono text-xs border border-slate-300 rounded-lg p-2.5 text-emerald-600"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Deploy API to Gateway
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Providers */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">{p.baseUrl}</div>
              <div className="text-xs text-slate-600">Auth Method: <strong>{p.authType}</strong></div>
              <div className="text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block font-medium">
                Encrypted with AES-256-GCM
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
