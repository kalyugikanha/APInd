"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Terminal,
  Download,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/internal/admin/reports/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.colladomeOrderId?.toLowerCase().includes(q) ||
        log.clientOrderId?.toLowerCase().includes(q) ||
        log.providerOrderId?.toLowerCase().includes(q) ||
        log.user?.companyName?.toLowerCase().includes(q) ||
        log.user?.clientCode?.toLowerCase().includes(q) ||
        log.endpointPath?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportExcel = () => {
    const rows = filteredLogs.map((l) => {
      let parsedRaw: any = {};
      try {
        parsedRaw = JSON.parse(l.responseBody || "{}");
      } catch {}
      return {
        "Colladome Order ID": l.colladomeOrderId,
        "Client Order / Task ID": l.clientOrderId || "-",
        "Client Company": l.user?.companyName || l.user?.email || "-",
        "Client Code": l.user?.clientCode || "-",
        "Gateway Endpoint": l.endpointPath,
        "Upstream Provider": l.provider?.name || "Primary Gateway",
        "Vendor Task ID": parsedRaw.task_id || l.providerOrderId || "-",
        "Vendor Group ID": parsedRaw.group_id || "-",
        "Vendor Request ID": parsedRaw.request_id || "-",
        "Vendor Billable": parsedRaw.metadata?.billable || "-",
        "HTTP Status": l.responseStatus,
        "Result Status": l.status,
        "Latency (ms)": l.latencyMs,
        "Sell Price (INR)": l.sellPrice,
        "Base Cost (INR)": l.costPrice,
        "Net Margin (INR)": l.marginProfit,
        "Client IP": l.ipAddress,
        Timestamp: new Date(l.createdAt).toLocaleString(),
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(workbook, `Colladome_Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderSelectedModal = () => {
    if (!selectedLog) return null;
    let rawVendorObj: any = {};
    let parsedReqObj: any = {};
    try {
      rawVendorObj = JSON.parse(selectedLog.responseBody || "{}");
    } catch {}
    try {
      parsedReqObj = JSON.parse(selectedLog.requestBody || "{}");
    } catch {}

    const sanitizedClientObj = {
      success: selectedLog.status === "SUCCESS",
      response_code: rawVendorObj.response_code || (selectedLog.status === "SUCCESS" ? "100" : "104"),
      response_message:
        rawVendorObj.response_message ||
        (selectedLog.status === "SUCCESS" ? "Valid Authentication" : "Validation Failed"),
      colladome_order_id: selectedLog.colladomeOrderId,
      client_order_id: selectedLog.clientOrderId || null,
      result: rawVendorObj.result ?? rawVendorObj.data ?? rawVendorObj,
      status: selectedLog.status,
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 text-white shadow-2xl relative max-h-[88vh] overflow-y-auto space-y-5">
          <button
            onClick={() => setSelectedLog(null)}
            className="absolute right-5 top-5 text-slate-400 hover:text-white text-sm font-bold"
          >
            ✕
          </button>

          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Upstream Morpher &amp; Gateway Transaction Audit Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Colladome Order: <span className="text-white font-bold">{selectedLog.colladomeOrderId}</span> • Client Order ID:{" "}
              <span className="text-emerald-400 font-bold">{selectedLog.clientOrderId || "None"}</span> • Client:{" "}
              {selectedLog.user?.companyName} ({selectedLog.user?.clientCode})
            </p>
          </div>

          {/* Upstream Gateway Vendor Audit Metadata Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[11px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Internal Upstream Provider Metadata (Hidden from Client)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                Provider: {selectedLog.provider?.name || "Primary Gateway"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Gateway task_id</div>
                <div className="text-amber-300 font-bold truncate mt-0.5">
                  {rawVendorObj.task_id || selectedLog.providerOrderId || "-"}
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Gateway group_id</div>
                <div className="text-slate-200 font-bold truncate mt-0.5">
                  {rawVendorObj.group_id || "-"}
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Gateway request_id</div>
                <div className="text-slate-200 font-bold truncate mt-0.5">
                  {rawVendorObj.request_id || "-"}
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Vendor Billable &amp; Margin</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  Billable: {rawVendorObj.metadata?.billable || "Y"} • +₹{selectedLog.marginProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Client Request Body */}
          <div className="text-xs font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
              1. Incoming Client Request Payload ({selectedLog.httpMethod} {selectedLog.endpointPath}):
            </div>
            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-blue-300 overflow-x-auto max-h-44">
              {JSON.stringify(parsedReqObj, null, 2)}
            </pre>
          </div>

          {/* Side-by-Side Comparison: Raw Upstream Vendor Response vs Sanitized Client Response */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                2. Raw Upstream Vendor Response (Stored in Logs Only):
              </div>
              <pre className="p-3.5 bg-slate-950 rounded-xl border border-amber-900/40 text-amber-200 overflow-x-auto max-h-72">
                {JSON.stringify(rawVendorObj, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1.5">
                3. Sanitized Morphed Response (Returned to Client):
              </div>
              <pre className="p-3.5 bg-slate-950 rounded-xl border border-emerald-900/40 text-emerald-300 overflow-x-auto max-h-72">
                {JSON.stringify(sanitizedClientObj, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Hit Logs &amp; Audit Inspector</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time upstream gateway metadata audit (`task_id`, `group_id`, `request_id`, `billable`), client order IDs, and margin inspector
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Excel</span>
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Colladome Order ID, Client task_id, Gateway Order ID, Client, or Endpoint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(["ALL", "SUCCESS", "FAILED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Colladome Order ID</th>
                <th className="p-3.5">Client Order / Task ID</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Endpoint Path</th>
                <th className="p-3.5">Upstream Vendor ID</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5">Sell / Cost</th>
                <th className="p-3.5">Margin</th>
                <th className="p-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No matching API hit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-600">{log.colladomeOrderId}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700">
                      {log.clientOrderId || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{log.user?.companyName || log.user?.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.user?.clientCode}</div>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-800">{log.endpointPath}/</td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-700">
                      {log.providerOrderId || "SANDBOX_SIM"}
                    </td>
                    <td className="p-3.5">
                      {log.status === "SUCCESS" ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                          {log.responseStatus} SUCCESS
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-200">
                          {log.responseStatus} {log.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">{log.latencyMs}ms</td>
                    <td className="p-3.5 font-mono">
                      ₹{log.sellPrice.toFixed(2)} / <span className="text-slate-400">₹{log.costPrice.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">+₹{log.marginProfit.toFixed(2)}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded transition flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderSelectedModal()}
    </div>
  );
}
