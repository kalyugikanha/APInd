import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/crypto";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload ? payload.userId : null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type = "SANDBOX" } = body;

    const keyType = type === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
    const label = (name || "").trim() || `${keyType === "PRODUCTION" ? "Live Production" : "Sandbox Test"} Key`;

    const generated = generateApiKey(keyType);

    const keyRecord = await db.apiKey.create({
      data: {
        userId,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        keyHint: generated.keyHint,
        type: keyType,
        name: label,
        rateLimitRpm: keyType === "PRODUCTION" ? 300 : 60,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${keyType} API key generated successfully!`,
      rawApiKey: generated.rawKey,
      key: keyRecord,
    });
  } catch (err: any) {
    console.error("Key generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "keyId is required" }, { status: 400 });
    }

    const keyRecord = await db.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!keyRecord) {
      return NextResponse.json({ error: "API Key not found or unauthorized" }, { status: 404 });
    }

    // Toggle or revoke
    await db.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: `API Key '${keyRecord.name}' revoked successfully.`,
    });
  } catch (err: any) {
    console.error("Key revocation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
