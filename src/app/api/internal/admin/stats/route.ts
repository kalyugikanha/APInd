import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalHits,
      successHits,
      failedHits,
      logs,
      totalClients,
      activeClients,
      pendingClients,
      apis,
      providers,
    ] = await Promise.all([
      db.apiLog.count(),
      db.apiLog.count({ where: { status: "SUCCESS" } }),
      db.apiLog.count({ where: { status: { in: ["FAILED", "TIMEOUT", "PROVIDER_ERROR"] } } }),
      db.apiLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { companyName: true, email: true, clientCode: true } },
          api: { select: { name: true, endpointPath: true } },
        },
      }),
      db.user.count({ where: { role: { in: ["CLIENT_ADMIN", "CLIENT_DEV"] } } }),
      db.user.count({ where: { role: { in: ["CLIENT_ADMIN", "CLIENT_DEV"] }, accountStatus: "ACTIVE" } }),
      db.user.count({ where: { kycStatus: "PENDING" } }),
      db.api.findMany({ select: { id: true, name: true, endpointPath: true } }),
      db.provider.findMany({ select: { id: true, name: true, code: true } }),
    ]);

    // Financial totals
    const financialSummary = await db.apiLog.aggregate({
      _sum: {
        sellPrice: true,
        costPrice: true,
        marginProfit: true,
      },
    });

    const grossRevenue = financialSummary._sum.sellPrice || 0;
    const totalProviderCost = financialSummary._sum.costPrice || 0;
    const netProfitMargin = financialSummary._sum.marginProfit || 0;
    const successRate = totalHits > 0 ? Number(((successHits / totalHits) * 100).toFixed(1)) : 100;

    // 7-Day Trend Aggregation
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLogs = await db.apiLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, apiId: true, status: true },
    });

    // Group by Day
    const daysMap: Record<string, { label: string; date: string; hits: number; success: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      daysMap[dateKey] = { label, date: dateKey, hits: 0, success: 0 };
    }

    weeklyLogs.forEach((l) => {
      const key = new Date(l.createdAt).toISOString().slice(0, 10);
      if (daysMap[key]) {
        daysMap[key].hits++;
        if (l.status === "SUCCESS") daysMap[key].success++;
      }
    });

    const dailyVolume = Object.values(daysMap);

    return NextResponse.json({
      summary: {
        totalHits,
        successHits,
        failedHits,
        successRate,
        grossRevenue,
        totalProviderCost,
        netProfitMargin,
        totalClients,
        activeClients,
        pendingClients,
      },
      dailyVolume,
      recentHits: logs.map((log) => ({
        id: log.id,
        orderId: log.colladomeOrderId,
        clientOrderId: log.clientOrderId,
        clientName: log.user.companyName || log.user.email,
        clientCode: log.user.clientCode,
        apiName: log.api.name,
        endpoint: log.endpointPath,
        status: log.status,
        statusCode: log.responseStatus,
        latencyMs: log.latencyMs,
        sellPrice: log.sellPrice,
        marginProfit: log.marginProfit,
        createdAt: log.createdAt,
      })),
      providers,
      apis,
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
