"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Building2,
  CreditCard,
  X,
  Code2,
  Key,
  ArrowRight,
  Terminal,
} from "lucide-react";

export default function ClientApiCatalogPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Selected API for Integration Spec modal
  const [selectedApi, setSelectedApi] = useState<any | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Subscribed state mapping (API ID -> boolean)
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/internal/admin/apis").then((res) => res.json()),
      fetch("/api/internal/client/me").then((res) => res.json()),
    ])
      .then(([apiData, clientData]) => {
        if (apiData.apis) {
          setApis(apiData.apis);
          setCategories(apiData.categories || []);

          // Initialize subscribed map (all active platform APIs are subscribed by default)
          const initialMap: Record<string, boolean> = {};
          apiData.apis.forEach((a: any) => {
            initialMap[a.id] = true;
          });
          setSubscribedMap(initialMap);
        }
        if (clientData.client) {
          setClientProfile(clientData.client);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading APIs:", err);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleSubscribe = (apiId: string) => {
    setSubscribedMap((prev) => ({
      ...prev,
      [apiId]: !prev[apiId],
    }));
  };

  // Get active client API key hint or placeholder
  const activeKey =
    clientProfile?.apiKeys?.find((k: any) => k.type === "PRODUCTION" && k.isActive) ||
    clientProfile?.apiKeys?.find((k: any) => k.isActive);
  const apiKeyHint = activeKey ? `${activeKey.keyPrefix}${activeKey.keyHint}` : "cd_live_your_actual_key";

  // Filtered APIs
  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.endpointPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || api.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Parse schema for the selected modal
  const parsedRequestSchema = (() => {
    if (!selectedApi?.requestSchema) return {};
    try {
      return JSON.parse(selectedApi.requestSchema);
    } catch {
      return {};
    }
  })();

  const requestSampleJson = (() => {
    if (!selectedApi) return "{}";
    if (selectedApi.endpointPath?.includes("/pan")) {
      return JSON.stringify({ pan_number: "ABCDE1234F", consent: "Y" }, null, 2);
    }
    if (selectedApi.endpointPath?.includes("/bank")) {
      return JSON.stringify(
        {
          account_number: "123456789012",
          ifsc_code: "HDFC0001234",
          beneficiary_name: "VIKRAM MALHOTRA",
        },
        null,
        2
      );
    }
    if (selectedApi.endpointPath?.includes("/gstin")) {
      return JSON.stringify({ gstin: "07AAAAA0000A1Z5" }, null, 2);
    }
    const sample: any = {};
    Object.keys(parsedRequestSchema).forEach((k) => {
      sample[k] = parsedRequestSchema[k].example || "sample_value";
    });
    return JSON.stringify(sample, null, 2);
  })();

  const responseSampleJson = (() => {
    if (!selectedApi?.responseSchema) return "{}";
    try {
      const parsed = JSON.parse(selectedApi.responseSchema);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return selectedApi.responseSchema;
    }
  })();

  // Current origin base URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://apind.onrender.com";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Catalog & Documentation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse available verification APIs, check parameters, base URLs, and get instant integration specs
          </p>
        </div>

        <Link
          href="/dashboard/keys"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Key className="w-3.5 h-3.5" />
          <span>View API Credentials</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search API by name, path (e.g. pan, bank, gstin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Categories ({apis.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Clean APIs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">Loading API Catalog...</div>
        ) : filteredApis.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No matching APIs found</div>
            <p className="text-xs text-slate-400">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">API Name & Description</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Method</th>
                  <th className="py-3.5 px-3 font-mono">Endpoint Path</th>
                  <th className="py-3.5 px-3">Price / Hit</th>
                  <th className="py-3.5 px-3 text-center">Subscription</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApis.map((api) => {
                  const isSubscribed = subscribedMap[api.id] !== false;
                  return (
                    <tr
                      key={api.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedApi(api)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{api.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md mt-0.5">
                          {api.description}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {api.category?.name || "General"}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-mono font-extrabold px-2 py-0.5 rounded text-[11px] bg-slate-900 text-white">
                          {api.httpMethod || "POST"}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-mono text-slate-800 font-semibold">
                        {`/api${api.endpointPath}`}
                      </td>
                      <td className="py-4 px-3 font-bold text-slate-900">
                        ₹{(api.defaultSellPrice || 2.5).toFixed(2)}
                      </td>
                      <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSubscribe(api.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                            isSubscribed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {isSubscribed ? "✓ Subscribed" : "+ Subscribe"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedApi(api)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition inline-flex items-center gap-1"
                        >
                          <span>View Spec</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Spec & Parameters Modal */}
      {selectedApi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedApi.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                    <span className="font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {selectedApi.httpMethod}
                    </span>
                    <span>{`/api${selectedApi.endpointPath}`}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApi(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Description & Use Case */}
              <div className="space-y-1">
                <div className="text-slate-700 leading-relaxed">{selectedApi.description}</div>
                {selectedApi.useCase && (
                  <div className="text-slate-500 text-[11px]">
                    <strong>Best for:</strong> {selectedApi.useCase}
                  </div>
                )}
              </div>

              {/* Integration Endpoint Box */}
              <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Gateway Request URL</span>
                  <button
                    onClick={() => handleCopy(`${baseUrl}/api${selectedApi.endpointPath}`, "url")}
                    className="hover:text-white flex items-center gap-1 transition"
                  >
                    {copiedSection === "url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === "url" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-emerald-400 break-all select-all">
                  <span className="text-white">{selectedApi.httpMethod} </span>
                  {`${baseUrl}/api${selectedApi.endpointPath}`}
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300">Required Colladome Headers:</div>
                  <div>
                    <code className="text-slate-200 font-bold">x-api-key:</code>{" "}
                    <span className="text-slate-400">&lt;YOUR_API_KEY&gt;</span>
                  </div>
                  <div>
                    <code className="text-slate-200 font-bold">Content-Type:</code> application/json
                  </div>
                  <div>
                    <code className="text-slate-200 font-bold">x-client-order-id:</code>{" "}
                    <span className="text-slate-400">(optional client tracking reference)</span>
                  </div>
                </div>
              </div>

              {/* Request Parameters Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-sm">Request Parameters</div>
                {Object.keys(parsedRequestSchema).length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Field</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Required</th>
                          <th className="py-2.5 px-3">Description / Example</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {Object.entries(parsedRequestSchema).map(([key, def]: [string, any]) => (
                          <tr key={key} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">{key}</td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{def.type || "string"}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                                  def.required
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {def.required ? "Required" : "Optional"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] font-sans">
                              {def.description || def.example || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-500 font-mono text-xs">
                    No custom parameters required for this endpoint.
                  </div>
                )}
              </div>

              {/* Request & Response Schemas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sample Request Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                    <span>Sample Request JSON Body</span>
                    <button
                      onClick={() => handleCopy(requestSampleJson, "req")}
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono text-[10px]"
                    >
                      {copiedSection === "req" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === "req" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                    {requestSampleJson}
                  </pre>
                </div>

                {/* Sample Response Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                    <span>Sample Sanitized Response</span>
                    <button
                      onClick={() => handleCopy(responseSampleJson, "res")}
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono text-[10px]"
                    >
                      {copiedSection === "res" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === "res" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                    {responseSampleJson}
                  </pre>
                </div>
              </div>

              {/* 1-Click Copy cURL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Copy-Paste cURL Snippet</span>
                  </span>
                  <button
                    onClick={() => {
                      const curlCode = `curl -X ${selectedApi.httpMethod} "${baseUrl}/api${selectedApi.endpointPath}" \\\n  -H "x-api-key: ${apiKeyHint}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestSampleJson.replace(/\n/g, "")}'`;
                      handleCopy(curlCode, "curl");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px]"
                  >
                    {copiedSection === "curl" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === "curl" ? "Copied cURL Command" : "Copy cURL"}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed select-all">
{`curl -X ${selectedApi.httpMethod} "${baseUrl}/api${selectedApi.endpointPath}" \\
  -H "x-api-key: ${apiKeyHint}" \\
  -H "Content-Type: application/json" \\
  -d '${requestSampleJson.replace(/\n/g, "")}'`}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-600">
                Rate: <strong className="text-slate-900">₹{(selectedApi.defaultSellPrice || 2.5).toFixed(2)}</strong> per hit
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedApi(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
