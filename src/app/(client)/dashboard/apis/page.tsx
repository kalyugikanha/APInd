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
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  Plus,
  QrCode,
  Info,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export default function ClientApiCatalogPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Selected API for Integration Spec modal
  const [selectedApi, setSelectedApi] = useState<any | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [sdkLang, setSdkLang] = useState<"curl" | "node" | "python" | "php">("curl");

  // Interactive Live Test state inside Spec modal
  const [testIfsc, setTestIfsc] = useState("SBIN0000001");
  const [testPan, setTestPan] = useState("ABCDE1234F");
  const [testName, setTestName] = useState("RAHUL SHARMA");
  const [testAccount, setTestAccount] = useState("123456789012");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; latency: number; data: any } | null>(null);

  // Subscription Modal state
  const [subscribeTargetApi, setSubscribeTargetApi] = useState<any | null>(null);
  const [subPaymentMethod, setSubPaymentMethod] = useState("IMPS");
  const [subUtr, setSubUtr] = useState("");
  const [subRemarks, setSubRemarks] = useState("");
  const [subReceiptFile, setSubReceiptFile] = useState<File | null>(null);
  const [subReceiptPreview, setSubReceiptPreview] = useState<string | null>(null);
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = useState<string | null>(null);

  // View Rejection Reason Modal state
  const [viewRejectionSub, setViewRejectionSub] = useState<any | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/internal/client/subscriptions");
      const data = await res.json();
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    }
  };

  const loadData = () => {
    Promise.all([
      fetch("/api/internal/admin/apis").then((res) => res.json()),
      fetch("/api/internal/client/me").then((res) => res.json()),
      fetch("/api/internal/client/subscriptions").then((res) => res.json()),
    ])
      .then(([apiData, clientData, subData]) => {
        if (apiData.apis) {
          setApis(apiData.apis);
          setCategories(apiData.categories || []);
        }
        if (clientData.client) {
          setClientProfile(clientData.client);
          if (clientData.client.subscriptions) {
            setSubscriptions(clientData.client.subscriptions);
          }
        }
        if (subData.subscriptions) {
          setSubscriptions(subData.subscriptions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading APIs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Resolve subscription status for an API
  const getSubscriptionInfo = (apiId: string) => {
    // 1. Check if setup fee is paid in pricingRules
    const rule = clientProfile?.pricingRules?.find((r: any) => r.apiId === apiId);
    // 2. Check latest subscription entry for this api
    const sub = subscriptions.find((s: any) => s.apiId === apiId);

    if (rule?.isSetupFeePaid || sub?.status === "APPROVED") {
      return { status: "APPROVED", label: "Active", sub, rule };
    }
    if (sub?.status === "PENDING") {
      return { status: "PENDING", label: "In Review", sub, rule };
    }
    if (sub?.status === "REJECTED") {
      return { status: "REJECTED", label: "Rejected", sub, rule };
    }
    return { status: "NONE", label: "Subscribe", sub: null, rule };
  };

  const openSubscribeModal = (api: any) => {
    setSubscribeTargetApi(api);
    setSubPaymentMethod("IMPS");
    setSubUtr("");
    setSubRemarks("");
    setSubReceiptFile(null);
    setSubReceiptPreview(null);
    setSubSuccessMsg(null);
    setSubErrorMsg(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setSubErrorMsg("File size exceeds 8MB. Please upload a smaller screenshot or PDF.");
      return;
    }

    setSubReceiptFile(file);
    setSubErrorMsg(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSubReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeTargetApi) return;

    if (!subUtr.trim()) {
      setSubErrorMsg("Please enter the Bank Transaction UTR / Reference Number.");
      return;
    }

    setSubSubmitting(true);
    setSubErrorMsg(null);

    try {
      const res = await fetch("/api/internal/client/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId: subscribeTargetApi.id,
          utrNumber: subUtr.trim(),
          paymentMethod: subPaymentMethod,
          setupFee: 5500.0,
          gstAmount: 990.0,
          totalAmount: 6490.0,
          receiptUrl: subReceiptPreview,
          receiptName: subReceiptFile?.name,
          remarks: subRemarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit subscription request.");
      }

      setSubSuccessMsg(
        "Payment proof submitted successfully! Admin will verify your UTR and activate the API within 1–2 hours."
      );
      fetchSubscriptions();
    } catch (err: any) {
      setSubErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubSubmitting(false);
    }
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

  // Current origin base URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://api.colladome.com";

  // Request Sample Generator for selected modal
  const requestSampleJson = (() => {
    if (!selectedApi) return "{}";
    const path = selectedApi.endpointPath || "";

    if (path.includes("pan-advanced")) {
      return JSON.stringify(
        {
          pan_number: "ABCDE1234F",
          name: "RAHUL SHARMA",
          initiator_id: "9999999999",
        },
        null,
        2
      );
    }
    if (path.includes("bank-pennyless")) {
      return JSON.stringify(
        {
          account_number: "123456789012",
          ifsc_code: "HDFC0001234",
          initiator_id: "9999999999",
        },
        null,
        2
      );
    }
    if (path.includes("ifsc")) {
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
    if (path.includes("pan")) {
      return JSON.stringify({ pan_number: "ABCDE1234F", consent: "Y" }, null, 2);
    }
    if (path.includes("bank")) {
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
    if (path.includes("gstin")) {
      return JSON.stringify({ gstin: "07AAAAA0000A1Z5" }, null, 2);
    }
    return JSON.stringify({ pan_number: "ABCDE1234F", consent: "Y" }, null, 2);
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

export async function executeVerification(payload) {
  const url = \`\${COLLADOME_BASE_URL}${ep}?api_key=\${encodeURIComponent(COLLADOME_API_KEY)}\`;

  const response = await fetch(url, {
    method: "${method}",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success || data.response_code !== "100") {
    throw new Error(\`Colladome Error [\${data.response_code}]: \${data.response_message}\`);
  }
  return data;
}`;

    const python = `# Python 3 (requests)
import os
import requests

COLLADOME_BASE_URL = "${baseUrl}"
COLLADOME_API_KEY = os.getenv("COLLADOME_API_KEY", "${apiKeyHint}")

def execute_verification(payload: dict) -> dict:
    url = f"{COLLADOME_BASE_URL}${ep}"
    res = requests.post(url, params={"api_key": COLLADOME_API_KEY}, json=payload, timeout=10)
    data = res.json()
    if not data.get("success") or data.get("response_code") != "100":
        raise ValueError(f"Colladome Error [{data.get('response_code')}]: {data.get('response_message')}")
    return data`;

    const php = `<?php
// PHP cURL Integration
$apiKey = getenv('COLLADOME_API_KEY') ?: '${apiKeyHint}';
$url = '${baseUrl}${ep}?api_key=' . urlencode($apiKey);

$payload = json_encode(${requestSampleJson});

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

    let testBody: any = {};
    const path = selectedApi.endpointPath || "";

    if (path.includes("pan-advanced")) {
      testBody = {
        pan_number: testPan.trim().toUpperCase(),
        name: testName.trim(),
        initiator_id: "9999999999",
      };
    } else if (path.includes("bank-pennyless")) {
      testBody = {
        account_number: testAccount.trim(),
        ifsc_code: testIfsc.trim().toUpperCase(),
        initiator_id: "9999999999",
      };
    } else if (path.includes("pan")) {
      testBody = {
        pan_number: testPan.trim().toUpperCase(),
        consent: "Y",
      };
    } else {
      testBody = {
        mode: "sync",
        data: {
          ifsc: testIfsc.trim().toUpperCase(),
          consent: "Y",
          consent_text: "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        task_id: `live_test_${Date.now()}`,
      };
    }

    try {
      const res = await fetch("/api/internal/client/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointPath: selectedApi.endpointPath,
          body: testBody,
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
        _postman_id: "c011ad0m-e001-4000-8000-colladomegateway",
        name: "Colladome Enterprise API Gateway (v2.1)",
        description:
          "Official Colladome API Collection with Query Parameter Authentication (?api_key=...) and automated assertions.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: baseUrl, type: "string" },
        { key: "apiKey", value: apiKeyHint, type: "string" },
      ],
      item: (apis.length > 0 ? apis : [{ name: "PAN Advanced Verification", endpointPath: "/pan-advanced/v1", httpMethod: "POST" }]).map(
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
                api.endpointPath?.includes("pan")
                  ? { pan_number: "ABCDE1234F", consent: "Y" }
                  : { ifsc: "SBIN0000001", consent: "Y" },
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API House & Verification Suite</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Enterprise Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explore live production verification APIs, manage subscriptions, download specs, and run sandbox tests
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

      {/* Info Notice Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">How API Subscriptions Work</div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              Each API requires a <strong>one-time setup fee of ₹5,500 + 18% GST (Total: ₹6,490)</strong>. Once your payment receipt is approved by Admin, the API is activated and subsequent live requests are billed on a pay-per-hit model directly from your Colladome prepaid wallet.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/wallet"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
          >
            Manage Wallet
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search API by name, path (e.g. pan, bank, ifsc)..."
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
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
            Loading API Catalog & Subscriptions...
          </div>
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
                  const subInfo = getSubscriptionInfo(api.id);
                  const isSubscribed = subInfo.status === "APPROVED";
                  const isPending = subInfo.status === "PENDING";
                  const isRejected = subInfo.status === "REJECTED";

                  const customSell = subInfo.rule?.customPrice;
                  const displayRate = customSell !== undefined ? Number(customSell) : (api.defaultSellPrice || 2.50);

                  return (
                    <tr
                      key={api.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedApi(api)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {api.name}
                          {isSubscribed && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                          )}
                        </div>
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
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            ₹{displayRate.toFixed(2)}{" "}
                            <span className="text-[10px] font-normal text-slate-500">/ hit</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            One-time: ₹5,500+GST
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {isSubscribed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Under Review
                          </span>
                        ) : isRejected ? (
                          <button
                            type="button"
                            onClick={() => setViewRejectionSub(subInfo.sub)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejected (Re-submit)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openSubscribeModal(api)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Subscribe</span>
                          </button>
                        )}
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

      {/* SUBSCRIBE & ACTIVATE MODAL */}
      {subscribeTargetApi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Subscribe & Activate API
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {subscribeTargetApi.name}
                    </span>
                    <span>{subscribeTargetApi.endpointPath}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSubscribeTargetApi(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Success Notification */}
              {subSuccessMsg ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="text-base font-bold text-emerald-950">Subscription Request Received!</div>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    {subSuccessMsg}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSubscribeTargetApi(null)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      Done & Return to API House
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscriptionSubmit} className="space-y-6">
                  {/* Fee Breakdown Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-900 text-xs">One-Time Setup Fee Breakdown</span>
                      <span className="text-[10px] font-mono text-slate-500">Per API License</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Setup & Activation Fee:</span>
                        <span>₹5,500.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST (18% - CGST 9% + SGST 9%):</span>
                        <span>₹990.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span className="font-sans">Total Amount Payable:</span>
                        <span className="text-indigo-600">₹6,490.00</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic pt-1">
                      * Note: Once setup fee is verified, all subsequent live API calls are deducted per hit from your prepaid wallet balance.
                    </p>
                  </div>

                  {/* Company Official Bank Details for Transfer */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        Colladome Official Bank Account Details
                      </span>
                      <span className="text-[10px] text-indigo-400 font-mono">Current Account</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans">Account Name</div>
                          <div className="font-bold text-white text-xs">Colladome Tech Private Limited</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy("Colladome Tech Private Limited", "bank-name")}
                          className="p-1 hover:text-indigo-300 text-slate-400 transition"
                        >
                          {copiedSection === "bank-name" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans">Bank Name</div>
                          <div className="font-bold text-white text-xs">ICICI Bank</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy("ICICI Bank", "bank-bank")}
                          className="p-1 hover:text-indigo-300 text-slate-400 transition"
                        >
                          {copiedSection === "bank-bank" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans">Account Number</div>
                          <div className="font-bold text-emerald-400 text-sm tracking-wider">000205001234</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy("000205001234", "bank-acc")}
                          className="p-1 hover:text-indigo-300 text-slate-400 transition"
                        >
                          {copiedSection === "bank-acc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans">IFSC Code</div>
                          <div className="font-bold text-white text-sm">ICIC0000002</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy("ICIC0000002", "bank-ifsc")}
                          className="p-1 hover:text-indigo-300 text-slate-400 transition"
                        >
                          {copiedSection === "bank-ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 sm:col-span-2 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans">UPI ID (PhonePe / GPay / Paytm / BHIM)</div>
                          <div className="font-bold text-indigo-400 text-xs">colladome@icici</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy("colladome@icici", "bank-upi")}
                          className="p-1 hover:text-indigo-300 text-slate-400 transition"
                        >
                          {copiedSection === "bank-upi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Verification Form */}
                  <div className="space-y-4">
                    <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                      Submit Your Payment Details
                    </div>

                    {subErrorMsg && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{subErrorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Payment Method <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={subPaymentMethod}
                          onChange={(e) => setSubPaymentMethod(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-600"
                        >
                          <option value="IMPS">IMPS Immediate Transfer</option>
                          <option value="NEFT">NEFT National Transfer</option>
                          <option value="RTGS">RTGS Real Time Transfer</option>
                          <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Transaction UTR / Reference ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={subUtr}
                          onChange={(e) => setSubUtr(e.target.value)}
                          placeholder="e.g. 412019283746 or UPI Ref ID"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 uppercase"
                        />
                      </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Upload Transfer Screenshot / Receipt <span className="text-slate-400 font-normal">(Optional but recommended)</span>
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-500 transition bg-slate-50/50">
                        {subReceiptFile ? (
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2.5 text-left">
                              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                              <div className="overflow-hidden">
                                <div className="font-bold text-slate-900 truncate max-w-xs">{subReceiptFile.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{(subReceiptFile.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSubReceiptFile(null);
                                setSubReceiptPreview(null);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                            <UploadCloud className="w-6 h-6 text-slate-400" />
                            <span className="text-indigo-600 font-bold hover:underline">Click to upload payment receipt</span>
                            <span className="text-[10px] text-slate-400">PNG, JPG, or PDF up to 8MB</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Client Remarks */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Remarks / Transaction Notes <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={subRemarks}
                        onChange={(e) => setSubRemarks(e.target.value)}
                        placeholder="Any additional notes or transaction details..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSubscribeTargetApi(null)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={subSubmitting}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-60"
                      >
                        {subSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Verification...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Submit Payment Proof (₹6,490)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW REJECTION REASON MODAL */}
      {viewRejectionSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Subscription Rejected</h3>
                <div className="text-xs text-slate-500 font-mono">
                  UTR: {viewRejectionSub.utrNumber}
                </div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="font-bold text-rose-900">Admin Remarks / Reason:</div>
              <p className="text-rose-800 leading-relaxed font-mono">
                {viewRejectionSub.adminRemarks || "The submitted UTR could not be reconciled with the bank records. Please verify the amount and UTR number and re-submit."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewRejectionSub(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = apis.find((a) => a.id === viewRejectionSub.apiId);
                  setViewRejectionSub(null);
                  if (target) {
                    openSubscribeModal(target);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
              >
                Re-submit Payment Proof
              </button>
            </div>
          </div>
        </div>
      )}

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
                </div>
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
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Interactive 1-Click Live Test Runner</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Execute a real gateway verification hit right from your browser (Sandbox free session)
                  </p>
                </div>

                {/* Conditional Inputs based on API type */}
                {selectedApi.endpointPath?.includes("pan-advanced") ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={testPan}
                      onChange={(e) => setTestPan(e.target.value.toUpperCase())}
                      maxLength={10}
                      placeholder="PAN (e.g. ABCDE1234F)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold text-slate-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Name (e.g. RAHUL SHARMA)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                ) : selectedApi.endpointPath?.includes("bank-pennyless") ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={testAccount}
                      onChange={(e) => setTestAccount(e.target.value)}
                      placeholder="Bank Account (e.g. 123456789012)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={testIfsc}
                      onChange={(e) => setTestIfsc(e.target.value.toUpperCase())}
                      maxLength={11}
                      placeholder="IFSC (e.g. HDFC0001234)"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                ) : selectedApi.endpointPath?.includes("pan") ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testPan}
                      onChange={(e) => setTestPan(e.target.value.toUpperCase())}
                      maxLength={10}
                      placeholder="Enter PAN Number (e.g. ABCDE1234F)"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testIfsc}
                      onChange={(e) => setTestIfsc(e.target.value.toUpperCase())}
                      maxLength={11}
                      placeholder="Enter 11-char IFSC (e.g. SBIN0000001)"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end">
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-600">
                Billing Model: <strong className="text-slate-900">Prepaid Wallet + Setup Fee</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPostman}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Postman Collection</span>
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
