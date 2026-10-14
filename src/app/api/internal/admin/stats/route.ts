import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
        take: 15,
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

    // Calculate Financial totals
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
