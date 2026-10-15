import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const providers = await db.provider.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { mappings: true } },
      },
    });

    const formatted = providers.map((p) => {
      let creds: any = {};
      try {
        creds = JSON.parse(decrypt(p.credentialsEnc) || "{}");
      } catch {
        creds = {};
      }

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        baseUrl: p.baseUrl,
        authType: p.authType,
        isActive: p.isActive,
        isSimulation: creds.isSimulation !== false,
        keyHint: creds.apiKey ? `...${creds.apiKey.slice(-4)}` : "Not Configured",
        hasSecret: Boolean(creds.apiSecret),
        mappingsCount: p._count.mappings,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ providers: formatted });
  } catch (err: any) {
    console.error("Error fetching providers:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, baseUrl, apiKey, apiSecret, authType, isActive, isSimulation } = body;

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    let currentCreds: any = {};
    try {
      currentCreds = JSON.parse(decrypt(provider.credentialsEnc) || "{}");
    } catch {
      currentCreds = {};
    }

    const updatedCreds = {
      apiKey: apiKey !== undefined && apiKey !== "" ? apiKey : currentCreds.apiKey || "",
      apiSecret: apiSecret !== undefined && apiSecret !== "" ? apiSecret : currentCreds.apiSecret || "",
      isSimulation: isSimulation !== undefined ? isSimulation : currentCreds.isSimulation,
    };

    const updated = await db.provider.update({
      where: { id },
      data: {
        baseUrl: baseUrl || provider.baseUrl,
        authType: authType || provider.authType,
        isActive: isActive !== undefined ? isActive : provider.isActive,
        credentialsEnc: encrypt(JSON.stringify(updatedCreds)),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Provider ${updated.name} updated successfully!`,
      provider: {
        id: updated.id,
        name: updated.name,
        baseUrl: updated.baseUrl,
        authType: updated.authType,
        isActive: updated.isActive,
        isSimulation: updatedCreds.isSimulation !== false,
        keyHint: updatedCreds.apiKey ? `...${updatedCreds.apiKey.slice(-4)}` : "Not Configured",
      },
    });
  } catch (err: any) {
    console.error("Error updating provider:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
