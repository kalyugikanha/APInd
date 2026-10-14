"use client";

import React, { useState, useEffect } from "react";
import { Lock, Save, ShieldCheck } from "lucide-react";

export default function ClientSecurityPage() {
  const [profile, setProfile] = useState<any>(null);
  const [allowedIpsText, setAllowedIpsText] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) {
          setProfile(data.client);
          setAllowedIpsText((data.client.settings.allowedIps || []).join(", "));
          setWebhookUrl(data.client.settings.webhookUrl || "");
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

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
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Security IP Whitelist and Webhook settings updated!");
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
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IP Whitelist & Webhooks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lock down your production API calls to specific server IP addresses and configure async webhooks
        </p>
      </div>

      <form onSubmit={handleSaveSecurity} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Production Server IPs (Allowed Whitelist)
          </label>
          <textarea
            rows={3}
            value={allowedIpsText}
            onChange={(e) => setAllowedIpsText(e.target.value)}
            placeholder="e.g. 103.21.244.15, 103.21.244.16, 127.0.0.1"
            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-blue-500"
          ></textarea>
          <p className="text-[11px] text-slate-500 mt-1">
            API Gateway validates incoming client IP. Requests originating from any other IP receive 403 Forbidden.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Webhook Callback Destination URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://acmepay.in/api/v1/webhooks/colladome"
            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Async verification callbacks and status updates will be dispatched to this URL with HMAC signature.
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Security Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
