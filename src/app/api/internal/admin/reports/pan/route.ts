import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const pan = searchParams.get("pan") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (pan) where.panNumber = { contains: pan.toUpperCase() };

    const reports = await db.panReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { companyName: true, email: true, clientCode: true } },
        apiLog: { select: { colladomeOrderId: true, clientOrderId: true, latencyMs: true, sellPrice: true } },
      },
    });

    const formatted = reports.map((r) => ({
      id: r.id,
      orderId: r.apiLog.colladomeOrderId,
      clientOrderId: r.apiLog.clientOrderId,
      clientName: r.user.companyName || r.user.email,
      clientCode: r.user.clientCode,
      panNumber: r.panNumber,
      fullName: r.fullName,
      category: r.category,
      status: r.status,
      panAadhaarLinked: r.panAadhaarLinked,
      latencyMs: r.apiLog.latencyMs,
      sellPrice: r.apiLog.sellPrice,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reports: formatted });
  } catch (err: any) {
    console.error("PAN reports fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
