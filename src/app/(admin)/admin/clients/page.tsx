"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ArrowRight,
  Wallet,
} from "lucide-react";
import WalletAdjustmentModal, { ClientWalletSummary } from "@/components/admin/WalletAdjustmentModal";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<ClientWalletSummary | null>(null);

  const fetchClients = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/internal/admin/clients?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clients Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage enterprise accounts, verify KYC documents, and inspect Client 360° profiles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedClientForModal(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Adjust Client Wallet</span>
          </button>

          <Link
            href="/admin/clients/new"
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Client</span>
          </Link>
        </div>
      </div>

      {/* Tabs with Count Badges Matching Reference Image 2 */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setStatusFilter("")}
          className={`pb-3 transition ${
            statusFilter === ""
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          All Clients ({clients.length})
        </button>
        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`pb-3 transition ${
            statusFilter === "ACTIVE"
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Active ({clients.filter((c) => c.accountStatus === "ACTIVE").length})
        </button>
        <button
          onClick={() => setStatusFilter("UNDER_REVIEW")}
          className={`pb-3 transition ${
            statusFilter === "UNDER_REVIEW"
              ? "text-slate-950 border-b-2 border-slate-950 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Pending KYC ({clients.filter((c) => c.accountStatus === "UNDER_REVIEW").length})
        </button>
      </div>

      {/* Filter Bar Matching Reference Image 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search client, brand or PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-950"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium">
            <span>Billing Model</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Table Matching Reference Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" className="rounded accent-slate-900" />
                </th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Client Code</th>
                <th className="p-3">Contact Email</th>
                <th className="p-3">Billing Type</th>
                <th className="p-3">Wallet Balance</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.length > 0 ? (
                clients.map((c) => {
                  const isChecked = !!selectedRows[c.id];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => toggleRow(c.id)}
                      className={`cursor-pointer transition ${
                        isChecked ? "bg-emerald-50/70 text-slate-900" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(c.id)}
                          className="rounded accent-slate-900"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.companyName}</div>
                        <div className="text-[10px] text-slate-400">
                          {c.brandName ? `Brand: ${c.brandName}` : c.businessType}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">{c.clientCode}</td>
                      <td className="p-3 text-slate-600">{c.email}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c.billingModel}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">₹{c.walletBalance.toFixed(2)}</td>
                      <td className="p-3">
                        {c.kycStatus === "VERIFIED" ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold text-[10px] border border-amber-200">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-950 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          {c.accountStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientForModal({
                                id: c.id,
                                clientCode: c.clientCode || "CD-0000",
                                companyName: c.companyName || "Unnamed Company",
                                email: c.email,
                                phone: c.phone,
                                walletBalance: c.walletBalance || 0,
                                billingModel: c.billingModel,
                                accountStatus: c.accountStatus,
                              });
                              setModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Wallet className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>

                          <Link
                            href={`/admin/clients/${c.id}`}
                            className="text-xs font-semibold text-slate-900 hover:text-black underline"
                          >
                            Client 360° →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-neutral-900 text-sm">No enterprise clients onboarded yet</div>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                      Create and activate client accounts to issue production and sandbox API keys.
                    </p>
                    <Link
                      href="/admin/clients/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register First Client</span>
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Adjustment Modal */}
      <WalletAdjustmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchClients}
        initialClient={selectedClientForModal}
      />
    </div>
  );
}
