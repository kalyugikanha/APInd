"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Save,
  ShieldCheck,
  Send,
  Key,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Globe,
  Radio,
} from "lucide-react";

export default function ClientSecurityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [allowedIpsText, setAllowedIpsText] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Secret state
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);

  // Test webhook state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    httpStatus?: number;
    latencyMs?: number;
    deliveryId?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) {
          setProfile(data.client);
          setAllowedIpsText((data.client.settings?.allowedIps || []).join(", "));
          setWebhookUrl(data.client.settings?.webhookUrl || "");
          setWebhookSecret(data.client.settings?.webhookSecret || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCopySecret = () => {
    if (!webhookSecret) return;
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleGenerateSecret = async () => {
    setGeneratingSecret(true);
    try {
      const res = await fetch("/api/internal/client/webhooks/secret", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.secret) {
        setWebhookSecret(data.secret);
      } else {
        alert(data.error || "Failed to generate webhook secret");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGeneratingSecret(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      alert("Please enter a Webhook Callback URL first.");
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/internal/client/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret: webhookSecret,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        httpStatus: data.httpStatus,
        latencyMs: data.latencyMs,
        deliveryId: data.deliveryId,
        error: data.error,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to dispatch test webhook",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveSuccess(false);

    const allowedIps = allowedIpsText
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/internal/admin/clients/${profile.id}/security`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedIps,
          webhookUrl,
          webhookSecret,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IP Whitelists & Webhooks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lock down your gateway traffic to specific production IPs and configure signed event delivery
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Security settings and webhook configuration saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSaveSecurity} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {/* Section 1: IP Whitelist */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700" />
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Production Server IP Whitelist
            </label>
          </div>
          <textarea
            rows={3}
            value={allowedIpsText}
            onChange={(e) => setAllowedIpsText(e.target.value)}
            placeholder="e.g. 103.21.244.15, 103.21.244.16, 127.0.0.1 (leave blank to allow all IPs during development)"
            className="w-full text-xs font-mono border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
          ></textarea>
          <p className="text-[11px] text-slate-500">
            When configured, incoming requests with <code className="bg-slate-100 px-1 py-0.5 rounded">x-api-key</code> originating from unauthorized IPs will be denied with <code className="text-slate-800 font-mono">403 Forbidden</code>.
          </p>
        </div>

        {/* Section 2: Webhook Endpoint URL */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-700" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Webhook Callback Destination URL
              </label>
            </div>
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testingWebhook || !webhookUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 transition disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${testingWebhook ? "animate-pulse text-amber-500" : "text-slate-600"}`} />
              <span>{testingWebhook ? "Testing..." : "Send Test Ping"}</span>
            </button>
          </div>

          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://yourdomain.com/api/webhooks/colladome"
            className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
          />

          {/* Test Result Alert */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                testResult.success
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      testResult.success ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  ></span>
                  HTTP {testResult.httpStatus || "ERR"}: {testResult.success ? "Webhook Reachable" : "Delivery Failed"}
                </span>
                {testResult.latencyMs !== undefined && (
                  <span className="font-bold">{testResult.latencyMs}ms</span>
                )}
              </div>
              <p className="text-[11px] font-sans text-slate-600">
                {testResult.success
                  ? `Successfully received 200 OK from ${webhookUrl}. Delivery ID: ${testResult.deliveryId}`
                  : `Error: ${testResult.error}`}
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Webhook Signing Secret */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-700" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                HMAC-SHA256 Signing Secret
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerateSecret}
              disabled={generatingSecret}
              className="text-xs font-semibold text-slate-700 hover:text-black hover:underline"
            >
              {generatingSecret ? "Generating..." : webhookSecret ? "Rotate Secret" : "+ Generate Secret"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookSecret || "No secret generated yet"}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 select-all"
            />
            {webhookSecret && (
              <button
                type="button"
                onClick={handleCopySecret}
                className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3 py-2.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors"
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSecret ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Use this secret to verify the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">x-colladome-signature</code> header on incoming webhooks to ensure requests originate from Colladome.
          </p>
        </div>

        {/* Section 4: Signature Verification Snippet */}
        <div className="bg-slate-900 rounded-xl p-4 text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wide">
            <Terminal className="w-4 h-4 text-emerald-400" />
            HOW TO VERIFY WEBHOOK SIGNATURE (NODE.JS)
          </div>
          <div className="bg-black/40 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
            <code>
              const crypto = require('crypto');<br />
              <br />
              function verifyColladomeWebhook(rawBody, signatureHeader, secret) &#123;<br />
              &nbsp;&nbsp;const [tPart, v1Part] = signatureHeader.split(',');<br />
              &nbsp;&nbsp;const timestamp = tPart.split('=')[1];<br />
              &nbsp;&nbsp;const expectedHash = crypto.createHmac('sha256', secret)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;.update(`$&#123;timestamp&#125;.$&#123;rawBody&#125;`).digest('hex');<br />
              &nbsp;&nbsp;return v1Part.split('=')[1] === expectedHash;<br />
              &#125;
            </code>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Security Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
