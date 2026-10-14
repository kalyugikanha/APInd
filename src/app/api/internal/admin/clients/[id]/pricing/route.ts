import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { apiId, customPrice, isEnabled } = body;

    if (!apiId || customPrice === undefined) {
      return NextResponse.json({ error: "apiId and customPrice are required." }, { status: 400 });
    }

    const rule = await db.clientPricing.upsert({
      where: {
        userId_apiId: {
          userId: params.id,
          apiId,
        },
      },
      update: {
        customPrice: Number(customPrice),
        isEnabled: isEnabled ?? true,
      },
      create: {
        userId: params.id,
        apiId,
        customPrice: Number(customPrice),
        isEnabled: isEnabled ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Custom pricing updated successfully for this client.",
      rule,
    });
  } catch (err: any) {
    console.error("Pricing update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
