import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { handleGatewayRequest } from "@/lib/gateway/proxy";

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
      return NextResponse.json({ error: "Unauthorized: Active session required" }, { status: 401 });
    }

    const payload = await req.json();
    const { endpointPath, body, apiKey } = payload;

    if (!endpointPath) {
      return NextResponse.json({ error: "endpointPath is required" }, { status: 400 });
    }

    // Build synthetic NextRequest for Gateway Proxy
    const url = `https://api.colladome.com${endpointPath}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-playground-user-id": userId,
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const syntheticReq = new NextRequest(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body || {}),
    });

    const startTime = Date.now();
    const response = await handleGatewayRequest(syntheticReq, endpointPath, "POST");
    const latency = Date.now() - startTime;
    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      latency,
      result: data,
    });
  } catch (err: any) {
    console.error("Playground runner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
