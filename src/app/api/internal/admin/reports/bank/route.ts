import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId") || undefined;
    const account = searchParams.get("account") || undefined;
    const ifsc = searchParams.get("ifsc") || undefined;

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
    if (account) where.accountNumber = { contains: account };
    if (ifsc) where.ifscCode = { contains: ifsc.toUpperCase() };

    const reports = await db.bankReport.findMany({
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
      accountNumber: r.accountNumber,
      ifscCode: r.ifscCode,
      beneficiaryName: r.beneficiaryName,
      nameAtBank: r.nameAtBank,
      matchPercentage: r.matchPercentage,
      utrNumber: r.utrNumber,
      status: r.status,
      latencyMs: r.apiLog.latencyMs,
      sellPrice: r.apiLog.sellPrice,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ reports: formatted });
  } catch (err: any) {
    console.error("Bank reports fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
