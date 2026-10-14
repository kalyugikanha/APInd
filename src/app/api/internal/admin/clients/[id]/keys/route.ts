import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { type = "PRODUCTION", name = "API Key" } = body;

    const generated = generateApiKey(type as "PRODUCTION" | "SANDBOX");

    const key = await db.apiKey.create({
      data: {
        userId: params.id,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        keyHint: generated.keyHint,
        type,
        name,
        rateLimitRpm: type === "PRODUCTION" ? 300 : 60,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API key generated successfully. Copy it now, as the secret will not be shown again.",
      rawKey: generated.rawKey,
      key,
    });
  } catch (err: any) {
    console.error("Key generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ error: "keyId is required." }, { status: 400 });
    }

    await db.apiKey.update({
      where: { id: keyId, userId: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "API key revoked successfully." });
  } catch (err: any) {
    console.error("Key revocation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
