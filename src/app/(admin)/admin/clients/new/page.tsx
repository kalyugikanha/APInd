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
} from "lucide-react";

export default function AdminNewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

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
    initialBalance: 5000,
    allowedIpsText: "127.0.0.1, 103.21.244.15",
    lowBalanceAlert: 500,
  });

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
          allowedIps,
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
              Provision enterprise credentials, initial wallet credit, and security whitelists
            </p>
          </div>
        </div>
      </div>

      {successData ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-6">
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

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-left max-w-lg mx-auto space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-500">Official Email:</span>
              <div className="text-slate-900 font-semibold">{successData.email}</div>
            </div>
            <div>
              <span className="text-slate-500">Live Production API Key:</span>
              <div className="text-blue-600 font-bold break-all bg-white p-2 rounded border border-slate-200">
                {successData.productionApiKey}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Sandbox Test API Key:</span>
              <div className="text-emerald-600 font-bold break-all bg-white p-2 rounded border border-slate-200">
                {successData.sandboxApiKey}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Opening Wallet Balance:</span>
              <div className="text-slate-900 font-bold">₹{successData.walletBalance.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href={`/admin/clients/${successData.id}`}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Open Client 360° Hub
            </Link>
            <button
              onClick={() => {
                setSuccessData(null);
                setForm({
                  ...form,
                  companyName: "",
                  brandName: "",
                  fullName: "",
                  email: "",
                  phone: "",
                  businessPan: "",
                  gstin: "",
                });
              }}
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Onboard Another Client
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Profile */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">1. Business Identity & Legal Entity</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Fintech Solutions Pvt Ltd"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Trade Name</label>
                <input
                  type="text"
                  placeholder="e.g. AcmePay"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Constitution *</label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="PVT_LTD">Private Limited Company</option>
                  <option value="PUBLIC_LTD">Public Limited Company</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="INDIVIDUAL">Individual / Developer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company PAN Card *</label>
                <input
                  type="text"
                  placeholder="e.g. AAACA1234K"
                  value={form.businessPan}
                  onChange={(e) => setForm({ ...form, businessPan: e.target.value })}
                  className="w-full text-xs font-mono uppercase border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACA1234K1Z5"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className="w-full text-xs font-mono uppercase border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  placeholder="Corporate Office Suite / Street"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City & State</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City (e.g. Mumbai)"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 400001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Authorized Representative */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">2. Authorized Representative & Account Login</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="fintech@acme.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 99887 76655"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Wallet */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-sm text-slate-900">3. Billing Model & Initial Wallet Balance</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Type *</label>
                <select
                  value={form.billingModel}
                  onChange={(e) => setForm({ ...form, billingModel: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="PREPAID">Prepaid Wallet (Deduct per hit)</option>
                  <option value="POSTPAID">Postpaid Credit Line (Monthly Invoicing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Wallet Credit (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-bold text-emerald-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Low Balance Alert (₹)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={form.lowBalanceAlert}
                  onChange={(e) => setForm({ ...form, lowBalanceAlert: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Security & IP Whitelist */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-sm text-slate-900">4. Gateway Security & Allowed Server IPs</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Production Server IPs (Comma Separated)
              </label>
              <textarea
                rows={2}
                placeholder="103.21.244.15, 103.21.244.16, 127.0.0.1"
                value={form.allowedIpsText}
                onChange={(e) => setForm({ ...form, allowedIpsText: e.target.value })}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
              ></textarea>
              <p className="text-[11px] text-slate-500 mt-1">
                Colladome Gateway blocks requests with 403 Forbidden if not originating from these IPs. Leave blank or use * to disable IP restriction.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/admin/clients"
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Onboarding Client..." : "Complete Client Onboarding"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
