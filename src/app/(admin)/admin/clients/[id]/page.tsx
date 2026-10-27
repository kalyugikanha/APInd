"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  CreditCard,
  Lock,
  Key,
  Activity,
  FileCheck2,
  Building,
  DollarSign,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Clock,
  Ban,
  Save,
  Wallet,
  Minus,
} from "lucide-react";
import WalletAdjustmentModal from "@/components/admin/WalletAdjustmentModal";

export default function Client360HubPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "pricing" | "wallet" | "keys" | "analytics" | "reports"
  >("profile");

  // Wallet Modal
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletForm, setWalletForm] = useState({
    amount: "",
    type: "CREDIT",
    description: "Manual wallet adjustment by Super Admin",
    referenceId: "",
  });

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    allowedIpsText: "",
    sandboxIpsText: "",
    webhookUrl: "",
    rateLimitRpm: 120,
    lowBalanceAlert: 500,
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    accountStatus: "ACTIVE",
    kycStatus: "VERIFIED",
    billingModel: "PREPAID",
    creditLimit: 0,
    internalNotes: "",
  });

  // Keys Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyType, setKeyType] = useState<"PRODUCTION" | "SANDBOX">("PRODUCTION");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchClientDetails = () => {
    setLoading(true);
    fetch(`/api/internal/admin/clients/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.client) {
          setClient(data.client);
          setSecurityForm({
            allowedIpsText: (data.client.settings.allowedIps || []).join(", "),
            sandboxIpsText: (data.client.settings.sandboxIps || []).join(", "),
            webhookUrl: data.client.settings.webhookUrl || "",
            rateLimitRpm: data.client.settings.rateLimitRpm || 120,
            lowBalanceAlert: data.client.settings.lowBalanceAlert || 500,
          });
          setProfileForm({
            accountStatus: data.client.accountStatus,
            kycStatus: data.client.kycStatus,
            billingModel: data.client.billingModel,
            creditLimit: data.client.creditLimit,
            internalNotes: data.client.internalNotes || "",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  // Wallet Adjustment Handler
  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/internal/admin/clients/${clientId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walletForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowWalletModal(false);
        fetchClientDetails();
      } else {
        alert(data.error || "Wallet adjustment failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Security Save Handler
  const handleSecuritySave = async () => {
    const allowedIps = securityForm.allowedIpsText
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    const sandboxIps = securityForm.sandboxIpsText
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/internal/admin/clients/${clientId}/security`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedIps,
          sandboxIps,
          webhookUrl: securityForm.webhookUrl,
          rateLimitRpm: Number(securityForm.rateLimitRpm),
          lowBalanceAlert: Number(securityForm.lowBalanceAlert),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Security and IP Whitelist updated successfully!");
        fetchClientDetails();
      } else {
        alert(data.error || "Failed to update security settings");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Pricing Rule Save Handler
  const handlePricingSave = async (
    apiId: string,
    customPrice: number,
    isEnabled: boolean = true,
    customSetupFee?: number | null,
    isSetupFeePaid?: boolean
  ) => {
    try {
      const res = await fetch(`/api/internal/admin/clients/${clientId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId,
          customPrice,
          isEnabled,
          customSetupFee,
          isSetupFeePaid,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Pricing and setup fee updated successfully!");
        fetchClientDetails();
      } else {
        alert(data.error || "Failed to update pricing");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Generate Key Handler
  const handleGenerateKey = async () => {
    try {
      const res = await fetch(`/api/internal/admin/clients/${clientId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: keyType, name: `${client.companyName} Key` }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedKey(data.rawKey);
        fetchClientDetails();
      } else {
        alert(data.error || "Failed to create key");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Profile Save Handler
  const handleProfileSave = async () => {
    try {
      const res = await fetch(`/api/internal/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Client profile & governance settings updated!");
        fetchClientDetails();
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading || !client) {
    return <div className="p-8 text-center text-slate-500">Loading Client 360° Data...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Top Client Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/clients"
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{client.companyName}</h1>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {client.clientCode}
                </span>
                {client.accountStatus === "ACTIVE" ? (
                  <span className="text-emerald-700 bg-emerald-50 text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-rose-700 bg-rose-50 text-[11px] font-semibold px-2 py-0.5 rounded border border-rose-200">
                    {client.accountStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {client.brandName ? `Brand: ${client.brandName} • ` : ""}
                Primary Contact: {client.fullName} ({client.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Live Wallet Balance</div>
              <div className="text-xl font-extrabold text-emerald-600">₹{client.wallet.balance.toFixed(2)}</div>
            </div>
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Credit / Debit</span>
            </button>
          </div>
        </div>

        {/* 7 Specialized Management Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-3 border-t border-slate-100 overflow-x-auto text-xs font-medium">
          {[
            { id: "profile", label: "1. Profile & KYC", icon: Building2 },
            { id: "security", label: "2. Security & IP Whitelist", icon: Lock },
            { id: "pricing", label: "3. Custom Pricing Matrix", icon: DollarSign },
            { id: "wallet", label: "4. Wallet & Passbook", icon: CreditCard },
            { id: "keys", label: "5. API Credentials", icon: Key },
            { id: "analytics", label: "6. Usage Analytics", icon: Activity },
            { id: "reports", label: "7. Filtered Reports", icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Profile & KYC */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Company Legal Details & KYC Status</h2>
            <button
              onClick={handleProfileSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Account Status</span>
                <select
                  value={profileForm.accountStatus}
                  onChange={(e) => setProfileForm({ ...profileForm, accountStatus: e.target.value })}
                  className="w-full mt-1 text-xs border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Can make API calls)</option>
                  <option value="SUSPENDED">SUSPENDED (Block all gateway traffic)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Pending approval)</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">KYC Verification Status</span>
                <select
                  value={profileForm.kycStatus}
                  onChange={(e) => setProfileForm({ ...profileForm, kycStatus: e.target.value })}
                  className="w-full mt-1 text-xs border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Billing Model</span>
                <select
                  value={profileForm.billingModel}
                  onChange={(e) => setProfileForm({ ...profileForm, billingModel: e.target.value })}
                  className="w-full mt-1 text-xs border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                >
                  <option value="PREPAID">PREPAID (Deduct from wallet balance)</option>
                  <option value="POSTPAID">POSTPAID (Credit line with monthly bill)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">Business PAN:</span>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {client.businessPan || "NOT PROVIDED"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">GSTIN:</span>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {client.gstin || "NOT PROVIDED"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Business Constitution:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{client.businessType || "PVT_LTD"}</div>
                </div>
                <div>
                  <span className="text-slate-400">Registered City / State:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {client.city}, {client.state} ({client.pincode})
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Super Admin Internal Notes</label>
                <textarea
                  rows={3}
                  value={profileForm.internalNotes}
                  onChange={(e) => setProfileForm({ ...profileForm, internalNotes: e.target.value })}
                  placeholder="Add internal notes about client contract, credit limits, or custom arrangements..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & IP Whitelisting */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Gateway Security & IP Whitelists</h2>
              <p className="text-xs text-slate-500">
                Incoming API hits are authenticated against these server IP addresses
              </p>
            </div>
            <button
              onClick={handleSecuritySave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Whitelists</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Production Server IPs (Allowed Whitelist)
              </label>
              <textarea
                rows={3}
                value={securityForm.allowedIpsText}
                onChange={(e) => setSecurityForm({ ...securityForm, allowedIpsText: e.target.value })}
                placeholder="103.21.244.15, 103.21.244.16, 127.0.0.1"
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
              ></textarea>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter comma-separated IPv4, IPv6, or CIDR blocks. Requests from other IPs are blocked with 403 Forbidden.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook URL (For Async Callbacks)
                </label>
                <input
                  type="url"
                  placeholder="https://acmepay.in/api/v1/webhooks/colladome"
                  value={securityForm.webhookUrl}
                  onChange={(e) => setSecurityForm({ ...securityForm, webhookUrl: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Limit (Requests / Min)</label>
                <input
                  type="number"
                  value={securityForm.rateLimitRpm}
                  onChange={(e) => setSecurityForm({ ...securityForm, rateLimitRpm: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom API Pricing Matrix */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Per-Client Custom Pricing & Surcharge Matrix</h2>
            <p className="text-xs text-slate-500">
              Set negotiated custom rates per API for this client. Custom rates override standard retail prices.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">API Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Endpoint Path</th>
                  <th className="p-3">Standard Retail</th>
                  <th className="p-3">Client Custom Price</th>
                  <th className="p-3">One-Time Setup Fee</th>
                  <th className="p-3">Setup Fee Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.pricingMatrix.map((item: any) => (
                  <tr key={item.apiId} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-900">{item.apiName}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 font-mono text-blue-600">{item.endpointPath}</td>
                    <td className="p-3 font-mono text-slate-700">₹{item.defaultSellPrice.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          step="0.05"
                          defaultValue={item.customPrice}
                          id={`price_${item.apiId}`}
                          className="w-20 border border-slate-300 rounded px-2 py-1 font-bold text-emerald-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          step="1"
                          placeholder={item.defaultSetupFee > 0 ? String(item.defaultSetupFee) : "0"}
                          defaultValue={item.customSetupFee !== null && item.customSetupFee !== undefined ? item.customSetupFee : ""}
                          id={`setup_${item.apiId}`}
                          title={`Default API setup fee: ₹${item.defaultSetupFee}. Leave empty to use default.`}
                          className="w-20 border border-slate-300 rounded px-2 py-1 font-bold text-amber-700 bg-amber-50/40 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.isSetupFeePaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid / Waived</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending (₹{item.effectiveSetupFee})</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const priceVal = (document.getElementById(`price_${item.apiId}`) as HTMLInputElement)?.value;
                            const setupVal = (document.getElementById(`setup_${item.apiId}`) as HTMLInputElement)?.value;
                            handlePricingSave(
                              item.apiId,
                              Number(priceVal),
                              true,
                              setupVal !== "" ? Number(setupVal) : null,
                              !item.isSetupFeePaid
                            );
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold transition border ${
                            item.isSetupFeePaid
                              ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          }`}
                        >
                          {item.isSetupFeePaid ? "Mark Pending" : "Waive / Mark Paid"}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const priceVal = (document.getElementById(`price_${item.apiId}`) as HTMLInputElement)?.value;
                          const setupVal = (document.getElementById(`setup_${item.apiId}`) as HTMLInputElement)?.value;
                          handlePricingSave(
                            item.apiId,
                            Number(priceVal),
                            true,
                            setupVal !== "" ? Number(setupVal) : null,
                            item.isSetupFeePaid
                          );
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded font-semibold text-xs transition"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Wallet & Passbook */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Current Balance</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                ₹{client.wallet.balance.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Lifetime Recharged</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ₹{client.wallet.lifetimeRecharge.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Lifetime API Spent</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ₹{client.wallet.lifetimeSpent.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Wallet Passbook & Transaction Ledger</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Adjust Wallet (Credit / Debit)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference / Order ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Balance Before</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {client.wallet.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-medium text-blue-600">{tx.referenceId || "N/A"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            tx.type === "CREDIT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`p-3 font-bold ${
                          tx.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "CREDIT" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono">₹{tx.balanceBefore.toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{tx.balanceAfter.toFixed(2)}</td>
                      <td className="p-3 text-slate-700">{tx.description}</td>
                      <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: API Credentials */}
      {activeTab === "keys" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">API Credentials & Keys</h2>
              <p className="text-xs text-slate-500">Live production keys and sandbox keys assigned to this client</p>
            </div>

            <button
              onClick={() => {
                setShowKeyModal(true);
                setGeneratedKey(null);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New Key</span>
            </button>
          </div>

          <div className="space-y-3">
            {client.apiKeys.map((key: any) => (
              <div
                key={key.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {key.keyPrefix}
                      {key.keyHint}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        key.type === "PRODUCTION"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {key.type}
                    </span>
                    {key.isActive ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        REVOKED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Label: {key.name} • Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Rate Limit: {key.rateLimitRpm} RPM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Usage Analytics */}
      {activeTab === "analytics" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            Client Hit Volume & Consumption
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs font-semibold text-blue-600 uppercase">Total API Hits</div>
              <div className="text-2xl font-extrabold text-blue-900 mt-1">{client.stats.totalHits}</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-600 uppercase">PAN Verifications</div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-1">{client.stats.totalPanHits}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
              <div className="text-xs font-semibold text-purple-600 uppercase">Bank Verifications</div>
              <div className="text-2xl font-extrabold text-purple-900 mt-1">{client.stats.totalBankHits}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Client Reports */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900">Client-Filtered Verification Reports</h2>
            <p className="text-xs text-slate-500">Recent PAN and Bank verification hits executed by {client.companyName}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase">PAN Card Verification Logs</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-slate-700">
                  <tr>
                    <th className="p-2.5">PAN Number</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Aadhaar Linked</th>
                    <th className="p-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {client.recentPanReports.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{r.panNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{r.fullName}</td>
                      <td className="p-2.5">{r.category}</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5">{r.panAadhaarLinked ? "YES" : "NO"}</td>
                      <td className="p-2.5 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Credit / Debit Adjustment Modal */}
      <WalletAdjustmentModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => {
          fetchClientDetails();
        }}
        initialClient={
          client
            ? {
                id: client.id,
                clientCode: client.clientCode || "CD-0000",
                companyName: client.companyName || "Unnamed Client",
                email: client.email,
                phone: client.phone,
                walletBalance: client.wallet?.balance || 0,
                billingModel: client.billingModel,
                accountStatus: client.accountStatus,
              }
            : null
        }
      />

      {/* New Key Generator Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900">Provision API Key</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create a new key for <strong>{client.companyName}</strong>.
            </p>

            {!generatedKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Environment</label>
                  <select
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-white"
                  >
                    <option value="PRODUCTION">PRODUCTION (cd_live_...)</option>
                    <option value="SANDBOX">SANDBOX (cd_test_...)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateKey}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                >
                  Generate Key
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-semibold mb-1">
                    Copy the new API key now! It will not be revealed again:
                  </div>
                  <code className="text-xs font-mono font-bold text-emerald-900 break-all select-all">
                    {generatedKey}
                  </code>
                </div>

                <button
                  onClick={() => setShowKeyModal(false)}
                  className="w-full py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
