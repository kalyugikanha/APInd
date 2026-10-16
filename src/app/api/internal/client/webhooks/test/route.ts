import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

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

    const body = await req.json();
    const { url, secret } = body;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { clientSettings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const targetUrl = (url || user.clientSettings?.webhookUrl || "").trim();
    if (!targetUrl || !targetUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Please configure a valid Webhook URL starting with http:// or https://" },
        { status: 400 }
      );
    }

    const signingSecret = secret || user.clientSettings?.webhookSecret || null;

    const testData = {
      message: "Colladome Webhook Connection Verification",
      client_code: user.clientCode,
      company: user.companyName || user.fullName,
      test_order_id: `TEST_CDO_${Date.now()}`,
      verification_type: "PAN_IDENTITY_CHECK",
      mock_result: {
        pan_number: "ABCDE1234F",
        full_name: "SAMPLE CITIZEN",
        status: "VALID",
      },
      sent_at: new Date().toISOString(),
    };

    const result = await dispatchWebhook(
      targetUrl,
      signingSecret,
      "webhook.test_ping",
      testData,
      0 // Single attempt for interactive test
    );

    return NextResponse.json({
      success: result.success,
      targetUrl,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      deliveryId: result.deliveryId,
      error: result.error,
      signatureSample: signingSecret ? "HMAC-SHA256 (t=...,v1=...)" : "None (Unsigned)",
    });
  } catch (err: any) {
    console.error("Test webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
