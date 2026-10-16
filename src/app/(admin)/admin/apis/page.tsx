"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Key,
  X,
  Server,
  Lock,
  Sliders,
  Radio,
  Activity,
  Zap,
} from "lucide-react";

export default function AdminApisPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "create" | "providers">("catalog");

  // Ping State
  const [pingResults, setPingResults] = useState<
    Record<
      string,
      {
        loading?: boolean;
        reachable?: boolean;
        status?: number;
        latencyMs?: number;
        message?: string;
        error?: string;
      }
    >
  >({});

  const handlePingProvider = async (providerId: string) => {
    setPingResults((prev) => ({
      ...prev,
      [providerId]: { loading: true },
    }));

    try {
      const res = await fetch("/api/internal/admin/providers/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      setPingResults((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          reachable: data.reachable,
          status: data.status,
          latencyMs: data.latencyMs,
          message: data.message,
          error: data.error,
        },
      }));
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          reachable: false,
          error: err.message || "Failed to ping",
        },
      }));
    }
  };

  // Add API Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    categoryId: "",
    endpointPath: "",
    httpMethod: "POST",
    description: "",
    useCase: "",
    defaultCostPrice: 0,
    defaultSellPrice: 0,
    primaryProviderId: "",
    primaryEndpoint: "",
    secondaryProviderId: "",
    secondaryEndpoint: "",
    requestSchemaText: "",
    responseSchemaText: "",
  });

  // Fast Raw Integrator state
  const [fastMode, setFastMode] = useState<"fast" | "advanced">("fast");
  const [fastForm, setFastForm] = useState({
    name: "",
    baseUrl: "",
    endpointPath: "",
    httpMethod: "POST",
    headersText: "",
    bodyText: "",
    sellPrice: 0,
    costPrice: 0,
    categoryId: "",
  });

  const handleFastIntegrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastForm.name || !fastForm.endpointPath) {
      alert("API Name and Endpoint Path are required.");
      return;
    }

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(fastForm.bodyText || "{}");
    } catch {
      alert("Invalid JSON format in Request Body");
      return;
    }

    // Convert raw JSON body into clean schema
    const schemaObj: any = {};
    Object.keys(parsedBody).forEach((k) => {
      schemaObj[k] = {
        type: typeof parsedBody[k],
        example: parsedBody[k],
        required: true,
      };
    });

    try {
      const res = await fetch("/api/internal/admin/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fastForm.name,
          endpointPath: fastForm.endpointPath,
          httpMethod: fastForm.httpMethod,
          defaultCostPrice: Number(fastForm.costPrice) || 0,
          defaultSellPrice: Number(fastForm.sellPrice) || 2.5,
          requestSchema: JSON.stringify(schemaObj),
          responseSchema: JSON.stringify({ status: "SUCCESS", result: parsedBody }),
          categoryId: fastForm.categoryId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("API Endpoint integrated successfully into Colladome Gateway!");
        setActiveTab("catalog");
        fetchData();
      } else {
        alert(data.error || "Failed to integrate API");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Provider Edit Modal State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerForm, setProviderForm] = useState({
    id: "",
    name: "",
    baseUrl: "",
    apiKey: "",
    apiSecret: "",
    authType: "HEADER_API_KEY",
    isActive: true,
    isSimulation: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/internal/admin/apis").then((res) => res.json()),
      fetch("/api/internal/admin/providers").then((res) => res.json()),
    ])
      .then(([apiData, provData]) => {
        setApis(apiData.apis || []);
        setCategories(apiData.categories || []);
        setProviders(provData.providers || apiData.providers || []);
        if (apiData.categories?.length > 0 && !form.categoryId) {
          setForm((prev) => ({
            ...prev,
            categoryId: apiData.categories[0].id,
            primaryProviderId: provData.providers?.[0]?.id || "",
            secondaryProviderId: provData.providers?.[1]?.id || "",
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleOpenProviderModal = (p: any) => {
    setSelectedProvider(p);
    setProviderForm({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl || "",
      apiKey: "",
      apiSecret: "",
      authType: p.authType || "HEADER_API_KEY",
      isActive: p.isActive !== false,
      isSimulation: p.isSimulation !== false,
    });
    setProviderModalOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const res = await fetch("/api/internal/admin/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Provider updated successfully!");
        setProviderModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to update provider");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingProvider(false);
    }
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
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">API Studio & Upstream Routing</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Map 3rd-party provider endpoints (Zoop, IDFY, Decentro, Surpass) to Colladome Gateway with auto failover
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "catalog"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            All APIs ({apis.length})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "create"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New API</span>
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "providers"
                ? "bg-black text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Upstream Providers ({providers.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === "catalog" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">API Catalog & Upstream Routing Table</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Overview of gateway routes, upstream provider mappings, pricing, and profit margins
              </p>
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New API Route</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">API Name</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Method</th>
                  <th className="py-3.5 px-3 font-mono">Gateway Route</th>
                  <th className="py-3.5 px-3">Upstream Provider</th>
                  <th className="py-3.5 px-3">Cost Price</th>
                  <th className="py-3.5 px-3">Retail Sell</th>
                  <th className="py-3.5 px-3">Net Margin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {apis.map((api) => {
                  const primaryMapping = api.providerMappings?.find((m: any) => m.priority === 1);
                  const fallbackMapping = api.providerMappings?.find((m: any) => m.priority === 2);
                  const margin = api.defaultSellPrice - api.defaultCostPrice;

                  return (
                    <tr key={api.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 text-sm">{api.name}</div>
                        <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs mt-0.5">
                          {api.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                          {api.category?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-extrabold px-2 py-0.5 rounded text-[10px] bg-black text-white">
                          {api.httpMethod || "POST"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-neutral-800">
                        /api{api.endpointPath}
                      </td>
                      <td className="py-3.5 px-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-neutral-900">
                            {primaryMapping?.provider?.name || "Configured Provider"}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate mt-0.5 max-w-[160px]">
                          {primaryMapping?.providerEndpoint || "-"}
                        </div>
                        {fallbackMapping && (
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1">
                            <span className="text-neutral-500">↳ Failover:</span>
                            <span className="text-neutral-700 font-semibold">{fallbackMapping.provider?.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-neutral-700">
                        ₹{api.defaultCostPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-neutral-900">
                        ₹{api.defaultSellPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 font-bold">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          +₹{margin.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {primaryMapping?.provider && (
                            <button
                              type="button"
                              onClick={() => handlePingProvider(primaryMapping.provider.id)}
                              disabled={pingResults[primaryMapping.provider.id]?.loading}
                              className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition"
                            >
                              {pingResults[primaryMapping.provider.id]?.loading ? "Pinging..." : "Test Ping"}
                            </button>
                          )}
                          <Link
                            href="/admin/charges"
                            className="px-2.5 py-1 rounded bg-black hover:bg-neutral-800 text-white font-semibold text-[11px] transition"
                          >
                            Edit Pricing
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Add API Form */}
      {activeTab === "create" && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden space-y-6">
          {/* Mode Switcher */}
          <div className="flex border-b border-neutral-200 bg-neutral-50/80 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setFastMode("fast")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                fastMode === "fast"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Fast Raw Integrator (Paste Mode)</span>
            </button>
            <button
              type="button"
              onClick={() => setFastMode("advanced")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                fastMode === "advanced"
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Advanced Multi-Provider Config</span>
            </button>
          </div>

          {fastMode === "fast" ? (
            /* Fast Raw Integrator */
            <form onSubmit={handleFastIntegrate} className="p-6 space-y-6">
              <div className="pb-3 border-b border-neutral-100">
                <h2 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Fast Raw Endpoint Integrator</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Paste the provider URL, headers, and request body. Colladome automatically generates the gateway contract and handles authentication!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">API Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PAN Detailed Verification"
                    value={fastForm.name}
                    onChange={(e) => setFastForm({ ...fastForm, name: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-black font-semibold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Category (Optional / Map Later)</label>
                  <select
                    value={fastForm.categoryId}
                    onChange={(e) => setFastForm({ ...fastForm, categoryId: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-800"
                  >
                    <option value="">Auto-Assign / Map Later</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Provider Base URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.zoop.one"
                    value={fastForm.baseUrl}
                    onChange={(e) => setFastForm({ ...fastForm, baseUrl: e.target.value })}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Endpoint Path *</label>
                  <input
                    type="text"
                    required
                    placeholder="/api/v1/in/identity/pan"
                    value={fastForm.endpointPath}
                    onChange={(e) => setFastForm({ ...fastForm, endpointPath: e.target.value })}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-black font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">HTTP Method</label>
                  <div className="flex gap-2">
                    {["POST", "GET"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFastForm({ ...fastForm, httpMethod: m })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition flex-1 ${
                          fastForm.httpMethod === m
                            ? "bg-black text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fastForm.costPrice}
                      onChange={(e) => setFastForm({ ...fastForm, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Retail Sell Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fastForm.sellPrice}
                      onChange={(e) => setFastForm({ ...fastForm, sellPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Raw JSON Paste Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Provider Request Headers (Paste JSON)
                  </label>
                  <textarea
                    rows={5}
                    value={fastForm.headersText}
                    onChange={(e) => setFastForm({ ...fastForm, headersText: e.target.value })}
                    className="w-full font-mono text-xs border border-neutral-300 rounded-lg p-2.5 text-neutral-900 bg-neutral-50"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Paste upstream provider keys/tokens. Colladome encrypts and stores these securely.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Sample Request Parameters Body (Paste JSON)
                  </label>
                  <textarea
                    rows={5}
                    value={fastForm.bodyText}
                    onChange={(e) => setFastForm({ ...fastForm, bodyText: e.target.value })}
                    className="w-full font-mono text-xs border border-neutral-300 rounded-lg p-2.5 text-neutral-900 bg-neutral-50"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Colladome automatically parses this into parameter specs for your clients!
                  </p>
                </div>
              </div>

              {/* Colladome Gateway Contract Box */}
              <div className="bg-[#09090b] text-white p-5 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How Colladome Wraps This Endpoint:</span>
                </div>
                <div className="space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                  <div>
                    <strong>1. Client Calls:</strong>{" "}
                    <code className="text-white bg-black px-1.5 py-0.5 rounded">
                      {fastForm.httpMethod} https://api.colladome.com{fastForm.endpointPath.startsWith("/") ? fastForm.endpointPath : `/${fastForm.endpointPath}`}
                    </code>
                  </div>
                  <div>
                    <strong>2. Required Headers:</strong>{" "}
                    <code className="text-white">x-api-key: cd_live_...</code> and optional{" "}
                    <code className="text-white">x-client-order-id: (order_ref)</code>
                  </div>
                  <div>
                    <strong>3. Gateway Checks:</strong> Validates client IP against authorized whitelist, verifies wallet balance ≥ ₹{fastForm.sellPrice.toFixed(2)}, and deducts wallet atomically.
                  </div>
                  <div>
                    <strong>4. Upstream Forwarding:</strong> Gateway injects decrypted provider headers and proxies payload to{" "}
                    <code className="text-amber-300">{fastForm.baseUrl}{fastForm.endpointPath}</code>.
                  </div>
                  <div>
                    <strong>5. Real-Time Logging:</strong> Logs latency, HTTP status, and responses for audit trail.
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>⚡ Deploy & Integrate Endpoint into Gateway</span>
                </button>
              </div>
            </form>
          ) : (
            /* Advanced Multi-Provider Config */
            <form onSubmit={handleCreateApi} className="p-6 space-y-6">
              <div className="pb-3 border-b border-neutral-100">
                <h2 className="font-bold text-sm text-neutral-900">Advanced Multi-Provider Routing & Fallback</h2>
                <p className="text-xs text-neutral-500">
                  Configure primary and secondary failover providers with custom response mapping.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">API Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Passport Verification Suite"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Colladome Endpoint Path *</label>
                  <input
                    type="text"
                    required
                    placeholder="/v1/verification/passport"
                    value={form.endpointPath}
                    onChange={(e) => setForm({ ...form, endpointPath: e.target.value })}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">HTTP Method</label>
                  <select
                    value={form.httpMethod}
                    onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white font-bold"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.defaultCostPrice}
                    onChange={(e) => setForm({ ...form, defaultCostPrice: Number(e.target.value) })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Retail Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.defaultSellPrice}
                    onChange={(e) => setForm({ ...form, defaultSellPrice: Number(e.target.value) })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900"
                  />
                </div>
              </div>

              {/* Upstream Provider Mapping Box */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-neutral-700" />
                  <span>Primary & Secondary Failover Providers</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Primary Upstream Provider</label>
                    <select
                      value={form.primaryProviderId}
                      onChange={(e) => setForm({ ...form, primaryProviderId: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2 bg-white font-semibold"
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Primary Provider URL Endpoint"
                      value={form.primaryEndpoint}
                      onChange={(e) => setForm({ ...form, primaryEndpoint: e.target.value })}
                      className="w-full mt-2 text-xs font-mono border border-neutral-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Secondary Fallback Provider
                    </label>
                    <select
                      value={form.secondaryProviderId}
                      onChange={(e) => setForm({ ...form, secondaryProviderId: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2 bg-white font-semibold"
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
                      placeholder="Fallback Endpoint"
                      value={form.secondaryEndpoint}
                      onChange={(e) => setForm({ ...form, secondaryEndpoint: e.target.value })}
                      className="w-full mt-2 text-xs font-mono border border-neutral-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-150">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs transition"
                >
                  Deploy API to Gateway
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Providers */}
      {activeTab === "providers" && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Upstream Providers & Direct Gateways</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upstream provider integrations, encrypted credentials, base URLs, and real-time connectivity status
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Provider Name & Code</th>
                  <th className="py-3.5 px-3">Base URL</th>
                  <th className="py-3.5 px-3">Auth Type</th>
                  <th className="py-3.5 px-3">Execution Mode</th>
                  <th className="py-3.5 px-3">Connectivity Health</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {providers.map((p) => {
                  const ping = pingResults[p.id];
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 px-1.5 py-0.5 rounded">
                            {p.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Status: <span className="font-semibold text-neutral-700">{p.isActive ? "Online" : "Paused"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-neutral-800 text-[11px]">
                        {p.baseUrl || "https://api.upstream.com"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                          {p.authType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            p.isSimulation
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {p.isSimulation ? "Sandbox Simulation" : "Live Production"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        {ping && !ping.loading ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                ping.reachable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                              }`}
                            ></span>
                            <span className={ping.reachable ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                              {ping.reachable ? `Reachable (${ping.latencyMs}ms)` : "Unreachable"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-sans">Ready for test</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePingProvider(p.id)}
                            disabled={ping?.loading}
                            className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition flex items-center gap-1"
                          >
                            <Activity className={`w-3 h-3 ${ping?.loading ? "animate-spin" : "text-emerald-600"}`} />
                            <span>{ping?.loading ? "Pinging..." : "Test"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenProviderModal(p)}
                            className="px-2.5 py-1 rounded bg-black hover:bg-neutral-800 text-white font-semibold text-[11px] transition flex items-center gap-1"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Configure</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provider Credential Configuration Modal */}
      {providerModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  {selectedProvider.code}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Configure Upstream Provider: {selectedProvider.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Live external HTTP dispatcher settings and encrypted credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProviderModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProvider} className="p-6 space-y-4">
              {/* Base URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Provider Base URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://live.zoop.one"
                  value={providerForm.baseUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Provider API Key / Client ID
                </label>
                <input
                  type="password"
                  placeholder={
                    selectedProvider.keyHint !== "Not Configured"
                      ? `Keep existing encrypted key (${selectedProvider.keyHint}) or enter new`
                      : "Enter upstream API key"
                  }
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-neutral-500"
                />
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Leave blank to retain current key if already configured.
                </p>
              </div>

              {/* API Secret */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Provider API Secret / App Secret
                </label>
                <input
                  type="password"
                  placeholder={
                    selectedProvider.hasSecret
                      ? "Keep existing secret or enter new"
                      : "Optional secret or token"
                  }
                  value={providerForm.apiSecret}
                  onChange={(e) => setProviderForm({ ...providerForm, apiSecret: e.target.value })}
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* Auth Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Authentication Header Format
                </label>
                <select
                  value={providerForm.authType}
                  onChange={(e) => setProviderForm({ ...providerForm, authType: e.target.value })}
                  className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white font-mono"
                >
                  <option value="HEADER_API_KEY">HEADER_API_KEY (x-api-key: [key])</option>
                  <option value="BEARER_TOKEN">BEARER_TOKEN (Authorization: Bearer [key])</option>
                  <option value="BASIC_AUTH">BASIC_AUTH (Basic [base64(key:secret)])</option>
                </select>
              </div>

              {/* Execution Mode Radio Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Execution Dispatcher Mode
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setProviderForm({ ...providerForm, isSimulation: true })}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      providerForm.isSimulation
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Sandbox Simulation</span>
                      {providerForm.isSimulation && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`text-[10px] mt-1 ${providerForm.isSimulation ? "text-neutral-300" : "text-neutral-500"}`}>
                      Deterministic response from mock engine without consuming upstream credits.
                    </div>
                  </div>

                  <div
                    onClick={() => setProviderForm({ ...providerForm, isSimulation: false })}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      !providerForm.isSimulation
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Live Production</span>
                      {!providerForm.isSimulation && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`text-[10px] mt-1 ${!providerForm.isSimulation ? "text-neutral-300" : "text-neutral-500"}`}>
                      Direct HTTP fetch() to provider's baseUrl with real-time failover.
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={providerForm.isActive}
                  onChange={(e) => setProviderForm({ ...providerForm, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-black focus:ring-black"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                  Provider is Active & accepting gateway requests
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-150">
                <div>
                  <button
                    type="button"
                    onClick={() => handlePingProvider(selectedProvider.id)}
                    disabled={pingResults[selectedProvider.id]?.loading}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-neutral-200 hover:border-neutral-300 text-neutral-800 bg-neutral-50 hover:bg-neutral-100 transition flex items-center gap-1.5"
                  >
                    <Activity
                      className={`w-3.5 h-3.5 ${
                        pingResults[selectedProvider.id]?.loading
                          ? "animate-spin text-neutral-400"
                          : "text-emerald-600"
                      }`}
                    />
                    <span>
                      {pingResults[selectedProvider.id]?.loading ? "Testing..." : "Test Connection"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProviderModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProvider}
                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-black hover:bg-neutral-800 text-white transition shadow-sm disabled:opacity-50"
                  >
                    {savingProvider ? "Encrypting & Saving..." : "Save Provider Configuration"}
                  </button>
                </div>
              </div>

              {/* In-modal ping alert */}
              {pingResults[selectedProvider.id] && !pingResults[selectedProvider.id]?.loading && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    pingResults[selectedProvider.id]?.reachable
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-rose-50 text-rose-900 border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          pingResults[selectedProvider.id]?.reachable
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500"
                        }`}
                      ></span>
                      HTTP {pingResults[selectedProvider.id]?.status || "ERR"}:{" "}
                      {pingResults[selectedProvider.id]?.reachable ? "Connection Succeeded" : "Connection Failed"}
                    </span>
                    {pingResults[selectedProvider.id]?.latencyMs !== undefined && (
                      <span className="font-bold">{pingResults[selectedProvider.id]?.latencyMs}ms</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 text-neutral-600 font-sans">
                    {pingResults[selectedProvider.id]?.message || pingResults[selectedProvider.id]?.error}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
