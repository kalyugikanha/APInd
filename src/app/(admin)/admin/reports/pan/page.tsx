"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function PanReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [panFilter, setPanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (panFilter) params.set("pan", panFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/internal/admin/reports/pan?${params.toString()}`)
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
  }, [statusFilter]);

  const exportToExcel = () => {
    const rows = reports.map((r) => ({
      "Colladome Order ID": r.orderId,
      "Client Order ID": r.clientOrderId || "N/A",
      "Client Name": r.clientName,
      "Client Code": r.clientCode,
      "PAN Number": r.panNumber,
      "Full Name": r.fullName,
      Category: r.category,
      Status: r.status,
      "Aadhaar Linked": r.panAadhaarLinked ? "YES" : "NO",
      "Retail Price (₹)": r.sellPrice,
      "Latency (ms)": r.latencyMs,
      Date: new Date(r.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PAN_Verification_Report");
    XLSX.writeFile(workbook, `Colladome_PAN_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PAN Card Verification Report</h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive audit report of all PAN lookups across clients with Aadhaar linking status
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
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PAN Number (e.g. AAACA...)"
              value={panFilter}
              onChange={(e) => setPanFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs uppercase font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="VALID">VALID</option>
            <option value="INVALID">INVALID</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">PAN Number</th>
                <th className="p-3">Full Name on Card</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aadhaar Linked</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Date & Time</th>
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
                    <td className="p-3 font-mono font-bold text-slate-900 text-sm">{r.panNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.fullName || "-"}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                        {r.category || "INDIVIDUAL"}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.status === "VALID" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          INVALID
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {r.panAadhaarLinked ? (
                        <span className="text-emerald-600 font-semibold text-xs">YES</span>
                      ) : (
                        <span className="text-slate-400 text-xs">NO</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{r.latencyMs}ms</td>
                    <td className="p-3 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {loading ? "Loading PAN verification reports..." : "No records found."}
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
