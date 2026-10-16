import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId") || undefined;
    const apiId = searchParams.get("apiId") || undefined;
    const status = searchParams.get("status") || undefined;

    let effectiveUserId = userIdParam;
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload && payload.role !== "SUPER_ADMIN") {
        effectiveUserId = payload.userId;
      }
    }

    const where: any = {};
    if (effectiveUserId) where.userId = effectiveUserId;
    if (apiId) where.apiId = apiId;
    if (status) where.status = status;

    const [rawLogs, providers] = await Promise.all([
      db.apiLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 150,
        include: {
          user: { select: { companyName: true, email: true, clientCode: true } },
          api: { select: { name: true, endpointPath: true } },
        },
      }),
      db.provider.findMany({ select: { id: true, name: true, code: true } }),
    ]);

    const providerMap = new Map(providers.map((p) => [p.id, p]));
    const logs = rawLogs.map((log) => ({
      ...log,
      provider: log.providerId ? providerMap.get(log.providerId) || null : null,
    }));

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Logs fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
