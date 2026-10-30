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
  Trash2,
  Sparkles,
} from "lucide-react";

const GATEWAY_PRESETS = [
  {
    id: "ifsc",
    label: "IFSC Verification [ZO]",
    name: "IFSC Code Verification",
    colladomePath: "/ifsc-verification/v1/",
    upstreamUrl: "https://api.upstream-provider.com/api/v1/in/utility/ifsc/lite",
    httpMethod: "POST",
    costPrice: 0.5,
    sellPrice: 1.2,
    setupFee: 0.0,
    categorySlug: "banking-financials",
    bodyText: JSON.stringify(
      {
        mode: "sync",
        data: {
          ifsc: "THRS0000XXX",
          consent: "Y",
          consent_text:
            "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        result: {
          upi: false,
          bank: "Thrissur District Co-Operative Bank",
          city: "KODUNGALLUR",
          ifsc: "THRS0000XXX",
          imps: true,
          micr: "680803002",
          neft: true,
          rtgs: true,
          state: "KERALA",
          branch: "KODUNGALLUR",
          centre: "THRISSUR",
          address: "MAIN ROAD, KODUNGALLUR, THRISSUR DISTRICT",
          contact: "",
          district: "THRISSUR",
          bank_code: "THRS",
        },
        success: true,
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        response_code: "100",
        response_message: "Valid Authentication",
      },
      null,
      2
    ),
  },
  {
    id: "pan",
    label: "PAN Verification [ZO]",
    name: "PAN Detailed Verification",
    colladomePath: "/pan-verification/v1/",
    upstreamUrl: "https://api.upstream-provider.com/api/v1/in/identity/pan/lite",
    httpMethod: "POST",
    costPrice: 1.2,
    sellPrice: 2.2,
    setupFee: 0.0,
    categorySlug: "identity-verification",
    bodyText: JSON.stringify(
      {
        mode: "sync",
        data: {
          customer_pan_number: "ABCDE1234F",
          consent: "Y",
          consent_text:
            "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        result: {
          pan_number: "ABCDE1234F",
          user_full_name: "RAHUL SHARMA",
          pan_status: "VALID",
          pan_type: "Individual",
          aadhaar_seeding_status: "Y",
        },
        success: true,
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        response_code: "100",
        response_message: "Valid Authentication",
      },
      null,
      2
    ),
  },
  {
    id: "pan-fetch-ek",
    label: "PAN Fetch [EK]",
    name: "PAN Fetch Verification",
    colladomePath: "/pan-verification/v1/",
    upstreamUrl: "https://staging.eko.in/ekoapi/v3/tools/kyc/fetch-pan",
    httpMethod: "POST",
    costPrice: 1.3,
    sellPrice: 2.2,
    setupFee: 5500.0,
    categorySlug: "identity-verification",
    bodyText: JSON.stringify(
      {
        initiator_id: "9999999999",
        pan_number: "ABCDE1234F",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        status: 0,
        response_type_id: 0,
        message: "Success",
        data: {
          pan_no: "ABCDE1234F",
          fullname: "RAHUL SHARMA",
          category: "Individual",
          status: "VALID",
          upstream_rrn: "123456789",
        },
      },
      null,
      2
    ),
  },
  {
    id: "pan-advanced",
    label: "PAN Advanced Verification [EK]",
    name: "PAN Advanced Verification",
    colladomePath: "/pan-advanced/v1",
    upstreamUrl: "https://staging.eko.in/ekoapi/v3/tools/kyc/pan-advanced",
    httpMethod: "POST",
    costPrice: 2.04,
    sellPrice: 3.5,
    setupFee: 5500.0,
    categorySlug: "identity-verification",
    bodyText: JSON.stringify(
      {
        initiator_id: "9999999999",
        client_ref_id: "order_12345",
        pan_number: "ABCDE1234F",
        name: "RAHUL SHARMA",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        status: 0,
        response_type_id: 0,
        message: "Success",
        data: {
          registered_name: "RAHUL SHARMA",
          pan_number: "ABCDE1234F",
          type_of_holder: "Individual",
          aadhaar_seeding_status: "OPERATIVE",
          status: "VALID",
        },
      },
      null,
      2
    ),
  },
  {
    id: "bank-pennyless",
    label: "Bank Account Pennyless [EK]",
    name: "Bank Account Verification (Pennyless)",
    colladomePath: "/bank-pennyless/v1",
    upstreamUrl: "https://staging.eko.in/ekoapi/v3/tools/kyc/bank-acc-verify-pennyless",
    httpMethod: "POST",
    costPrice: 2.04,
    sellPrice: 3.5,
    setupFee: 5500.0,
    categorySlug: "banking-financials",
    bodyText: JSON.stringify(
      {
        initiator_id: "9999999999",
        client_ref_id: "order_12345",
        account: "123456789012",
        ifsc: "HDFC0001234",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        status: 0,
        response_type_id: 0,
        message: "Success",
        data: {
          verified_beneficiary_name: "VIKRAM MALHOTRA",
          bank_account_no: "123456789012",
          bank_ifsc: "HDFC0001234",
          status: "VERIFIED",
        },
      },
      null,
      2
    ),
  },
  {
    id: "bav",
    label: "Bank Penny Drop [ZO]",
    name: "Bank Account Penny Drop",
    colladomePath: "/bank-verification/v1/",
    upstreamUrl: "https://api.upstream-provider.com/api/v1/in/financial/bav/lite",
    httpMethod: "POST",
    costPrice: 1.8,
    sellPrice: 3.0,
    categorySlug: "banking-financials",
    bodyText: JSON.stringify(
      {
        mode: "sync",
        data: {
          bank_account_number: "30982019284",
          bank_ifsc_code: "SBIN0000300",
          beneficiary_name: "RAHUL SHARMA",
          consent: "Y",
          consent_text:
            "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        result: {
          account_status: "VALID",
          beneficiary_name: "RAHUL SHARMA",
          bank_name: "State Bank of India",
          ifsc_code: "SBIN0000300",
          utr_number: "412018392019",
        },
        success: true,
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        response_code: "100",
        response_message: "Valid Authentication",
      },
      null,
      2
    ),
  },
  {
    id: "gstin",
    label: "GSTIN Verification",
    name: "GSTIN Business Verification",
    colladomePath: "/gstin-verification/v1/",
    upstreamUrl: "https://api.upstream-provider.com/api/v1/in/merchant/gstin/lite",
    httpMethod: "POST",
    costPrice: 1.4,
    sellPrice: 2.5,
    categorySlug: "business-tax",
    bodyText: JSON.stringify(
      {
        mode: "sync",
        data: {
          business_gstin_number: "27AABCU9603R1ZM",
          consent: "Y",
          consent_text:
            "I hear by declare my consent agreement for fetching my information via Colladome API",
        },
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      },
      null,
      2
    ),
    responseText: JSON.stringify(
      {
        result: {
          gstin: "27AABCU9603R1ZM",
          legal_name: "RELIANCE INDUSTRIES LIMITED",
          trade_name: "RELIANCE INDUSTRIES",
          gstin_status: "Active",
          taxpayer_type: "Regular",
        },
        success: true,
        task_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
        response_code: "100",
        response_message: "Valid Authentication",
      },
      null,
      2
    ),
  },
];

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

  // Add API Form State (Advanced)
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
    defaultSetupFee: 0,
    primaryProviderId: "",
    primaryEndpoint: "",
    secondaryProviderId: "",
    secondaryEndpoint: "",
    requestSchemaText: "",
    responseSchemaText: "",
  });

  // Fast Raw Integrator (Upstream Studio) state
  const [fastMode, setFastMode] = useState<"fast" | "advanced">("fast");
  const [fastForm, setFastForm] = useState({
    name: "",
    colladomePath: "/pan-verification/v1/",
    upstreamUrl: "https://api.upstream-provider.com/api/v1/in/identity/pan/lite",
    providerId: "",
    httpMethod: "POST",
    bodyText: GATEWAY_PRESETS[1].bodyText,
    responseText: GATEWAY_PRESETS[1].responseText,
    sellPrice: 2.2,
    costPrice: 1.2,
    setupFee: 0,
    categoryId: "",
  });

  const handleLoadPreset = (preset: (typeof GATEWAY_PRESETS)[0]) => {
    const matchedCat = categories.find((c) => c.slug === preset.categorySlug);
    const isEk = preset.upstreamUrl.includes("eko") || preset.label.includes("[EK]");
    const targetProvCode = isEk ? "EK" : "ZO";
    const primaryProv =
      providers.find((p) => p.code === targetProvCode || p.code === targetProvCode + "OP") ||
      providers[0];
    setFastForm({
      name: preset.name,
      colladomePath: preset.colladomePath,
      upstreamUrl: preset.upstreamUrl,
      providerId: primaryProv?.id || fastForm.providerId,
      httpMethod: preset.httpMethod,
      bodyText: preset.bodyText,
      responseText: preset.responseText,
      costPrice: preset.costPrice,
      sellPrice: preset.sellPrice,
      setupFee: (preset as any).setupFee || 0,
      categoryId: matchedCat?.id || fastForm.categoryId,
    });
  };

  const handleDeleteApi = async (apiId: string, apiName: string) => {
    if (!confirm(`Delete '${apiName}' from the Colladome Gateway catalog?`)) return;
    try {
      const res = await fetch(`/api/internal/admin/apis?id=${apiId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete API");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleFastIntegrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastForm.name || !fastForm.colladomePath) {
      alert("API Name and Colladome Morphed Endpoint Path are required.");
      return;
    }

    // 1. Parse & Auto-Morph Request JSON (ensure "via Colladome API")
    let parsedBody: any = {};
    try {
      const morphedReqText = (fastForm.bodyText || "{}").replace(
        /via (ZOOP|IDFY|DECENTRO|SURPASS) API/gi,
        "via Colladome API"
      );
      parsedBody = JSON.parse(morphedReqText);
    } catch {
      alert("Invalid JSON format in Request Sample Body");
      return;
    }

    // Build structured parameter schema (supports upstream { mode, data: {...}, task_id } envelope)
    const schemaObj: any = {};
    Object.keys(parsedBody).forEach((k) => {
      const val = parsedBody[k];
      if (k === "data" && val && typeof val === "object" && !Array.isArray(val)) {
        const subFields: Record<string, any> = {};
        Object.keys(val).forEach((subKey) => {
          subFields[subKey] = {
            type: typeof val[subKey],
            required: true,
            example: val[subKey],
            description:
              subKey === "consent"
                ? 'Must be "Y"'
                : subKey === "consent_text"
                ? "Colladome user consent declaration"
                : `Input parameter: ${subKey}`,
          };
        });
        schemaObj[k] = {
          type: "object",
          required: true,
          example: val,
          fields: subFields,
        };
      } else {
        schemaObj[k] = {
          type: typeof val,
          required: k !== "task_id",
          example: val,
          description:
            k === "task_id"
              ? "Client Order ID / Unique Request Reference UUID"
              : k === "mode"
              ? "Execution mode (sync)"
              : undefined,
        };
      }
    });

    // 2. Parse & Auto-Sanitize Response JSON (strip vendor group_id, request_id, metadata)
    let sanitizedResponseSchema: any = {
      success: true,
      response_code: "100",
      response_message: "Valid Authentication",
      colladome_order_id: "CDO1792150992104829",
      client_order_id: "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
      result: parsedBody.data || parsedBody,
    };

    if (fastForm.responseText?.trim()) {
      try {
        const rawResp = JSON.parse(fastForm.responseText);
        sanitizedResponseSchema = {
          success: true,
          response_code: "100",
          response_message: rawResp.response_message || "Valid Authentication",
          colladome_order_id: "CDO1792150992104829",
          client_order_id: rawResp.task_id || "f26eb21e-4c35-4491-b2d5-41fa0e545a34",
          result: rawResp.result || rawResp.data || rawResp,
          request_timestamp: new Date().toISOString(),
          response_timestamp: new Date().toISOString(),
        };
      } catch {
        alert("Invalid JSON format in Response Sample Body");
        return;
      }
    }

    try {
      const res = await fetch("/api/internal/admin/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fastForm.name,
          endpointPath: fastForm.colladomePath,
          upstreamUrl: fastForm.upstreamUrl,
          primaryProviderId: fastForm.providerId || undefined,
          httpMethod: fastForm.httpMethod,
          defaultCostPrice: Number(fastForm.costPrice) || 0,
          defaultSellPrice: Number(fastForm.sellPrice) || 2.0,
          defaultSetupFee: Number(fastForm.setupFee) || 0,
          requestSchema: JSON.stringify(schemaObj, null, 2),
          responseSchema: JSON.stringify(sanitizedResponseSchema, null, 2),
          categoryId: fastForm.categoryId || undefined,
          description: `${fastForm.name} morphed via Colladome Gateway (${fastForm.colladomePath})`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "API Endpoint morphed and deployed into Colladome Gateway!");
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
    appId: "",
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
        const provList = provData.providers || apiData.providers || [];
        setProviders(provList);

        const primaryProv = provList.find((p: any) => p.code === "ZO" || p.code === "ZOOP") || provList[0];
        if (primaryProv && !fastForm.providerId) {
          setFastForm((prev) => ({ ...prev, providerId: primaryProv.id }));
        }
        if (apiData.categories?.length > 0 && !form.categoryId) {
          setForm((prev) => ({
            ...prev,
            categoryId: apiData.categories[0].id,
            primaryProviderId: primaryProv?.id || "",
            secondaryProviderId: provList[1]?.id || "",
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
      appId: "",
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
            Morph upstream provider endpoints into Colladome Gateway routes with auto failover
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
            <span>Morph / Add API</span>
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
                Live Colladome gateway routes, upstream provider mappings, pricing, and profit margins
              </p>
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Morph New Upstream Endpoint</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">API Name</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Method</th>
                  <th className="py-3.5 px-3 font-mono">Colladome Gateway Route</th>
                  <th className="py-3.5 px-3">Upstream Provider</th>
                  <th className="py-3.5 px-3">Cost Price</th>
                  <th className="py-3.5 px-3">Retail Sell</th>
                  <th className="py-3.5 px-3">Net Margin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {apis.map((api) => {
                  const primaryMapping = api.providerMappings?.find((m: any) => m.priority === 1) || api.providerMappings?.[0];
                  const fallbackMapping = api.providerMappings?.find((m: any) => m.priority === 2);
                  const margin = api.defaultSellPrice - api.defaultCostPrice;
                  const displayPath = api.endpointPath.endsWith("/")
                    ? api.endpointPath
                    : `${api.endpointPath}/`;

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
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                        {displayPath}
                      </td>
                      <td className="py-3.5 px-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-neutral-900">
                            {primaryMapping?.provider?.name || "Primary Gateway"}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate mt-0.5 max-w-[180px]">
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
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-neutral-900">₹{api.defaultSellPrice.toFixed(2)}</div>
                        {api.defaultSetupFee > 0 && (
                          <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            +₹{api.defaultSetupFee} setup
                          </div>
                        )}
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
                            Edit Rate
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteApi(api.id, api.name)}
                            title="Delete API Route"
                            className="p-1 rounded border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 text-neutral-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Tab 2: Add / Morph API Form */}
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
              <span>⚡ Upstream API Morpher Studio (Paste Mode)</span>
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
              <span>Advanced Multi-Provider Failover Config</span>
            </button>
          </div>

          {fastMode === "fast" ? (
            /* Fast Upstream Morpher Studio */
            <form onSubmit={handleFastIntegrate} className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Upstream API Morpher Studio</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Paste any upstream URL and sample Request/Response JSON. Colladome automatically morphs the URL, rewrites consent text, injects credentials, and strips vendor IDs!
                  </p>
                </div>

                {/* 1-Click Gateway Preset Loaders */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>1-Click Gateway Presets:</span>
                  </span>
                  {GATEWAY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 font-semibold text-[11px] transition border border-neutral-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Colladome Morphed Endpoint Path *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/pan-verification/v1/"
                    value={fastForm.colladomePath}
                    onChange={(e) => setFastForm({ ...fastForm, colladomePath: e.target.value })}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-black font-bold text-blue-600"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Clients will call: <code>https://api.colladome.com{fastForm.colladomePath}</code>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Upstream Provider Target URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.upstream-provider.com/api/v1/in/identity/pan/lite"
                    value={fastForm.upstreamUrl}
                    onChange={(e) => setFastForm({ ...fastForm, upstreamUrl: e.target.value })}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-black"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Colladome forwards morphed payload here with your upstream credentials &amp; headers
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Upstream Provider</label>
                  <select
                    value={fastForm.providerId}
                    onChange={(e) => setFastForm({ ...fastForm, providerId: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white font-semibold text-neutral-900"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Category</label>
                  <select
                    value={fastForm.categoryId}
                    onChange={(e) => setFastForm({ ...fastForm, categoryId: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white text-neutral-800"
                  >
                    <option value="">Auto-Assign Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Method</label>
                    <select
                      value={fastForm.httpMethod}
                      onChange={(e) => setFastForm({ ...fastForm, httpMethod: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 bg-white font-bold"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Base Cost (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={fastForm.costPrice}
                      onChange={(e) => setFastForm({ ...fastForm, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Sell Rate (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={fastForm.sellPrice}
                      onChange={(e) => setFastForm({ ...fastForm, sellPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Setup Fee (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={fastForm.setupFee}
                      onChange={(e) => setFastForm({ ...fastForm, setupFee: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold text-amber-700 bg-amber-50/40"
                    />
                  </div>
                </div>
              </div>

              {/* Raw JSON Paste Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    1. Paste Upstream Request Sample JSON
                  </label>
                  <textarea
                    rows={10}
                    value={fastForm.bodyText}
                    onChange={(e) => setFastForm({ ...fastForm, bodyText: e.target.value })}
                    className="w-full font-mono text-xs border border-neutral-300 rounded-lg p-3 text-neutral-900 bg-neutral-50"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Automatically normalizes consent text → <code>&quot;via Colladome API&quot;</code> and extracts nested <code>data.*</code> parameters for the Client Catalog!
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    2. Paste Upstream 200 Response Sample JSON (Optional)
                  </label>
                  <textarea
                    rows={10}
                    value={fastForm.responseText}
                    onChange={(e) => setFastForm({ ...fastForm, responseText: e.target.value })}
                    className="w-full font-mono text-xs border border-neutral-300 rounded-lg p-3 text-neutral-900 bg-neutral-50"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Colladome strips <code>group_id</code>, <code>request_id</code>, and <code>metadata.billable</code> for clients and uses <code>result</code> for Sandbox testing!
                  </p>
                </div>
              </div>

              {/* Colladome Gateway Contract Box */}
              <div className="bg-[#09090b] text-white p-5 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Live Colladome Morpher Pipeline Preview:</span>
                </div>
                <div className="space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                  <div>
                    <strong>1. Client Calls Colladome:</strong>{" "}
                    <code className="text-white bg-black px-1.5 py-0.5 rounded">
                      {fastForm.httpMethod} https://api.colladome.com
                      {fastForm.colladomePath.startsWith("/")
                        ? fastForm.colladomePath
                        : `/${fastForm.colladomePath}`}
                      ?api_key=cd_live_...
                    </code>
                  </div>
                  <div>
                    <strong>2. Gateway Auth &amp; Billing:</strong> Validates client API key, IP whitelist, and wallet balance ≥ ₹{fastForm.sellPrice.toFixed(2)}.
                  </div>
                  <div>
                    <strong>3. Upstream Morphing:</strong> Injects Colladome&apos;s upstream credentials &amp; headers and forwards to{" "}
                    <code className="text-amber-300">{fastForm.upstreamUrl}</code>.
                  </div>
                  <div>
                    <strong>4. Response Sanitization:</strong> Stores raw upstream <code>task_id</code>, <code>group_id</code>, <code>request_id</code>, and <code>billable</code> flag in Admin Audit Logs, returning only <code>colladome_order_id</code>, <code>client_order_id</code>, and <code>result</code> to the client!
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
                  <span>⚡ Morph &amp; Deploy Endpoint into Colladome Gateway</span>
                </button>
              </div>
            </form>
          ) : (
            /* Advanced Multi-Provider Config */
            <form onSubmit={handleCreateApi} className="p-6 space-y-6">
              <div className="pb-3 border-b border-neutral-100">
                <h2 className="font-bold text-sm text-neutral-900">Advanced Multi-Provider Routing &amp; Failover</h2>
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
                    placeholder="/passport-verification/v1/"
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

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">One-Time Setup Fee (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={form.defaultSetupFee}
                    onChange={(e) => setForm({ ...form, defaultSetupFee: Number(e.target.value) })}
                    className="w-full text-xs border border-neutral-300 rounded-lg p-2.5 font-bold text-amber-700 bg-amber-50/40"
                  />
                </div>
              </div>

              {/* Upstream Provider Mapping Box */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-neutral-700" />
                  <span>Primary &amp; Secondary Failover Providers</span>
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
                      placeholder="/api/v1/in/identity/pan/lite"
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
              <h2 className="text-sm font-bold text-neutral-900">Upstream Providers &amp; Direct Gateways</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upstream provider integrations, encrypted credentials, base URLs, and real-time connectivity status
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Provider Name &amp; Code</th>
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
                  placeholder="https://api.upstream-provider.com"
                  value={providerForm.baseUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* App ID (Upstream app-id / client-id header / initiator-id) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {providerForm.authType === "EKO_HMAC"
                    ? "Initiator ID (EK Gateway Mobile Number / initiator_id)"
                    : "Provider App ID (app-id / Client ID)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedProvider.appIdHint && selectedProvider.appIdHint !== "Not Configured"
                      ? `Keep existing (${selectedProvider.appIdHint}) or enter new`
                      : providerForm.authType === "EKO_HMAC"
                      ? "e.g. 9999999999"
                      : "Enter upstream app-id"
                  }
                  value={providerForm.appId}
                  onChange={(e) => setProviderForm({ ...providerForm, appId: e.target.value })}
                  className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* API Key / Developer Key */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {providerForm.authType === "EKO_HMAC"
                    ? "Developer Key (EK Gateway developer_key)"
                    : "Provider API Key / Client ID"}
                </label>
                <input
                  type="password"
                  placeholder={
                    selectedProvider.keyHint !== "Not Configured"
                      ? `Keep existing encrypted key (${selectedProvider.keyHint}) or enter new`
                      : providerForm.authType === "EKO_HMAC"
                      ? "Enter EK developer_key"
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

              {/* API Secret / Secret Access Key */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {providerForm.authType === "EKO_HMAC"
                    ? "Secret Access Key (EK HMAC-SHA256 Secret)"
                    : "Provider API Secret / App Secret"}
                </label>
                <input
                  type="password"
                  placeholder={
                    selectedProvider.hasSecret
                      ? "Keep existing secret or enter new"
                      : providerForm.authType === "EKO_HMAC"
                      ? "Enter EK secret access key"
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
                  <option value="EKO_HMAC">EKO_HMAC (developer_key, secret-key HMAC-SHA256, initiator_id)</option>
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
                      Direct HTTP fetch() to provider&apos;s baseUrl with real-time failover.
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
                  Provider is Active &amp; accepting gateway requests
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
