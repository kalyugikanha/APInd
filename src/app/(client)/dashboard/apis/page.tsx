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
  FileCode,
  Sparkles,
} from "lucide-react";

export default function ClientApiHousePage() {
  const [apis, setApis] = useState<any[]>([]);
  const [selectedApi, setSelectedApi] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);

  // Playground state
  const [testBody, setTestBody] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeSnippetLang, setActiveSnippetLang] = useState<"curl" | "node" | "python" | "go" | "php">("curl");

  const [testResult, setTestResult] = useState<{
    status: number;
    latency: number;
    result: any;
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
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectApi = (api: any) => {
    setSelectedApi(api);
    setTestResult(null);

    // Provide clean, structured default bodies
    if (api.endpointPath?.includes("/pan")) {
      setTestBody(JSON.stringify({ pan_number: "ABCDE1234F" }, null, 2));
    } else if (api.endpointPath?.includes("/bank-verify") || api.endpointPath?.includes("/bank")) {
      setTestBody(
        JSON.stringify(
          {
            account_number: "123456789012",
            ifsc_code: "HDFC0001234",
            beneficiary_name: "VIKRAM MALHOTRA",
          },
          null,
          2
        )
      );
    } else if (api.endpointPath?.includes("/gstin-verify") || api.endpointPath?.includes("/gstin")) {
      setTestBody(JSON.stringify({ gstin: "07AAAAA0000A1Z5" }, null, 2));
    } else {
      try {
        const parsed = JSON.parse(api.requestSchema);
        const sample: any = {};
        Object.keys(parsed).forEach((k) => {
          sample[k] = parsed[k].example || "sample_value";
        });
        setTestBody(JSON.stringify(sample, null, 2));
      } catch {
        setTestBody("{}");
      }
    }
  };

  const handleRunTest = async () => {
    if (!selectedApi) return;
    setLoading(true);
    setTestResult(null);
    setCopiedResponse(false);

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(testBody);
    } catch {
      alert("Invalid JSON format in Request Parameters body");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/internal/client/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointPath: selectedApi.endpointPath,
          body: parsedBody,
          apiKey: customApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      setTestResult({
        status: data.status || res.status,
        latency: data.latency || 0,
        result: data.result || data,
      });
    } catch (err: any) {
      setTestResult({
        status: 500,
        latency: 0,
        result: { error: err.message || "Failed to execute playground request" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(JSON.stringify(testResult.result, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Generate multi-language code snippets
  const getCodeSnippet = (lang: string) => {
    if (!selectedApi) return "";
    const endpoint = `https://api.colladome.com${selectedApi.endpointPath}`;
    const cleanBody = testBody.replace(/\n/g, "").replace(/\s+/g, " ");

    switch (lang) {
      case "curl":
        return `curl -X POST ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -d '${cleanBody}'`;

      case "node":
        return `const response = await fetch("${endpoint}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": process.env.COLLADOME_API_KEY,\n  },\n  body: JSON.stringify(${testBody}),\n});\nconst data = await response.json();\nconsole.log(data);`;

      case "python":
        return `import requests\nimport os\n\nurl = "${endpoint}"\nheaders = {\n    "Content-Type": "application/json",\n    "x-api-key": os.getenv("COLLADOME_API_KEY")\n}\npayload = ${testBody}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;

      case "go":
        return `package main\n\nimport (\n    "bytes"\n    "fmt"\n    "io"\n    "net/http"\n    "os"\n)\n\nfunc main() {\n    url := "${endpoint}"\n    body := []byte(\`${cleanBody}\`)\n    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))\n    req.Header.Set("Content-Type", "application/json")\n    req.Header.Set("x-api-key", os.Getenv("COLLADOME_API_KEY"))\n\n    client := &http.Client{}\n    resp, err := client.Do(req)\n    if err != nil { panic(err) }\n    defer resp.Body.Close()\n    respBody, _ := io.ReadAll(resp.Body)\n    fmt.Println(string(respBody))\n}`;

      case "php":
        return `<?php\n$curl = curl_init();\ncurl_setopt_array($curl, [\n  CURLOPT_URL => "${endpoint}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "POST",\n  CURLOPT_POSTFIELDS => '${cleanBody}',\n  CURLOPT_HTTPHEADER => [\n    "Content-Type: application/json",\n    "x-api-key: " . getenv("COLLADOME_API_KEY")\n  ],\n]);\n$response = curl_exec($curl);\ncurl_close($curl);\necho $response;`;

      default:
        return "";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Studio & Interactive Playground</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore subscribed identity APIs, test live responses directly in the browser, and export backend integration snippets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Available APIs Catalog */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Subscribed APIs</span>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {apis.length}
            </span>
          </div>

          <div className="space-y-2">
            {apis.map((api) => {
              const isSelected = selectedApi?.id === api.id;
              return (
                <div
                  key={api.id}
                  onClick={() => handleSelectApi(api)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{api.name}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? "bg-slate-800 text-slate-100 border-slate-700"
                          : "bg-slate-100 text-slate-800 border-slate-200/60"
                      }`}
                    >
                      {api.httpMethod}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {api.endpointPath}
                  </div>
                  <div
                    className={`flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t ${
                      isSelected ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-400"
                    }`}
                  >
                    <span>{api.category?.name || "Identity"}</span>
                    <span className={isSelected ? "text-white font-bold" : "text-slate-900 font-bold"}>
                      ₹{api.defaultSellPrice.toFixed(2)} / hit
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Playground Console & Code Snippets */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApi && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono text-xs font-bold rounded border border-slate-200">
                      {selectedApi.httpMethod}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{selectedApi.name}</h2>
                  </div>
                  <code className="text-xs text-slate-600 font-mono block mt-1 font-semibold">
                    https://api.colladome.com{selectedApi.endpointPath}
                  </code>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium">Standard Selling Rate</div>
                  <div className="text-base font-extrabold text-slate-900">
                    ₹{selectedApi.defaultSellPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{selectedApi.description}</p>

              {/* In-Session Playground Runner */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-700" />
                    Request Parameters (JSON Payload)
                  </label>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    ✓ Authenticated Session Active
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
                ></textarea>

                {/* Optional Custom Key Input */}
                <div className="flex items-center gap-3">
                  <div className="w-full">
                    <input
                      type="password"
                      placeholder="Optional: Enter a specific API key (defaults to active session)"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleRunTest}
                    disabled={loading}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "fill-current"}`} />
                    <span>{loading ? "Running..." : "Run Request"}</span>
                  </button>
                </div>
              </div>

              {/* Test Response Viewer */}
              {testResult && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          testResult.status < 400
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        HTTP {testResult.status}
                      </span>
                      <span className="font-mono text-slate-500">Latency: {testResult.latency}ms</span>
                    </div>

                    <button
                      onClick={handleCopyResponse}
                      className="text-xs text-slate-600 hover:text-black flex items-center gap-1 font-medium"
                    >
                      {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedResponse ? "Copied" : "Copy Response"}</span>
                    </button>
                  </div>

                  <pre className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                    {JSON.stringify(testResult.result, null, 2)}
                  </pre>
                </div>
              )}

              {/* Multi-Language Backend Integration Snippets */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                    <FileCode className="w-4 h-4 text-slate-700" />
                    <span>Backend Integration Snippet</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(["curl", "node", "python", "go", "php"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveSnippetLang(lang)}
                        className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition ${
                          activeSnippetLang === lang
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {lang === "node" ? "Node.js" : lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <pre className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
                    {getCodeSnippet(activeSnippetLang)}
                  </pre>
                  <button
                    onClick={() => handleCopySnippet(getCodeSnippet(activeSnippetLang))}
                    className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-2.5 py-1 rounded-md opacity-90 transition flex items-center gap-1"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
