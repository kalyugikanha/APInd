"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ArrowLeft,
  Building2,
  ShieldCheck,
  CreditCard,
  Lock,
  Mail,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  Zap,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function AdminNewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "wallet" | "business" | "security">("quick");
  const [successData, setSuccessData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    brandName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "Password@123",
    businessType: "PVT_LTD",
    businessPan: "",
    gstin: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    billingModel: "PREPAID",
    creditLimit: 0,
    initialBalance: 0,
    allowedIpsText: "*",
    lowBalanceAlert: 500,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allowedIps = form.allowedIpsText
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/internal/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          allowedIps: allowedIps.length > 0 ? allowedIps : ["*"],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessData(data.client);
      } else {
        alert(data.error || "Failed to onboard client");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://apind.onrender.com";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/clients"
            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register & Onboard New Client</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quickly provision enterprise credentials, initial wallet credit, and security whitelists
            </p>
          </div>
        </div>
      </div>

      {successData ? (
        /* Onboarding Success Screen with 1-Click Integration Pack */
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-6 animate-in fade-in-50">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Client Onboarded Successfully!</h2>
            <p className="text-sm text-slate-600 mt-1">
              Account created for <strong>{successData.companyName}</strong> (Client Code:{" "}
              <strong className="text-blue-600 font-mono">{successData.clientCode}</strong>).
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-left max-w-xl mx-auto space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Official Email:</span>
              <span className="text-slate-900 font-bold">{successData.email}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Live Production API Key:</span>
                <button
                  onClick={() => handleCopy(successData.productionApiKey, "prod")}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-sans text-[11px]"
                >
                  {copiedKey === "prod" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "prod" ? "Copied" : "Copy Key"}</span>
                </button>
              </div>
              <div className="text-blue-600 font-bold break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                {successData.productionApiKey}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Sandbox Test API Key:</span>
                <button
                  onClick={() => handleCopy(successData.sandboxApiKey, "test")}
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-sans text-[11px]"
                >
                  {copiedKey === "test" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "test" ? "Copied" : "Copy Key"}</span>
                </button>
              </div>
              <div className="text-emerald-600 font-bold break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                {successData.sandboxApiKey}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-500">Opening Wallet Balance:</span>
              <span className="text-slate-900 font-bold text-sm">₹{Number(successData.walletBalance || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => {
                const integrationPack = `🚀 Colladome API Access Credentials:
Client: ${successData.companyName} (${successData.clientCode})
Email: ${successData.email}
Production API Key: ${successData.productionApiKey}
Sandbox API Key: ${successData.sandboxApiKey}
Gateway Base URL: ${baseUrl}/api/v1
Documentation: ${baseUrl}/dashboard/apis
Header: x-api-key: ${successData.productionApiKey}`;
                handleCopy(integrationPack, "pack");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              {copiedKey === "pack" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === "pack" ? "Integration Pack Copied!" : "📋 Copy Client Integration Pack"}</span>
            </button>

            <Link
              href={`/admin/clients/${successData.id}`}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Open Client 360° Hub
            </Link>

            <button
              onClick={() => {
                setSuccessData(null);
                setForm({
                  companyName: "",
                  brandName: "",
                  fullName: "",
                  email: "",
                  phone: "",
                  password: "Password@123",
                  businessType: "PVT_LTD",
                  businessPan: "",
                  gstin: "",
                  address: "",
                  city: "",
                  state: "Maharashtra",
                  pincode: "",
                  billingModel: "PREPAID",
                  creditLimit: 0,
                  initialBalance: 0,
                  allowedIpsText: "*",
                  lowBalanceAlert: 500,
                });
                setActiveTab("quick");
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Onboard Another Client
            </button>
          </div>
        </div>
      ) : (
        /* Section-Wise Tabbed Onboarding Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "quick"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ Quick Onboard (Essentials)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "wallet"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>Commercial & Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "business"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Business Profile & KYC</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "security"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security & Whitelist</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Tab 1: ⚡ Quick Onboard Essentials */}
            {activeTab === "quick" && (
              <div className="space-y-5 animate-in fade-in-50">
                <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Fast Onboarding Mode:</strong> Only these 4 fields are required to immediately generate Production and Sandbox API keys for your client!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="e.g. Selfup Community"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. Akash"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Client Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. selfupcommunity@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Portal Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="e.g. Selfup@2026"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Trade Name</label>
                    <input
                      type="text"
                      value={form.brandName}
                      onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                      placeholder="Optional, defaults to company name"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                {/* Instant Action Bar on Step 1 */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Need custom balance or KYC? Click the tabs above, or onboard instantly:
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{loading ? "Provisioning Client..." : "⚡ Instant Onboard Client"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Commercial & Wallet */}
            {activeTab === "wallet" && (
              <div className="space-y-5 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Opening Wallet Balance (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.initialBalance}
                      onChange={(e) => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-bold"
                    />
                    <div className="flex gap-2 mt-2">
                      {[0, 500, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setForm({ ...form, initialBalance: amt })}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Billing Model</label>
                    <select
                      value={form.billingModel}
                      onChange={(e) => setForm({ ...form, billingModel: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                    >
                      <option value="PREPAID">Prepaid (Wallet deduction per hit)</option>
                      <option value="POSTPAID">Postpaid (Monthly consolidated billing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (₹, Postpaid only)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.creditLimit}
                      onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Low Balance Alert Threshold (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.lowBalanceAlert}
                      onChange={(e) => setForm({ ...form, lowBalanceAlert: parseFloat(e.target.value) || 500 })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("quick")}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    ← Back to Essentials
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("business")}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black"
                  >
                    Next: Business Profile →
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Business Profile & KYC */}
            {activeTab === "business" && (
              <div className="space-y-5 animate-in fade-in-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Constitution</label>
                    <select
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                    >
                      <option value="PVT_LTD">Private Limited (Pvt Ltd)</option>
                      <option value="PUBLIC_LTD">Public Limited</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                      <option value="INDIVIDUAL">Individual / Developer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company PAN Number</label>
                    <input
                      type="text"
                      value={form.businessPan}
                      onChange={(e) => setForm({ ...form, businessPan: e.target.value.toUpperCase() })}
                      placeholder="e.g. AAACP1234D"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 27AAACP1234D1Z5"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Address</label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. Suite 402, Trade Tower, Bandra Kurla Complex"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("wallet")}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    ← Back to Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("security")}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black"
                  >
                    Next: Security & Whitelist →
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Security & Whitelist */}
            {activeTab === "security" && (
              <div className="space-y-5 animate-in fade-in-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Allowed Server IPs (Whitelist)</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, allowedIpsText: "*" })}
                      className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded"
                    >
                      Allow All IPs (*)
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={form.allowedIpsText}
                    onChange={(e) => setForm({ ...form, allowedIpsText: e.target.value })}
                    placeholder="Enter comma-separated IPs or * for unrestricted"
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">
                    Default is <code className="font-bold text-slate-700">*</code> so the client can start testing API calls without initial IP blocks.
                  </p>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("business")}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    ← Back to Business
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {loading ? "Provisioning Client..." : "Complete & Onboard Client"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
