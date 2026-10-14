"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ClientKeysPage() {
  const [profile, setProfile] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchProfile = () => {
    fetch("/api/internal/client/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.client) setProfile(data.client);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Credentials & Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your Production and Sandbox API keys for authentication at api.colladome.com
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Security Best Practice:</span> Never expose your Production API keys in frontend code or public repositories. Store them in backend environment variables.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">Active API Keys</h2>

        <div className="space-y-4">
          {profile?.apiKeys?.map((k: any) => (
            <div
              key={k.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {k.keyPrefix}
                    {k.keyHint}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      k.type === "PRODUCTION"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {k.type}
                  </span>
                  {k.isActive && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Label: {k.name} • Created: {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">Rate Limit: {k.rateLimitRpm} RPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
