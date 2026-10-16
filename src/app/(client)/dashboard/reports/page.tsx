"use client";

import React, { useState, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

export default function ClientReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [bankReports, setBankReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"bank" | "pan">("bank");
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/internal/admin/reports/pan").then((r) => r.json()),
      fetch("/api/internal/admin/reports/bank").then((r) => r.json()),
    ])
      .then(([panData, bankData]) => {
        setReports(panData.reports || []);
        setBankReports(bankData.reports || []);
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

  const handleExportExcel = () => {
    if (activeTab === "bank") {
      const rows = bankReports.map((r) => ({
        "Colladome Order ID": r.orderId,
        "Your Order Ref": r.clientOrderId || "N/A",
        "Verification Type": r.accountNumber === "IFSC_LOOKUP" ? "IFSC Branch Lookup" : r.accountNumber,
        "IFSC Code": r.ifscCode,
        "Bank Name": r.nameAtBank || "N/A",
        "Branch & City": r.beneficiaryName || "N/A",
        "MICR / UTR": r.utrNumber || "N/A",
        Status: r.status,
        Date: new Date(r.createdAt).toLocaleString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "IFSC_Bank_Reports");
      XLSX.writeFile(workbook, `Colladome_IFSC_Bank_Report_${Date.now()}.xlsx`);
    } else {
      const rows = reports.map((r) => ({
        "Colladome Order ID": r.orderId,
        "Your Order Ref": r.clientOrderId || "N/A",
        "PAN Number": r.panNumber,
        "Taxpayer Name": r.fullName,
        Category: r.category,
        Status: r.status,
        "Aadhaar Linked": r.panAadhaarLinked ? "YES" : "NO",
        Date: new Date(r.createdAt).toLocaleString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PAN_Reports");
      XLSX.writeFile(workbook, `Colladome_PAN_Report_${Date.now()}.xlsx`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download your organization's real-time IFSC, banking, and identity verification audit records
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
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("bank")}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 ${
            activeTab === "bank"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          IFSC & Banking Verifications ({bankReports.length})
        </button>
        <button
          onClick={() => setActiveTab("pan")}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 ${
            activeTab === "pan"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          PAN Card Verifications ({reports.length})
        </button>
      </div>

      {activeTab === "bank" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Client Order ID</th>
                  <th className="p-3">IFSC Code</th>
                  <th className="p-3">Bank Name</th>
                  <th className="p-3">Branch & City</th>
                  <th className="p-3">MICR / UTR</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {loading ? "Loading IFSC & banking reports..." : "No verification records yet."}
                    </td>
                  </tr>
                ) : (
                  bankReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-medium text-blue-600">{r.orderId}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{r.clientOrderId || "-"}</td>
                      <td className="p-3 font-mono uppercase font-bold text-slate-900">{r.ifscCode}</td>
                      <td className="p-3 font-semibold text-slate-800">{r.nameAtBank || "-"}</td>
                      <td className="p-3 text-slate-600">{r.beneficiaryName || "-"}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{r.utrNumber || "-"}</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pan" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">PAN Number</th>
                  <th className="p-3">Taxpayer Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aadhaar Linked</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {loading ? "Loading PAN reports..." : "No PAN verification records yet."}
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-medium text-blue-600">{r.orderId}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{r.panNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{r.fullName || "-"}</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">{r.panAadhaarLinked ? "YES" : "NO"}</td>
                      <td className="p-3 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
