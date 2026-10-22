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
  Download,
  Play,
  Loader2,
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
  const [sdkLang, setSdkLang] = useState<"curl" | "node" | "python" | "php">("curl");

  // Interactive Live Test state inside modal
  const [testIfsc, setTestIfsc] = useState("SBIN0000001");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; latency: number; data: any } | null>(null);

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
    if (selectedApi.endpointPath?.includes("ifsc") || selectedApi.slug?.includes("ifsc")) {
      return JSON.stringify(
        {
          mode: "sync",
          data: {
            ifsc: "THRS0000XXX",
            consent: "Y",
            consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
          },
          task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        },
        null,
        2
      );
    }
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

  // Multi-language SDK snippets for selected API
  const sdkSnippets = (() => {
    const ep = selectedApi?.endpointPath || "/ifsc-verification/v1";
    const method = selectedApi?.httpMethod || "POST";
    const compactBody = requestSampleJson.replace(/\n/g, "");

    const curl = `# 1. Primary Query Param Authentication
curl -X ${method} "${baseUrl}${ep}?api_key=${apiKeyHint}" \\
  -H "Content-Type: application/json" \\
  -d '${compactBody}'

# 2. Alternative Header Authentication
curl -X ${method} "${baseUrl}${ep}" \\
  -H "x-api-key: ${apiKeyHint}" \\
  -H "Content-Type: application/json" \\
  -d '${compactBody}'`;

    const node = `// Node.js / TypeScript (Native fetch or Axios)
const COLLADOME_BASE_URL = "${baseUrl}";
const COLLADOME_API_KEY = process.env.COLLADOME_API_KEY || "${apiKeyHint}";

export async function verifyIfsc(ifscCode, clientOrderId) {
  const url = \`\${COLLADOME_BASE_URL}${ep}?api_key=\${encodeURIComponent(COLLADOME_API_KEY)}\`;

  const response = await fetch(url, {
    method: "${method}",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "sync",
      data: {
        ifsc: ifscCode.trim().toUpperCase(),
        consent: "Y",
        consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
      },
      task_id: clientOrderId || \`order_\${Date.now()}\`,
    }),
  });

  const payload = await response.json();
  if (!payload.success || payload.response_code !== "100") {
    throw new Error(\`Colladome Error [\${payload.response_code}]: \${payload.response_message}\`);
  }
  return payload; // { colladome_order_id, client_order_id, result: { bank, branch, city, micr, upi, ... } }
}`;

    const python = `# Python 3 (requests)
import os
import requests

COLLADOME_BASE_URL = "${baseUrl}"
COLLADOME_API_KEY = os.getenv("COLLADOME_API_KEY", "${apiKeyHint}")

def verify_ifsc(ifsc_code: str, client_order_id: str = "order-001") -> dict:
    url = f"{COLLADOME_BASE_URL}${ep}"
    payload = {
        "mode": "sync",
        "data": {
            "ifsc": ifsc_code.strip().upper(),
            "consent": "Y",
            "consent_text": "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        "task_id": client_order_id,
    }
    res = requests.post(url, params={"api_key": COLLADOME_API_KEY}, json=payload, timeout=10)
    data = res.json()
    if not data.get("success") or data.get("response_code") != "100":
        raise ValueError(f"Colladome Error [{data.get('response_code')}]: {data.get('response_message')}")
    return data`;

    const php = `<?php
// PHP cURL Integration
$apiKey = getenv('COLLADOME_API_KEY') ?: '${apiKeyHint}';
$url = '${baseUrl}${ep}?api_key=' . urlencode($apiKey);

$payload = json_encode([
    'mode' => 'sync',
    'data' => [
        'ifsc' => 'THRS0000XXX',
        'consent' => 'Y',
        'consent_text' => 'I hear by declare my consent agreement for fetching my information via Colladome API',
    ],
    'task_id' => 'client-order-' . time(),
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 10,
]);

$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);
print_r($data);`;

    return { curl, node, python, php };
  })();

  // Run interactive live test hit from inside the spec modal
  const handleRunLiveTest = async () => {
    if (!selectedApi) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/internal/client/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointPath: selectedApi.endpointPath,
          body: {
            mode: "sync",
            data: {
              ifsc: testIfsc.trim().toUpperCase(),
              consent: "Y",
              consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
            },
            task_id: `live_test_${Date.now()}`,
          },
        }),
      });
      const json = await res.json();
      setTestResult({
        status: json.status || res.status,
        latency: json.latency || 0,
        data: json.result || json,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        latency: 0,
        data: { error: err.message || "Test hit failed" },
      });
    } finally {
      setTestRunning(false);
    }
  };

  // Generate & download Postman Collection v2.1 JSON
  const handleDownloadPostman = () => {
    const collection = {
      info: {
        _postman_id: "c011ad0m-e001-4000-8000-ifscgateway01",
        name: "Colladome Enterprise API Gateway (v2.1)",
        description:
          "Official Colladome API Collection with Query Parameter Authentication (?api_key=...), Zoop IFSC Verification Lite Morpher, and automated response assertions.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: baseUrl, type: "string" },
        { key: "apiKey", value: apiKeyHint, type: "string" },
      ],
      item: (apis.length > 0 ? apis : [{ name: "IFSC Code Verification", endpointPath: "/ifsc-verification/v1", httpMethod: "POST" }]).map(
        (api: any) => ({
          name: `${api.name} (Primary Query Param Auth)`,
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("HTTP 200 & Colladome response_code 100", function () {',
                  "    pm.response.to.have.status(200);",
                  "    const json = pm.response.json();",
                  "    pm.expect(json.success).to.eql(true);",
                  '    pm.expect(json.response_code).to.eql("100");',
                  "    pm.expect(json.colladome_order_id).to.be.a('string');",
                  "});",
                ],
              },
            },
          ],
          request: {
            method: api.httpMethod || "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify(
                {
                  mode: "sync",
                  data: {
                    ifsc: "SBIN0000001",
                    consent: "Y",
                    consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
                  },
                  task_id: "client-order-0001",
                },
                null,
                2
              ),
            },
            url: {
              raw: `{{baseUrl}}${api.endpointPath}?api_key={{apiKey}}`,
              host: ["{{baseUrl}}"],
              path: api.endpointPath.replace(/^\/+/, "").split("/"),
              query: [{ key: "api_key", value: "{{apiKey}}" }],
            },
          },
        })
      ),
    };

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Colladome_API_Gateway.postman_collection.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPostman}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Postman Collection</span>
          </button>
          <Link
            href="/dashboard/keys"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Key className="w-3.5 h-3.5" />
            <span>View API Credentials</span>
          </Link>
        </div>
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
                  <th className="py-3.5 px-3">Pricing Tier</th>
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
                        {api.endpointPath}
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Pay-per-use
                        </span>
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
                    <span>{selectedApi.endpointPath}</span>
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
                  <span>Primary Gateway URL (Query Param Auth)</span>
                  <button
                    onClick={() => handleCopy(`${baseUrl}${selectedApi.endpointPath}?api_key=${apiKeyHint}`, "url")}
                    className="hover:text-white flex items-center gap-1 transition"
                  >
                    {copiedSection === "url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === "url" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-emerald-400 break-all select-all">
                  <span className="text-white">{selectedApi.httpMethod} </span>
                  {`${baseUrl}${selectedApi.endpointPath}?api_key=${apiKeyHint}`}
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-300">Authentication Options:</div>
                  <div className="text-slate-300">
                    <span className="text-emerald-400 font-bold">1. Query Parameter (Primary):</span>{" "}
                    <code>?api_key=&lt;YOUR_API_KEY&gt;</code> in Base URL
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold">2. Request Header (Alternative):</span>{" "}
                    <code className="text-slate-200">x-api-key:</code> &lt;YOUR_API_KEY&gt;
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold">3. Content-Type:</span>{" "}
                    <code className="text-slate-200">application/json</code>
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold">4. Client Order ID:</span>{" "}
                    <code className="text-slate-200">task_id</code> in JSON body or{" "}
                    <code className="text-slate-200">client-order-id</code> header (returned as client_order_id in response)
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

              {/* Multi-Language SDK Snippets (cURL, Node.js, Python, PHP) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Integration Code Snippets</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(
                      [
                        { id: "curl", label: "cURL" },
                        { id: "node", label: "Node.js / TS" },
                        { id: "python", label: "Python" },
                        { id: "php", label: "PHP" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSdkLang(t.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          sdkLang === t.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleCopy(sdkSnippets[sdkLang], "sdk")}
                    className="absolute right-3 top-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 text-[10px] border border-slate-700 transition"
                  >
                    {copiedSection === "sdk" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === "sdk" ? "Copied Snippet" : "Copy Code"}</span>
                  </button>
                  <pre className="p-3.5 pt-9 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed select-all">
                    {sdkSnippets[sdkLang]}
                  </pre>
                </div>
              </div>

              {/* Interactive 1-Click Live Test Runner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Interactive 1-Click Live Test Runner</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Execute a real gateway verification hit right from your browser (Sandbox free session)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {["SBIN0000001", "HDFC0000001", "ICIC0000001", "THRS0000XXX"].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setTestIfsc(code)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border transition ${
                          testIfsc === code
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testIfsc}
                    onChange={(e) => setTestIfsc(e.target.value.toUpperCase())}
                    maxLength={11}
                    placeholder="Enter 11-char IFSC (e.g. SBIN0000001)"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleRunLiveTest}
                    disabled={testRunning}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                  >
                    {testRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{testRunning ? "Verifying..." : "Execute Test Hit"}</span>
                  </button>
                </div>

                {testResult && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          testResult.status === 200
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        HTTP {testResult.status} • response_code: {testResult.data?.response_code || "-"}
                      </span>
                      <span className="text-slate-500">Latency: {testResult.latency} ms</span>
                    </div>
                    <pre className="p-3 bg-slate-950 text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-56 border border-slate-800">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Standardized Colladome Error Codes Reference */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">Standardized Colladome Response & Error Codes</div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">response_code</th>
                        <th className="py-2 px-3">HTTP</th>
                        <th className="py-2 px-3">Error Code</th>
                        <th className="py-2 px-3">Meaning & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-emerald-700">100</td>
                        <td className="py-1.5 px-3">200</td>
                        <td className="py-1.5 px-3">SUCCESS</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">Valid authentication & verified result returned</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-rose-700">101</td>
                        <td className="py-1.5 px-3">401</td>
                        <td className="py-1.5 px-3">AUTH_INVALID_API_KEY</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">Missing or invalid API key in ?api_key= or x-api-key</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-rose-700">102</td>
                        <td className="py-1.5 px-3">403</td>
                        <td className="py-1.5 px-3">SECURITY_IP_NOT_WHITELISTED</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">Caller server IP is not in your IP Whitelist</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-amber-700">103</td>
                        <td className="py-1.5 px-3">402</td>
                        <td className="py-1.5 px-3">BILLING_INSUFFICIENT_WALLET_BALANCE</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">Prepaid wallet balance below per-hit rate</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-rose-700">104</td>
                        <td className="py-1.5 px-3">400</td>
                        <td className="py-1.5 px-3">VALIDATION_INVALID_IFSC</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">IFSC format invalid (must be 11-char alphanumeric)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-rose-700">105</td>
                        <td className="py-1.5 px-3">502</td>
                        <td className="py-1.5 px-3">PROVIDER_UPSTREAM_ERROR</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">Upstream banking network timeout or IFSC not found</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-amber-700">429</td>
                        <td className="py-1.5 px-3">429</td>
                        <td className="py-1.5 px-3">RATE_LIMIT_EXCEEDED</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">RPM limit exceeded; respect retry-after header</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-600">
                Billing Model: <strong className="text-slate-900">Custom Volume Contract</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPostman}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Postman Collection (v2.1)</span>
                </button>
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
