"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function BankReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("");
  const [ifscFilter, setIfscFilter] = useState("");

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (accountFilter) params.set("account", accountFilter);
    if (ifscFilter) params.set("ifsc", ifscFilter);

    fetch(`/api/internal/admin/reports/bank?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportToExcel = () => {
    const rows = reports.map((r) => ({
      "Colladome Order ID": r.orderId,
      "Client Order ID": r.clientOrderId || "N/A",
      "Client Name": r.clientName,
      "Account Number": r.accountNumber,
      "IFSC Code": r.ifscCode,
      "Beneficiary Name": r.beneficiaryName,
      "Name Registered at Bank": r.nameAtBank,
      "Name Match %": r.matchPercentage,
      "Bank UTR": r.utrNumber,
      Status: r.status,
      "Retail Price (₹)": r.sellPrice,
      "Latency (ms)": r.latencyMs,
      Date: new Date(r.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank_Verification_Report");
    XLSX.writeFile(workbook, `Colladome_Bank_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IFSC & Bank Verification Report</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time IFSC branch lookups, Penny Drop & IMPS verification audit logs with bank details and MICR/UTR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToExcel}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by IFSC_LOOKUP or Account..."
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by IFSC Code (e.g. SBIN0000001, THRS0000XXX)..."
            value={ifscFilter}
            onChange={(e) => setIfscFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs uppercase font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
        >
          Apply Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Type / Account</th>
                <th className="p-3">IFSC Code</th>
                <th className="p-3">Bank Name</th>
                <th className="p-3">Branch & City / Beneficiary</th>
                <th className="p-3">Match %</th>
                <th className="p-3">MICR / Bank UTR</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-blue-600 font-medium">{r.orderId}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.clientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.clientCode}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {r.accountNumber === "IFSC_LOOKUP" ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                          IFSC LOOKUP
                        </span>
                      ) : (
                        r.accountNumber
                      )}
                    </td>
                    <td className="p-3 font-mono uppercase text-blue-600 font-semibold">{r.ifscCode}</td>
                    <td className="p-3 font-semibold text-slate-900">{r.nameAtBank || "-"}</td>
                    <td className="p-3 text-slate-700">{r.beneficiaryName || "-"}</td>
                    <td className="p-3 font-bold text-emerald-600">{r.matchPercentage ? `${r.matchPercentage}%` : "-"}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{r.utrNumber || "-"}</td>
                    <td className="p-3">
                      {r.status === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    {loading ? "Loading bank verification reports..." : "No records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
