"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Globe,
  Key,
  Save,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Radio,
  Send,
  AlertCircle,
} from "lucide-react";

export default function ClientSecurityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [allowedIpsText, setAllowedIpsText] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test webhook state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    httpStatus?: number;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) {
          setProfile(data.client);
          const ips = data.client.settings?.allowedIps || ["*"];
          setAllowedIpsText(ips.join(", "));
          setWebhookUrl(data.client.settings?.webhookUrl || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveSuccess(false);

    const ips = allowedIpsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/internal/admin/clients/${profile.id}/security`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedIps: ips.length > 0 ? ips : ["*"],
          webhookUrl: webhookUrl.trim() || null,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update security settings");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert("Please enter a Webhook URL first.");
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/internal/client/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        httpStatus: data.httpStatus,
        latencyMs: data.latencyMs,
        error: data.error,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to ping webhook",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const prodKey = profile?.apiKeys?.find((k: any) => k.type === "PRODUCTION" && k.isActive);
  const sandboxKey = profile?.apiKeys?.find((k: any) => k.type === "SANDBOX" && k.isActive);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Credentials</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your server IP whitelisting, view your active API credentials, and configure event webhooks
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Security settings updated successfully! Gateway will enforce updated rules immediately.</span>
        </div>
      )}

      {/* Grid: Left IP Whitelist Form, Right API Key Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: IP Whitelisting Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSecurity} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Allowed Server IPs (Whitelist)</h3>
                  <p className="text-[11px] text-slate-500">
                    Only API requests originating from these IP addresses will be accepted by Colladome
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAllowedIpsText("*")}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
              >
                Allow All IPs (*)
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Authorized IP Addresses / CIDRs (comma-separated)
              </label>
              <textarea
                rows={3}
                value={allowedIpsText}
                onChange={(e) => setAllowedIpsText(e.target.value)}
                placeholder="e.g. 103.21.244.15, 142.250.190.46 or * for open testing"
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                Tip: Enter <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">*</code> to allow calls from any server during initial development.
              </p>
            </div>

            {/* Optional Webhook Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800">Event Webhook URL (Optional)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Receive instant real-time callback notifications when wallet recharges or verification jobs complete.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://yourdomain.com/api/webhooks/colladome"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  disabled={testingWebhook || !webhookUrl}
                  onClick={handleTestWebhook}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50 transition"
                >
                  {testingWebhook ? "Sending..." : "Ping Test"}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {testResult.success ? (
                    <div>✓ Webhook received successfully (HTTP {testResult.httpStatus}, {testResult.latencyMs}ms)</div>
                  ) : (
                    <div>✕ Webhook failed: {testResult.error}</div>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving Changes..." : "Save Security Settings"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: API Keys Summary (1 Col) */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Your API Keys</h3>
              </div>
              <Link
                href="/dashboard/keys"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Each organization account receives dedicated Sandbox and Production keys. Pass your key in the{" "}
              <code className="text-slate-900 font-bold bg-slate-100 px-1 py-0.5 rounded font-mono">x-api-key</code> request header.
            </p>

            {/* Production Key Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">Production Key</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Live
                </span>
              </div>
              <div className="font-mono text-xs text-slate-800 font-bold truncate">
                {prodKey ? `${prodKey.keyPrefix}${prodKey.keyHint}` : "No Production Key Generated"}
              </div>
            </div>

            {/* Sandbox Key Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-900">Sandbox Test Key</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                  Test
                </span>
              </div>
              <div className="font-mono text-xs text-slate-800 font-bold truncate">
                {sandboxKey ? `${sandboxKey.keyPrefix}${sandboxKey.keyHint}` : "No Sandbox Key Generated"}
              </div>
            </div>

            <Link
              href="/dashboard/keys"
              className="block w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-center text-xs font-bold transition"
            >
              Generate or View Keys
            </Link>
          </div>

          {/* Quick Best Practice Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Integration Security Tip</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Never expose your Production API Key in client-side code (browsers or mobile APKs). Always call Colladome from your backend server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
