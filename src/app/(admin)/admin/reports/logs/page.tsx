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
} from "lucide-react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Hit Logs & Audit Inspector</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time deep request & response inspector with provider latency and financial margin audit
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Endpoint Path</th>
                <th className="p-3">Client IP</th>
                <th className="p-3">Status</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Sell / Cost</th>
                <th className="p-3">Margin</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-medium text-blue-600">{log.colladomeOrderId}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{log.user?.companyName || log.user?.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.user?.clientCode}</div>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-800">{log.endpointPath}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                  <td className="p-3">
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
                  <td className="p-3 font-mono">{log.latencyMs}ms</td>
                  <td className="p-3 font-mono">
                    ₹{log.sellPrice.toFixed(2)} / <span className="text-slate-400">₹{log.costPrice.toFixed(2)}</span>
                  </td>
                  <td className="p-3 font-bold text-emerald-600">+₹{log.marginProfit.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Modal Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Transaction Payload Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Order ID: {selectedLog.colladomeOrderId} • Client: {selectedLog.user?.companyName}
            </p>

            <div className="mt-4 space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Internal Provider Audit:</div>
                <div className="text-slate-300">
                  Provider Transaction ID:{" "}
                  <strong className="text-amber-400">{selectedLog.providerOrderId || "SANDBOX_MOCK"}</strong>
                </div>
                <div className="text-slate-300 mt-1">
                  Cost to Colladome: ₹{selectedLog.costPrice.toFixed(2)} | Charged to Client: ₹
                  {selectedLog.sellPrice.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Client Request Body:</div>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-blue-300 overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedLog.requestBody || "{}"), null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Sanitized Gateway Response (Returned to Client):
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-400 overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedLog.responseBody || "{}"), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
