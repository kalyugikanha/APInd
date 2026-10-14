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
} from "lucide-react";

export default function ClientApiHousePage() {
  const [apis, setApis] = useState<any[]>([]);
  const [selectedApi, setSelectedApi] = useState<any>(null);
  const [apiKey, setApiKey] = useState("cd_live_acme_prod_secret_88319a2b");
  const [testBody, setTestBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/internal/admin/apis")
      .then((res) => res.json())
      .then((data) => {
        if (data.apis) {
          setApis(data.apis);
          if (data.apis.length > 0) {
            handleSelectApi(data.apis[0]);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

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

  const handleExecuteCall = async () => {
    if (!selectedApi) return;
    setLoading(true);
    setTestResult(null);

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
          "x-api-key": apiKey,
          "x-client-order-id": `CLI_TEST_${Date.now()}`,
        },
        body: JSON.stringify(parsedBody),
      });

      const json = await res.json();
      setTestResult({
        status: res.status,
        data: json,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        data: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API House & Testing Console</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore subscribed verification APIs and test live requests with your production or sandbox credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: API Catalog List */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
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
                      ? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{api.name}</span>
                    <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {api.httpMethod}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">{api.endpointPath}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                    <span>{api.category.name}</span>
                    <strong className="text-emerald-600">₹{api.defaultSellPrice.toFixed(2)} / hit</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Tester & Schema Console */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApi && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-xs font-bold rounded">
                      {selectedApi.httpMethod}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{selectedApi.name}</h2>
                  </div>
                  <code className="text-xs text-blue-600 font-mono block mt-1">
                    https://api.colladome.com{selectedApi.endpointPath}
                  </code>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Rate per hit</div>
                  <div className="text-base font-extrabold text-emerald-600">
                    ₹{selectedApi.defaultSellPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">{selectedApi.description}</p>

              {/* Console Input */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Your Colladome API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Request Payload (JSON)
                  </label>
                  <textarea
                    rows={6}
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>

                <button
                  onClick={handleExecuteCall}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{loading ? "Executing via Gateway..." : "Execute API Hit"}</span>
                </button>
              </div>

              {/* Live Output */}
              {testResult && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Gateway Live Response:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        testResult.status === 200
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      HTTP {testResult.status}
                    </span>
                  </div>

                  <pre
                    className={`overflow-x-auto ${
                      testResult.status === 200 ? "text-emerald-400" : "text-rose-400"
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
