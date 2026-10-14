import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const apiId = searchParams.get("apiId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (userId) where.userId = userId;
    if (apiId) where.apiId = apiId;
    if (status) where.status = status;

    const logs = await db.apiLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { companyName: true, email: true, clientCode: true } },
        api: { select: { name: true, endpointPath: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Logs fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
