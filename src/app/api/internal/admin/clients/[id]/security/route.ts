import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { allowedIps, sandboxIps, allowedDomains, webhookUrl, webhookSecret, rateLimitRpm, lowBalanceAlert } = body;

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: { clientSettings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const updated = await db.clientSetting.upsert({
      where: { userId: params.id },
      update: {
        ...(allowedIps !== undefined && { allowedIps: JSON.stringify(allowedIps) }),
        ...(sandboxIps !== undefined && { sandboxIps: JSON.stringify(sandboxIps) }),
        ...(allowedDomains !== undefined && { allowedDomains: JSON.stringify(allowedDomains) }),
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(webhookSecret !== undefined && { webhookSecret }),
        ...(rateLimitRpm !== undefined && { rateLimitRpm: Number(rateLimitRpm) }),
        ...(lowBalanceAlert !== undefined && { lowBalanceAlert: Number(lowBalanceAlert) }),
      },
      create: {
        userId: params.id,
        allowedIps: JSON.stringify(allowedIps || []),
        sandboxIps: JSON.stringify(sandboxIps || ["127.0.0.1", "::1"]),
        allowedDomains: JSON.stringify(allowedDomains || []),
        webhookUrl,
        webhookSecret,
        rateLimitRpm: Number(rateLimitRpm) || 120,
        lowBalanceAlert: Number(lowBalanceAlert) || 500,
        isLiveEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Security settings and IP whitelists updated successfully.",
      settings: updated,
    });
  } catch (err: any) {
    console.error("Security update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
