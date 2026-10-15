"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Play,
  Terminal,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Clock,
  Wallet,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function ClientApiHousePage() {
  const [apis, setApis] = useState<any[]>([]);
  const [selectedApi, setSelectedApi] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);

  const [selectedKeyPreset, setSelectedKeyPreset] = useState<string>("custom");
  const [apiKey, setApiKey] = useState<string>("");
  const [testBody, setTestBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    data: any;
    latency: number;
    isSandbox: boolean;
    debitedAmount: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/internal/admin/apis").then((res) => res.json()),
      fetch("/api/internal/client/me").then((res) => res.json()),
    ])
      .then(([apiData, clientData]) => {
        if (apiData.apis) {
          setApis(apiData.apis);
          if (apiData.apis.length > 0) {
            handleSelectApi(apiData.apis[0]);
          }
        }
        if (clientData.client) {
          setClientProfile(clientData.client);
          const liveKey = clientData.client.apiKeys?.find((k: any) => k.type === "PRODUCTION" && k.isActive);
          const sandKey = clientData.client.apiKeys?.find((k: any) => k.type === "SANDBOX" && k.isActive);
          if (liveKey) {
            setSelectedKeyPreset("live");
            setApiKey(`${liveKey.keyPrefix}${liveKey.keyHint}`);
          } else if (sandKey) {
            setSelectedKeyPreset("test");
            setApiKey(`${sandKey.keyPrefix}${sandKey.keyHint}`);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const liveKey = clientProfile?.apiKeys?.find((k: any) => k.type === "PRODUCTION" && k.isActive);
  const sandKey = clientProfile?.apiKeys?.find((k: any) => k.type === "SANDBOX" && k.isActive);

  const handleSelectApi = (api: any) => {
    setSelectedApi(api);
    setTestResult(null);
    try {
      const parsed = JSON.parse(api.requestSchema);
      const sample: any = {};
      Object.keys(parsed).forEach((k) => {
        sample[k] = parsed[k].example || "sample";
      });
      setTestBody(JSON.stringify(sample, null, 2));
    } catch {
      setTestBody("{}");
    }
  };

  const handleKeyPresetChange = (preset: string) => {
    setSelectedKeyPreset(preset);
    if (preset === "live") {
      setApiKey(liveKey ? `${liveKey.keyPrefix}${liveKey.keyHint}` : "");
    } else if (preset === "test") {
      setApiKey(sandKey ? `${sandKey.keyPrefix}${sandKey.keyHint}` : "");
    } else {
      setApiKey("");
    }
  };

  const handleExecuteCall = async () => {
    if (!selectedApi) return;
    setLoading(true);
    setTestResult(null);
    setCopiedResponse(false);

    const startTime = performance.now();
    const isSandboxKey = apiKey.startsWith("cd_test_");

    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(testBody);
      } catch {
        alert("Invalid JSON format in request body");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api${selectedApi.endpointPath}`, {
        method: selectedApi.httpMethod,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "x-client-order-id": `CLI_TEST_${Date.now()}`,
        },
        body: JSON.stringify(parsedBody),
      });

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      const json = await res.json();

      setTestResult({
        status: res.status,
        data: json,
        latency,
        isSandbox: isSandboxKey || json.isSimulation === true,
        debitedAmount: res.status === 200 && !isSandboxKey ? selectedApi.defaultSellPrice : 0,
      });
    } catch (err: any) {
      const endTime = performance.now();
      setTestResult({
        status: 500,
        data: { error: err.message },
        latency: Math.round(endTime - startTime),
        isSandbox: isSandboxKey,
        debitedAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(JSON.stringify(testResult.data, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">API House & Live Test Console</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Explore subscribed verification APIs and test live requests with your production or sandbox credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: API Catalog List */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3">
          <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
            Available APIs ({apis.length})
          </div>

          <div className="space-y-2">
            {apis.map((api) => {
              const isSelected = selectedApi?.id === api.id;
              return (
                <div
                  key={api.id}
                  onClick={() => handleSelectApi(api)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                      : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{api.name}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? "bg-neutral-800 text-neutral-100 border-neutral-700"
                          : "bg-white text-neutral-800 border-neutral-200"
                      }`}
                    >
                      {api.httpMethod}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono mt-1 ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                    {api.endpointPath}
                  </div>
                  <div
                    className={`flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t ${
                      isSelected ? "border-neutral-800 text-neutral-300" : "border-neutral-100 text-neutral-400"
                    }`}
                  >
                    <span>{api.category.name}</span>
                    <strong className={isSelected ? "text-white" : "text-neutral-900"}>
                      ₹{api.defaultSellPrice.toFixed(2)} / hit
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Tester & Schema Console */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApi && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-6">
              {/* API Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-150">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-900 font-mono text-xs font-bold rounded border border-neutral-200">
                      {selectedApi.httpMethod}
                    </span>
                    <h2 className="text-lg font-bold text-neutral-900">{selectedApi.name}</h2>
                  </div>
                  <code className="text-xs text-neutral-700 font-mono block mt-1 font-semibold">
                    https://api.colladome.com{selectedApi.endpointPath}
                  </code>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-neutral-400 font-medium">Rate per hit</div>
                  <div className="text-base font-extrabold text-neutral-900">
                    ₹{selectedApi.defaultSellPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-600 leading-relaxed">{selectedApi.description}</p>

              {/* Console Input */}
              <div className="space-y-4 pt-1">
                {/* Key Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-900 uppercase">
                      Select Authentication Key
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {selectedKeyPreset === "live" ? "Production Mode" : selectedKeyPreset === "test" ? "Sandbox Mode" : "Custom Key"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleKeyPresetChange("live")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition text-left ${
                        selectedKeyPreset === "live"
                          ? "bg-black text-white border-black"
                          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Production Key</span>
                        {selectedKeyPreset === "live" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono truncate ${selectedKeyPreset === "live" ? "text-neutral-300" : "text-neutral-400"}`}>
                        {liveKey ? `${liveKey.keyPrefix}${liveKey.keyHint}` : "Not Created"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleKeyPresetChange("test")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition text-left ${
                        selectedKeyPreset === "test"
                          ? "bg-black text-white border-black"
                          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Sandbox Test Key</span>
                        {selectedKeyPreset === "test" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono truncate ${selectedKeyPreset === "test" ? "text-neutral-300" : "text-neutral-400"}`}>
                        {sandKey ? `${sandKey.keyPrefix}${sandKey.keyHint}` : "Not Created"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleKeyPresetChange("custom")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition text-left ${
                        selectedKeyPreset === "custom"
                          ? "bg-black text-white border-black"
                          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Custom API Key</span>
                        {selectedKeyPreset === "custom" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${selectedKeyPreset === "custom" ? "text-neutral-300" : "text-neutral-400"}`}>
                        Manual Input
                      </div>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setSelectedKeyPreset("custom");
                    }}
                    placeholder="Enter Colladome API Key (x-api-key)"
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:outline-none focus:border-neutral-500"
                  />
                </div>

                {/* Payload */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 uppercase mb-1">
                    Request Payload (JSON)
                  </label>
                  <textarea
                    rows={6}
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    className="w-full text-xs font-mono border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:border-neutral-500 bg-neutral-50"
                  ></textarea>
                </div>

                <button
                  onClick={handleExecuteCall}
                  disabled={loading || !apiKey.trim()}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{loading ? "Executing via Gateway..." : "Execute API Hit"}</span>
                </button>
              </div>

              {/* Live Output */}
              {testResult && (
                <div className="mt-4 rounded-xl border border-neutral-800 bg-[#09090b] p-4 text-xs font-mono overflow-hidden space-y-3">
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
                          testResult.status === 200
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-rose-950 text-rose-400 border-rose-800"
                        }`}
                      >
                        HTTP {testResult.status}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{testResult.latency} ms</span>
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        <Wallet className="w-3 h-3 text-neutral-400" />
                        <span>
                          {testResult.debitedAmount > 0
                            ? `₹${testResult.debitedAmount.toFixed(2)} debited`
                            : testResult.isSandbox
                            ? "₹0.00 (Sandbox Free)"
                            : "No deduction"}
                        </span>
                      </span>
                    </div>

                    <button
                      onClick={handleCopyJson}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[10px] flex items-center gap-1.5 transition"
                    >
                      {copiedResponse ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* JSON viewer */}
                  <pre
                    className={`overflow-x-auto text-[11px] leading-relaxed max-h-80 ${
                      testResult.status === 200 ? "text-neutral-200" : "text-rose-300"
                    }`}
                  >
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
