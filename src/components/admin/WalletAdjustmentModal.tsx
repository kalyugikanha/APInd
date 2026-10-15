"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Wallet,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  User,
  ShieldAlert,
} from "lucide-react";

export interface ClientWalletSummary {
  id: string;
  clientCode: string;
  companyName: string;
  email: string;
  phone?: string;
  walletBalance: number;
  billingModel?: string;
  accountStatus?: string;
}

interface WalletAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialClient?: ClientWalletSummary | null;
}

export default function WalletAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialClient,
}: WalletAdjustmentModalProps) {
  const [allClients, setAllClients] = useState<ClientWalletSummary[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Search & Selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWalletSummary | null>(null);

  // Form state
  const [actionType, setActionType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load clients on modal open
  useEffect(() => {
    if (isOpen) {
      setLoadingClients(true);
      fetch("/api/internal/admin/clients")
        .then((res) => res.json())
        .then((data) => {
          const list = (data.clients || []).map((c: any) => ({
            id: c.id,
            clientCode: c.clientCode || "CD-0000",
            companyName: c.companyName || "Unnamed Company",
            email: c.email,
            phone: c.phone,
            walletBalance: typeof c.walletBalance === "number" ? c.walletBalance : (c.wallet?.balance || 0),
            billingModel: c.billingModel || "PREPAID",
            accountStatus: c.accountStatus || "ACTIVE",
          }));
          setAllClients(list);
          setLoadingClients(false);

          if (initialClient) {
            const found = list.find((c: any) => c.id === initialClient.id) || initialClient;
            setSelectedClient(found);
            setSearchQuery(found.clientCode || found.companyName);
          }
        })
        .catch((err) => {
          console.error("Failed to load clients:", err);
          setLoadingClients(false);
        });
    } else {
      // Reset state
      setSelectedClient(null);
      setSearchQuery("");
      setAmount("");
      setDescription("");
      setReferenceId("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  // Filter clients for dropdown autocomplete
  const filteredClients = searchQuery.trim()
    ? allClients.filter(
        (c) =>
          c.clientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectClient = (client: ClientWalletSummary) => {
    setSelectedClient(client);
    setSearchQuery(`${client.clientCode} — ${client.companyName}`);
    setErrorMsg(null);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = selectedClient?.walletBalance || 0;
  const isOverdraft = actionType === "DEBIT" && parsedAmount > currentBalance;

  const projectedBalance =
    actionType === "CREDIT"
      ? currentBalance + parsedAmount
      : Math.max(0, currentBalance - parsedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setErrorMsg("Please search and select a client first.");
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than ₹0.");
      return;
    }
    if (isOverdraft) {
      setErrorMsg(`Cannot debit ₹${parsedAmount.toFixed(2)}. Available balance is only ₹${currentBalance.toFixed(2)}.`);
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please provide a reason or description for this financial transaction.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/internal/admin/clients/${selectedClient.id}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          type: actionType,
          description: description.trim(),
          referenceId: referenceId.trim() || `MANUAL_ADJ_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust wallet balance");
      }

      // Success
      setSuccessMsg(
        `Successfully ${actionType === "CREDIT" ? "added" : "deducted"} ₹${parsedAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}! New balance: ₹${(data.newBalance || projectedBalance).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`
      );

      // Update local client balance
      setSelectedClient({
        ...selectedClient,
        walletBalance: data.newBalance || projectedBalance,
      });

      // Update in allClients
      setAllClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? { ...c, walletBalance: data.newBalance || projectedBalance }
            : c
        )
      );

      setAmount("");
      setDescription("");
      setReferenceId("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Client Wallet Adjustment Manager
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Add or deduct funds with real-time balance lookup and audit trails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Banners */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Step 1: Client Search & Lookup */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Search Client (By Code, Name, or Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedClient && !e.target.value.includes(selectedClient.clientCode)) {
                    setSelectedClient(null);
                  }
                }}
                placeholder="Type 'CD-1001', company name, or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              />
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {!selectedClient && searchQuery.trim() && (
              <div className="mt-1 border border-slate-200 rounded-xl bg-white shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 z-10">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-blue-600">
                            {client.clientCode}
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {client.companyName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{client.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">
                          ₹{client.walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">Current Balance</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching clients found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Selected Client Live Balance Card */}
          {selectedClient ? (
            <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-inner relative overflow-hidden space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                    {selectedClient.clientCode}
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1">
                    {selectedClient.companyName}
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedClient.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Live Balance
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                    ₹{selectedClient.walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Status Pills */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Billing Model: <strong className="text-slate-200">{selectedClient.billingModel}</strong></span>
                <span>Account Status: <strong className="text-emerald-400">{selectedClient.accountStatus}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50/50">
              <Wallet className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">No Client Selected Yet</div>
              <div className="text-[11px] text-slate-400">
                Search by Client Code (e.g. CD-1001) or company name above to view their live balance.
              </div>
            </div>
          )}

          {/* Step 3: Transaction Action (Credit / Debit) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                2. Choose Transaction Action
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType("CREDIT")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    actionType === "CREDIT"
                      ? "bg-white text-emerald-700 shadow-sm border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Funds (Credit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("DEBIT")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    actionType === "DEBIT"
                      ? "bg-white text-rose-700 shadow-sm border border-rose-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 text-rose-600" />
                  <span>Deduct Funds (Debit)</span>
                </button>
              </div>
            </div>

            {/* Amount Input & Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  3. Enter Amount (₹)
                </label>
                {selectedClient && (
                  <span className="text-[11px] text-slate-500">
                    {actionType === "CREDIT" ? "Credit to balance" : "Debit from balance"}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-400 text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white transition ${
                    isOverdraft
                      ? "border-rose-400 focus:border-rose-600 text-rose-600"
                      : "border-slate-300 focus:border-slate-900"
                  }`}
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Presets:</span>
                {[500, 1000, 2500, 5000, 10000, 25000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition"
                  >
                    +₹{preset.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              {/* Overdraft Warning Banner */}
              {isOverdraft && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>Debit Exceeds Balance:</strong> Cannot deduct ₹{parsedAmount.toFixed(2)}. The client only has ₹{currentBalance.toFixed(2)} available.
                  </span>
                </div>
              )}
            </div>

            {/* Live Projected Balance Calculation Box */}
            {selectedClient && parsedAmount > 0 && !isOverdraft && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Current</span>
                  <div className="font-bold text-slate-700">₹{currentBalance.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  {actionType === "CREDIT" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="font-mono text-xs font-semibold">
                    {actionType === "CREDIT" ? "+" : "-"} ₹{parsedAmount.toFixed(2)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Projected Balance</span>
                  <div className={`font-extrabold text-sm ${actionType === "CREDIT" ? "text-emerald-600" : "text-slate-900"}`}>
                    ₹{projectedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {/* Description & Reference Note */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bank NEFT topup, Promotional credit, Monthly billing adjustment..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reference ID / Bank UTR / Invoice No. <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. UTR202610159821, INV-88219"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedClient || parsedAmount <= 0 || isOverdraft}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 shadow-sm ${
                  submitting || !selectedClient || parsedAmount <= 0 || isOverdraft
                    ? "bg-slate-300 cursor-not-allowed"
                    : actionType === "CREDIT"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-950 hover:bg-slate-800"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {actionType === "CREDIT" ? (
                      <Plus className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Confirm {actionType === "CREDIT" ? "Credit" : "Debit"} (₹{parsedAmount.toFixed(2)})
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
