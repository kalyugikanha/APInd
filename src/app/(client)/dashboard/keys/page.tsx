"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  ShieldAlert, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Eye, 
  EyeOff, 
  X,
  Zap,
  Lock
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  keyHint: string;
  type: "PRODUCTION" | "SANDBOX";
  rateLimitRpm: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

export default function ClientKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"PRODUCTION" | "SANDBOX">("SANDBOX");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Secret Revealed Modal state
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedKeyName, setRevealedKeyName] = useState("");
  const [revealedKeyType, setRevealedKeyType] = useState<"PRODUCTION" | "SANDBOX">("SANDBOX");

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/internal/client/keys");
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch("/api/internal/client/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim() || undefined,
          type: newKeyType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate API key");
      }

      // Close create modal and open secret reveal modal
      setShowGenerateModal(false);
      setRevealedKey(data.rawApiKey);
      setRevealedKeyName(data.key.name);
      setRevealedKeyType(data.key.type);
      setNewKeyName("");
      setNewKeyType("SANDBOX");

      // Refresh list
      fetchKeys();
    } catch (err: any) {
      setGenerateError(err.message || "An unexpected error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke API key "${name}"? This action cannot be undone and any application using this key will immediately receive 401 Unauthorized.`)) {
      return;
    }

    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/internal/client/keys?keyId=${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke key");
      fetchKeys();
    } catch (err: any) {
      alert(`Error revoking key: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Credentials & Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate your backend applications at <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">api.colladome.com/v1</code>
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {/* Security Best Practice Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-950">Security Rule: Keep your API keys confidential</span>
          <p className="text-amber-800">
            Never expose Production keys in public GitHub repositories or client-side web apps. All requests should be routed through your backend server using the <code className="font-mono bg-amber-100/60 px-1 py-0.5 rounded">x-api-key</code> HTTP header.
          </p>
        </div>
      </div>

      {/* Keys List Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-sm text-slate-900">Your API Keys</h2>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {keys.length} total
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No API Keys Generated</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You haven't generated any API keys yet. Create a Sandbox or Production key to start testing the verification gateway.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate First Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{k.name}</span>
                    <span
                      className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded ${
                        k.type === "PRODUCTION"
                          ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {k.type}
                    </span>
                    {k.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        REVOKED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60">
                      {k.keyPrefix}••••••••••••••••{k.keyHint}
                    </span>
                    <span>•</span>
                    <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Limit: {k.rateLimitRpm} RPM</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {k.isActive ? (
                    <button
                      onClick={() => handleRevokeKey(k.id, k.name)}
                      disabled={revokingId === k.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-3 py-1.5 rounded-lg transition-all"
                      title="Revoke this key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {revokingId === k.id ? "Revoking..." : "Revoke"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No longer valid</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Integration Example */}
      <div className="bg-slate-900 rounded-xl p-5 text-slate-300 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wide">
          <Terminal className="w-4 h-4 text-emerald-400" />
          GATEWAY INTEGRATION EXAMPLE
        </div>
        <div className="bg-black/40 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
          <code>
            curl -X POST https://api.colladome.com/v1/verification/pan \<br />
            &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
            &nbsp;&nbsp;-H <span className="text-amber-400">"x-api-key: YOUR_API_KEY"</span> \<br />
            &nbsp;&nbsp;-d '{'{"pan": "ABCDE1234F"}'}'
          </code>
        </div>
        <p className="text-[11px] text-slate-400">
          Requests can also use the legacy <code className="text-slate-300">/api/v1/*</code> path. Both endpoints support standard HMAC-authenticated execution.
        </p>
      </div>

      {/* Generate API Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Generate New API Key</h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generateError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {generateError}
              </div>
            )}

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Label / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Backend, Staging Testing"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Environment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKeyType("SANDBOX")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newKeyType === "SANDBOX"
                        ? "border-amber-500 bg-amber-50/50 text-slate-900 ring-1 ring-amber-500"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Sandbox</span>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Prefix <code className="font-mono">cd_test_</code>. Safe for local testing & development.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyType("PRODUCTION")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newKeyType === "PRODUCTION"
                        ? "border-purple-500 bg-purple-50/50 text-slate-900 ring-1 ring-purple-500"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Production</span>
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Prefix <code className="font-mono">cd_live_</code>. Live billing & verified responses.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Key Revealed Modal (One-Time View) */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Key Created Successfully</h3>
                <p className="text-xs text-slate-500">
                  {revealedKeyName} ({revealedKeyType})
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">Save this key now!</span> For security reasons, we do not store the plain text API key. You will not be able to view it again once this window is closed.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Your Secret API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={revealedKey}
                  className="w-full font-mono text-xs bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 select-all"
                />
                <button
                  onClick={() => handleCopy(revealedKey, "revealed")}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === "revealed" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRevealedKey(null)}
                className="w-full bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                I have safely stored my key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
