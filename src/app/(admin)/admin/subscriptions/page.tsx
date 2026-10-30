"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Search,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertTriangle,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; title: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; apiName: string; clientName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchSubscriptions = () => {
    setLoading(true);
    fetch("/api/internal/admin/subscriptions")
      .then((res) => res.json())
      .then((data) => {
        setSubscriptions(data.subscriptions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading subscriptions:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleApprove = async (sub: any) => {
    if (!confirm(`Approve subscription for '${sub.api.name}' from ${sub.user.companyName || sub.user.fullName}? This will mark setup fee as paid and activate the API for this client.`)) {
      return;
    }

    setActionLoadingId(sub.id);
    try {
      const res = await fetch("/api/internal/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: sub.id,
          action: "APPROVE",
          adminRemarks: "Payment verified by Admin",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Subscription approved!");
        fetchSubscriptions();
      } else {
        alert(data.error || "Failed to approve subscription");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;

    setActionLoadingId(rejectModal.id);
    try {
      const res = await fetch("/api/internal/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: rejectModal.id,
          action: "REJECT",
          adminRemarks: rejectReason.trim() || "Payment verification failed or UTR not matched.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Subscription rejected.");
        setRejectModal(null);
        setRejectReason("");
        fetchSubscriptions();
      } else {
        alert(data.error || "Failed to reject subscription");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const totalCount = subscriptions.length;
  const pendingCount = subscriptions.filter((s) => s.status === "PENDING").length;
  const approvedCount = subscriptions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = subscriptions.filter((s) => s.status === "REJECTED").length;
  const totalRevenue = subscriptions
    .filter((s) => s.status === "APPROVED")
    .reduce((sum, s) => sum + (s.totalAmount || 6490), 0);

  // Filtered List
  const filtered = subscriptions.filter((s) => {
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchesSearch =
      (s.user.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.api.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.utrNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Subscriptions & Activations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review client payment receipts for API setup (₹5,500 + 18% GST = ₹6,490) and approve live API access
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSubscriptions}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/apis"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage API Catalog</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Requests</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Approvals</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendingCount}</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Approved &amp; Active</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{approvedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subscription Revenue</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, company, email, API name or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === st
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {st === "ALL" && `All (${totalCount})`}
              {st === "PENDING" && `Pending (${pendingCount})`}
              {st === "APPROVED" && `Approved (${approvedCount})`}
              {st === "REJECTED" && `Rejected (${rejectedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">Loading subscription requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No subscription requests found</div>
            <p className="text-xs text-slate-400">
              When clients subscribe to APIs and submit payment receipts, they will appear here for review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client / Enterprise</th>
                  <th className="py-3.5 px-3">API Name &amp; Route</th>
                  <th className="py-3.5 px-3">Amount</th>
                  <th className="py-3.5 px-3">Payment Info</th>
                  <th className="py-3.5 px-3">Receipt Proof</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sub) => {
                  const isLoading = actionLoadingId === sub.id;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      {/* Client */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {sub.user.companyName || sub.user.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{sub.user.email}</div>
                        {sub.user.phone && <div className="text-[10px] text-slate-400">{sub.user.phone}</div>}
                      </td>

                      {/* API */}
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-900">{sub.api.name}</div>
                        <div className="font-mono text-[11px] text-blue-600 mt-0.5">{sub.api.endpointPath}</div>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {sub.api.category?.name || "API"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900">₹{sub.totalAmount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">
                          (₹{sub.setupFee} + 18% GST)
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-3">
                        <div className="font-mono font-bold text-slate-800">UTR: {sub.utrNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Method: <span className="font-semibold uppercase">{sub.paymentMethod}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(sub.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Receipt */}
                      <td className="py-4 px-3">
                        {sub.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReceipt({
                                url: sub.receiptUrl,
                                title: `${sub.api.name} - ${sub.user.companyName || sub.user.fullName} (UTR: ${sub.utrNumber})`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-900 bg-white text-slate-800 font-semibold text-[11px] transition shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No file attached</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        {sub.status === "APPROVED" && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                            {sub.reviewedAt && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(sub.reviewedAt).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                        )}
                        {sub.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Verification Pending</span>
                          </span>
                        )}
                        {sub.status === "REJECTED" && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                            {sub.adminRemarks && (
                              <div className="text-[10px] text-rose-600 mt-0.5 max-w-xs truncate" title={sub.adminRemarks}>
                                {sub.adminRemarks}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {sub.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleApprove(sub)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() =>
                                setRejectModal({
                                  id: sub.id,
                                  apiName: sub.api.name,
                                  clientName: sub.user.companyName || sub.user.fullName,
                                })
                              }
                              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-xs text-slate-900 truncate pr-4">{selectedReceipt.title}</div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 flex-1 min-h-[300px]">
              {selectedReceipt.url.startsWith("data:application/pdf") ? (
                <iframe src={selectedReceipt.url} className="w-full h-[500px] rounded-lg" title="PDF Receipt" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedReceipt.url}
                  alt="Payment Receipt"
                  className="max-h-[600px] max-w-full rounded-lg shadow-md object-contain"
                />
              )}
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Reject Subscription Payment Proof</span>
            </div>
            <p className="text-xs text-slate-600">
              You are rejecting the payment verification for <strong>{rejectModal.apiName}</strong> submitted by{" "}
              <strong>{rejectModal.clientName}</strong>. Please provide a clear reason so the client can rectify and resubmit.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR number not reflected in bank account / Invalid receipt screenshot / Payment amount mismatch..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason("");
                  }}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModal.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
