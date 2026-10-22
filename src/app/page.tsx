"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  FileCheck,
  Key,
  Terminal,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Code2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  Lock,
  Hotel,
  Users,
  Gamepad2,
  ShoppingBag,
  Landmark,
  CreditCard,
  CheckCircle2,
  Cpu,
  BarChart3,
} from "lucide-react";

interface ApiItem {
  id: string;
  name: string;
  slug: string;
  endpointPath: string;
  httpMethod: string;
  description: string;
  useCase: string;
  defaultSellPrice: number;
  category: { id: string; name: string; slug: string };
  requestSchema: string;
  responseSchema: string;
}

export default function HomePage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedApiId, setExpandedApiId] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">("curl");
  const [copiedKey, setCopiedKey] = useState(false);

  // Sandbox Modal State
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxForm, setSandboxForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
  });
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Live Console State
  const [testerApi, setTesterApi] = useState<ApiItem | null>(null);
  const [testerKey, setTesterKey] = useState("cd_test_acme_sand_secret_11928c3d");
  const [testerBody, setTesterBody] = useState("");
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResponse, setTesterResponse] = useState<any>(null);

  useEffect(() => {
    fetch("/api/internal/admin/apis")
      .then((res) => res.json())
      .then((data) => {
        if (data.apis) {
          setApis(data.apis);
          setCategories(data.categories || []);
          if (data.apis.length > 0) {
            setExpandedApiId(data.apis[0].id);
            setTesterApi(data.apis[0]);
            try {
              const parsed = JSON.parse(data.apis[0].requestSchema);
              const sample: any = {};
              Object.keys(parsed).forEach((k) => {
                sample[k] = parsed[k].example || "sample_value";
              });
              setTesterBody(JSON.stringify(sample, null, 2));
            } catch {
              setTesterBody('{\n  "pan_number": "AAACA5678B",\n  "consent": "Y"\n}');
            }
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredApis =
    selectedCategory === "all"
      ? apis
      : apis.filter((a) => a.category.slug === selectedCategory);

  const handleGenerateSandboxKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxLoading(true);
    try {
      const res = await fetch("/api/internal/sandbox/create-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sandboxForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSandboxResult(data);
        setTesterKey(data.apiKey);
      } else {
        alert(data.error || "Failed to generate key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleTestApi = async () => {
    if (!testerApi) return;
    setTesterLoading(true);
    setTesterResponse(null);
    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(testerBody);
      } catch {
        alert("Invalid JSON request body");
        setTesterLoading(false);
        return;
      }

      const res = await fetch(`/api${testerApi.endpointPath}`, {
        method: testerApi.httpMethod,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": testerKey,
          "x-client-order-id": `TEST_SANDBOX_${Date.now()}`,
        },
        body: JSON.stringify(parsedBody),
      });

      const json = await res.json();
      setTesterResponse({
        status: res.status,
        data: json,
      });
    } catch (err: any) {
      setTesterResponse({
        status: 500,
        data: { error: err.message },
      });
    } finally {
      setTesterLoading(false);
    }
  };

  const selectApiForTesting = (api: ApiItem) => {
    setTesterApi(api);
    try {
      const parsed = JSON.parse(api.requestSchema);
      const sample: any = {};
      Object.keys(parsed).forEach((k) => {
        sample[k] = parsed[k].example || "sample_value";
      });
      setTesterBody(JSON.stringify(sample, null, 2));
    } catch {
      setTesterBody("{}");
    }
    const el = document.getElementById("interactive-console");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const industrySolutions = [
    {
      title: "Fintech & NBFCs",
      icon: Landmark,
      description:
        "Accelerate digital onboarding and loan underwriting from 3 days to under 30 seconds. Verify borrower PAN, Aadhaar OKYC, and execute ₹1 IMPS penny drop before disbursements.",
      badge: "Fintech Grade",
    },
    {
      title: "Hotels & Hospitality",
      icon: Hotel,
      description:
        "Eliminate long front-desk queues and paper registers. Enable 10-second contactless guest check-ins with instant digital identity verification (Aadhaar, Passport, PAN) compliant with local tourism regulations.",
      badge: "Front-Desk Automated",
    },
    {
      title: "Banking & Neo-Banks",
      icon: CreditCard,
      description:
        "Bank-grade penny drop verification, real-time UPI VPA validation, and corporate GSTIN profiling. Built with automatic multi-provider redundancy to prevent payment failures.",
      badge: "High Redundancy",
    },
    {
      title: "HR & Employee Staffing",
      icon: Users,
      description:
        "Verify candidate identity, bank account details for direct payroll routing, and previous corporate directorships (DIN) before rolling out formal offer letters.",
      badge: "HR Compliance",
    },
    {
      title: "Gaming & Real-Money Apps",
      icon: Gamepad2,
      description:
        "Instant player age verification, TDS PAN validation for tax compliance, and automated bank penny drops for instant 24/7 winning withdrawals.",
      badge: "Instant Payouts",
    },
    {
      title: "E-Commerce & Marketplaces",
      icon: ShoppingBag,
      description:
        "Verify vendor GST numbers, legal business names, and bank account beneficiary records before enabling merchant payouts and platform onboarding.",
      badge: "Vendor Trust",
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* 1. Hero Section (Monochrome Black & White High Impact) */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/80 text-slate-800 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Indian Verification API Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
            One Unified API Gateway for Identity, Banking & Compliance
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Aggregate and re-sell verification APIs from top providers (Zoop, IDFY, Decentro, Surpass)
            under your own domain:{" "}
            <code className="text-slate-900 font-mono text-sm bg-white px-2 py-0.5 rounded border border-slate-300">
              api.colladome.com
            </code>
            . Enjoy 99.9% uptime, auto-failover, and sub-25ms gateway overhead.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowSandboxModal(true)}
              className="px-6 py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-lg shadow-slate-950/20 transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Get Instant Test API Key (Free Sandbox)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#api-catalog"
              className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs transition"
            >
              Explore API Catalog
            </a>
          </div>

          {/* KPI Strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto pt-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-slate-950">99.9%</div>
              <div className="text-xs text-slate-500 mt-1">Multi-Provider Redundancy</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-slate-950">&lt; 25ms</div>
              <div className="text-xs text-slate-500 mt-1">Gateway Overhead</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-slate-950">100% Whitelabel</div>
              <div className="text-xs text-slate-500 mt-1">Provider Details Masked</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-slate-950">Zero Double-Spend</div>
              <div className="text-xs text-slate-500 mt-1">Atomic Wallet Ledger</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Upstream Provider Aggregation Strip */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6 text-xs text-slate-400 font-mono uppercase tracking-wider">
          <span className="font-semibold text-slate-700 font-sans">Aggregated Upstream Providers:</span>
          <span>ZOOP.ONE</span>
          <span>IDFY (BALDOR)</span>
          <span>DECENTRO</span>
          <span>SURPASS DATA</span>
          <span>UIDAI OKYC</span>
          <span>NSDL PAN</span>
        </div>
      </section>

      {/* 3. Industry Solutions Section (Fintech, Hotels, Banking, HR, Gaming) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Industry Playbooks
            </div>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Tailored Verification for Every Industry
            </h2>
            <p className="text-sm text-slate-600">
              From front-desk hotel guest check-ins to instant fintech loan disbursements, see how Colladome solves compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industrySolutions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-950">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. API Catalog & Interactive Documentation Explorer */}
      <section id="api-catalog" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
              API Catalog & Live Schemas
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Browse endpoints, inspect input schemas, and review sanitized responses
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                selectedCategory === "all" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              All APIs
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                  selectedCategory === c.slug ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Cards List */}
        <div className="space-y-4">
          {filteredApis.map((api) => {
            const isExpanded = expandedApiId === api.id;
            let reqSchemaObj: any = {};
            let resSchemaObj: any = {};
            try {
              reqSchemaObj = JSON.parse(api.requestSchema);
              resSchemaObj = JSON.parse(api.responseSchema);
            } catch {}

            return (
              <div
                key={api.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedApiId(isExpanded ? null : api.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200">
                      {api.httpMethod}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        {api.name}
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {api.category.name}
                        </span>
                      </h3>
                      <code className="text-xs text-slate-500 font-mono mt-0.5 block">
                        https://api.colladome.com{api.endpointPath}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectApiForTesting(api);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-black transition flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Test Live</span>
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Use Case & Purpose
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{api.description}</p>
                      {api.useCase && (
                        <p className="text-xs text-slate-800 mt-2 bg-white border border-slate-200 p-2.5 rounded-lg">
                          💡 <strong>Industry Use Case:</strong> {api.useCase}
                        </p>
                      )}
                    </div>

                    {/* Parameters Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Request Body Parameters (JSON)
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Field</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Required</th>
                              <th className="p-3">Description / Example</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.keys(reqSchemaObj).map((key) => {
                              const f = reqSchemaObj[key];
                              return (
                                <tr key={key}>
                                  <td className="p-3 font-mono font-bold text-slate-900">{key}</td>
                                  <td className="p-3 font-mono text-slate-500">{f.type || "string"}</td>
                                  <td className="p-3">
                                    {f.required ? (
                                      <span className="text-slate-900 bg-slate-100 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                        REQUIRED
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">OPTIONAL</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-600">{f.description || f.example || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Code Snippets & Standard Response */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Code Generator */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-white">
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                          <span className="font-bold flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5" />
                            Integration Code
                          </span>
                          <div className="flex items-center gap-1">
                            {(["curl", "node", "python"] as const).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setCodeLanguage(lang)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                                  codeLanguage === lang ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 font-mono text-xs overflow-x-auto text-emerald-400 bg-slate-950">
                          {codeLanguage === "curl" && (
                            <pre>{`curl -X ${api.httpMethod} "https://api.colladome.com${api.endpointPath}" \\
  -H "x-api-key: YOUR_COLLADOME_API_KEY" \\
  -H "x-client-order-id: ORD_CLIENT_001" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    Object.keys(reqSchemaObj).reduce((acc: any, k) => {
      acc[k] = reqSchemaObj[k].example || "sample";
      return acc;
    }, {}),
    null,
    2
  )}'`}</pre>
                          )}
                          {codeLanguage === "node" && (
                            <pre>{`const response = await fetch("https://api.colladome.com${api.endpointPath}", {
  method: "${api.httpMethod}",
  headers: {
    "x-api-key": "YOUR_COLLADOME_API_KEY",
    "x-client-order-id": "ORD_CLIENT_001",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${JSON.stringify(
    Object.keys(reqSchemaObj).reduce((acc: any, k) => {
      acc[k] = reqSchemaObj[k].example || "sample";
      return acc;
    }, {}),
    null,
    2
  )})
});
const data = await response.json();`}</pre>
                          )}
                          {codeLanguage === "python" && (
                            <pre>{`import requests

url = "https://api.colladome.com${api.endpointPath}"
headers = {
    "x-api-key": "YOUR_COLLADOME_API_KEY",
    "x-client-order-id": "ORD_CLIENT_001",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(
                              Object.keys(reqSchemaObj).reduce((acc: any, k) => {
                                acc[k] = reqSchemaObj[k].example || "sample";
                                return acc;
                              }, {}),
                              null,
                              2
                            )}

response = requests.${api.httpMethod.toLowerCase()}(url, json=payload, headers=headers)
print(response.json())`}</pre>
                          )}
                        </div>
                      </div>

                      {/* Standard Response */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-white">
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            Colladome Standard Response (200 OK)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Whitelabel Standard</span>
                        </div>
                        <div className="p-4 font-mono text-xs overflow-x-auto text-slate-300 bg-slate-950">
                          <pre>
                            {JSON.stringify(
                              {
                                status: "SUCCESS",
                                colladome_order_id: "CDO_20261014_892144",
                                client_order_id: "ORD_CLIENT_001",
                                timestamp: "2026-10-14T14:55:00.000Z",
                                data: resSchemaObj,
                                error: null,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5. Live Interactive Testing Console */}
        <div id="interactive-console" className="mt-16 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-full border border-slate-700 mb-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Live Gateway Console</span>
              </div>
              <h3 className="text-xl font-bold text-white">Execute a Test API Request</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: {testerApi ? `POST ${testerApi.endpointPath}` : "Select an API above"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={testerKey}
                  onChange={(e) => setTesterKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Request Payload (JSON)
                </label>
                <textarea
                  rows={6}
                  value={testerBody}
                  onChange={(e) => setTesterBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-white"
                ></textarea>
              </div>

              <button
                onClick={handleTestApi}
                disabled={testerLoading || !testerApi}
                className="w-full py-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {testerLoading ? "Sending to Gateway..." : "Execute API Hit"}
              </button>
            </div>

            {/* Output */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-auto min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Gateway Response</span>
                  {testerResponse && (
                    <span className="text-emerald-400 font-bold">HTTP {testerResponse.status}</span>
                  )}
                </div>
                <div className="pt-3">
                  {testerResponse ? (
                    <pre className="text-emerald-400">{JSON.stringify(testerResponse.data, null, 2)}</pre>
                  ) : (
                    <div className="text-slate-600 italic">Click "Execute API Hit" to see live response</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Instant Sandbox Key Lead Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200">
            <button
              onClick={() => {
                setShowSandboxModal(false);
                setSandboxResult(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕
            </button>

            {!sandboxResult ? (
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 px-3 py-1 rounded-full mb-3">
                  <Key className="w-3.5 h-3.5" />
                  <span>Instant Sandbox Key Generator</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-950">Start Testing in 10 Seconds</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  Fill your organization details to receive an instant Sandbox Key for trial testing.
                </p>

                <form onSubmit={handleGenerateSandboxKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Fintech Solutions"
                      value={sandboxForm.companyName}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, companyName: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={sandboxForm.contactPerson}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, contactPerson: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@acmepay.in"
                      value={sandboxForm.email}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, email: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={sandboxForm.phone}
                      onChange={(e) => setSandboxForm({ ...sandboxForm, phone: e.target.value })}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sandboxLoading}
                    className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {sandboxLoading ? "Provisioning Sandbox..." : "Generate Sandbox API Key"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Sandbox Key Generated!</h3>
                <p className="text-xs text-slate-600">
                  Pre-loaded with trial sandbox test credits.
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Your Key:</div>
                  <code className="text-xs font-mono font-bold text-slate-900 break-all select-all">
                    {sandboxResult.apiKey}
                  </code>
                </div>

                <button
                  onClick={() => {
                    setShowSandboxModal(false);
                    const el = document.getElementById("interactive-console");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-2.5 rounded-full bg-slate-950 text-white font-bold text-xs"
                >
                  Test in Console Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Comprehensive Enterprise Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white text-slate-950 flex items-center justify-center font-black text-sm">
                C
              </div>
              <span className="font-bold text-base text-white">COLLADOME</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              India's premier unified API Gateway for verification, banking, and compliance services.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Solutions</h4>
            <ul className="space-y-2">
              <li><Link href="/industries" className="hover:text-white">Fintech & NBFCs</Link></li>
              <li><Link href="/industries" className="hover:text-white">Hotels & Hospitality</Link></li>
              <li><Link href="/industries" className="hover:text-white">Banking & Payments</Link></li>
              <li><Link href="/industries" className="hover:text-white">HR & Staffing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/apis" className="hover:text-white">APIs Catalog</Link></li>
              <li><Link href="/developer" className="hover:text-white">Documentation</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-white">Admin Portal</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Client Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Sales</Link></li>
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-12 mt-12 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600">
          <div>© 2026 Colladome Technologies Pvt Ltd. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>ISO 27001 Certified</span>
            <span>PCI-DSS Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
