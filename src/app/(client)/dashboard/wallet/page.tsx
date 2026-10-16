"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  RefreshCw,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export default function ClientWalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Recharge Modal State
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(1000);
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [checkoutStep, setCheckoutStep] = useState<"SELECT" | "REVIEW" | "SUCCESS">("SELECT");
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [latestInvoiceId, setLatestInvoiceId] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/internal/client/wallet");
      const data = await res.json();
      if (res.ok) {
        setWalletData(data);
      }
    } catch (err) {
      console.error("Wallet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setProcessingPayment(true);

    try {
      const res = await fetch("/api/internal/client/wallet/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rechargeAmount,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment checkout");
      }

      setCheckoutData(data);
      setCheckoutStep("REVIEW");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during checkout");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutData) return;
    setProcessingPayment(true);
    setErrorMsg("");

    try {
      const verifyRes = await fetch("/api/internal/client/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          razorpayOrderId: checkoutData.razorpayOrderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          amount: checkoutData.amount,
          paymentMethod: selectedMethod,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      setLatestInvoiceId(verifyData.transactionId);
      setCheckoutStep("SUCCESS");
      fetchWallet();
    } catch (err: any) {
      setErrorMsg(err.message || "Payment verification failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetModal = () => {
    setShowRechargeModal(false);
    setCheckoutStep("SELECT");
    setCheckoutData(null);
    setErrorMsg("");
    setLatestInvoiceId(null);
  };

  const gstCalc = Number((rechargeAmount * 0.18).toFixed(2));
  const totalCalc = Number((rechargeAmount + gstCalc).toFixed(2));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallet & Prepaid Balance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time balance, automated top-up, double-entry passbook, and official GST tax invoices
          </p>
        </div>

        <button
          onClick={() => {
            resetModal();
            setShowRechargeModal(true);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Funds / Top-Up</span>
        </button>
      </div>

      {/* Balance Card & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Verification Balance
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight mt-2 text-white">
              ₹{(walletData?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Deducted atomically per successful identity verification at <code className="text-slate-300">api.colladome.com/v1/*</code>.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Guaranteed Double-Entry Ledger Protection</span>
            </div>
            <button
              onClick={() => {
                resetModal();
                setShowRechargeModal(true);
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              + Instant Top-Up
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Model</div>
            <div className="text-lg font-bold text-slate-900 mt-1">Prepaid Pay-As-You-Go</div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Currency</span>
                <span className="font-semibold text-slate-900">INR (₹)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>GST Rate</span>
                <span className="font-semibold text-slate-900">18.0%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>SAC Service Code</span>
                <span className="font-mono font-semibold text-slate-900">998313</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Official GST tax invoices with input tax credit eligibility are automatically generated on every recharge.
          </p>
        </div>
      </div>

      {/* Transaction Passbook Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-900">Passbook & Balance Ledger</h2>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {walletData?.transactions?.length ?? 0} entries
            </span>
          </div>
          <button
            onClick={fetchWallet}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="px-6 py-3">Reference / Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Balance Before</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-6 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Loading passbook entries...
                  </td>
                </tr>
              ) : !walletData?.transactions || walletData.transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No Transactions Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Your wallet activity and API debits will be recorded here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                walletData.transactions.map((tx: any) => {
                  const isCredit = tx.type === "CREDIT";
                  let meta: any = {};
                  try {
                    meta = tx.metadata ? JSON.parse(tx.metadata) : {};
                  } catch {
                    meta = {};
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-mono font-medium text-slate-900">
                        {tx.referenceId || tx.id.slice(0, 12)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCredit
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${isCredit ? "text-emerald-700 font-bold" : "text-slate-800"}`}>
                        {isCredit ? "+" : "-"}₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">₹{tx.balanceBefore.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{tx.balanceAfter.toFixed(2)}</td>
                      <td className="px-6 py-3 text-slate-700 max-w-xs truncate">{tx.description}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {isCredit ? (
                          <a
                            href={`/api/internal/client/wallet/invoices/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Invoice</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Self-Serve Wallet Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Recharge Verification Wallet</h3>
                  <p className="text-[11px] text-slate-500">Instant credit balance with 18% GST tax invoice</p>
                </div>
              </div>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Step 1: Select Amount and Payment Method */}
            {checkoutStep === "SELECT" && (
              <form onSubmit={handleStartCheckout} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Quick Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          rechargeAmount === amt
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Or Enter Custom Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(Number(e.target.value))}
                    className="w-full text-sm font-bold text-slate-900 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Minimum amount: ₹100.00</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Preferred Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("UPI")}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedMethod === "UPI"
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto mb-1 text-slate-800" />
                      <div className="text-xs font-bold">UPI / QR</div>
                      <div className="text-[10px] text-slate-400">Instant zero-fee</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod("CARD")}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedMethod === "CARD"
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-800" />
                      <div className="text-xs font-bold">Cards</div>
                      <div className="text-[10px] text-slate-400">Debit & Credit</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod("NETBANKING")}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedMethod === "NETBANKING"
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <Wallet className="w-4 h-4 mx-auto mb-1 text-slate-800" />
                      <div className="text-xs font-bold">Net Banking</div>
                      <div className="text-[10px] text-slate-400">All major banks</div>
                    </button>
                  </div>
                </div>

                {/* Tax summary breakdown */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-slate-200/70">
                  <div className="flex justify-between text-slate-600">
                    <span>Recharge Credit</span>
                    <span className="font-mono font-semibold">₹{rechargeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Input Credit Eligible)</span>
                    <span className="font-mono">₹{gstCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                    <span>Total Payable Amount</span>
                    <span className="font-mono text-sm">₹{totalCalc.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {processingPayment ? "Preparing Checkout..." : `Proceed to Pay ₹${totalCalc.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Review and Confirm Payment */}
            {checkoutStep === "REVIEW" && checkoutData && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono font-bold text-slate-800">{checkoutData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Wallet Credit:</span>
                    <span className="font-bold text-emerald-600">₹{checkoutData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Applicable GST (18%):</span>
                    <span className="font-mono">₹{checkoutData.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Total Payable:</span>
                    <span>₹{checkoutData.totalPayable.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Secured by 256-bit bank encryption. Funds reflect instantly upon confirmation.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("SELECT")}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={processingPayment}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {processingPayment ? "Verifying Transaction..." : `Confirm Payment (₹${checkoutData.totalPayable.toFixed(2)})`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {checkoutStep === "SUCCESS" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Payment Successful!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    ₹{rechargeAmount.toFixed(2)} has been credited to your verification balance.
                  </p>
                </div>

                {latestInvoiceId && (
                  <div className="pt-2">
                    <a
                      href={`/api/internal/client/wallet/invoices/${latestInvoiceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>View & Download GST Tax Invoice</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={resetModal}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg transition-all"
                  >
                    Back to Wallet Passbook
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
