import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { generateWebhookSecret } from "@/lib/webhooks/dispatcher";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload ? payload.userId : null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newSecret = generateWebhookSecret();

    await db.clientSetting.upsert({
      where: { userId },
      update: { webhookSecret: newSecret },
      create: {
        userId,
        webhookSecret: newSecret,
        allowedIps: "[]",
        sandboxIps: JSON.stringify(["127.0.0.1", "::1"]),
        allowedDomains: "[]",
        isLiveEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New webhook signing secret generated successfully.",
      secret: newSecret,
    });
  } catch (err: any) {
    console.error("Webhook secret error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
