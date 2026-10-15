import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }

    const provider = await db.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    let creds: any = {};
    try {
      creds = JSON.parse(decrypt(provider.credentialsEnc) || "{}");
    } catch {
      creds = {};
    }

    const isSimulation = creds.isSimulation !== false;
    const targetUrl = provider.baseUrl || "https://httpbin.org/status/200";

    // Set up Auth headers
    const headers: Record<string, string> = {
      "User-Agent": "Colladome-HealthCheck/1.0",
    };

    if (provider.authType === "HEADER_API_KEY" && creds.apiKey) {
      headers["x-api-key"] = creds.apiKey;
    } else if (provider.authType === "BEARER_TOKEN" && creds.apiKey) {
      headers["Authorization"] = `Bearer ${creds.apiKey}`;
    } else if (provider.authType === "BASIC_AUTH" && creds.apiKey) {
      const authStr = `${creds.apiKey}:${creds.apiSecret || ""}`;
      headers["Authorization"] = `Basic ${Buffer.from(authStr).toString("base64")}`;
    }

    // If provider is in simulation mode without live credentials, test simulation pipeline directly
    if (isSimulation && (!creds.apiKey || creds.apiKey === "demo_key" || !provider.baseUrl || provider.baseUrl.includes("example.com") || provider.baseUrl.includes("mock"))) {
      const latencyMs = Math.floor(Math.random() * 8) + 2; // 2-10ms mock
      return NextResponse.json({
        success: true,
        reachable: true,
        mode: "SIMULATION",
        status: 200,
        statusText: "OK (Simulated Sandbox Engine)",
        latencyMs,
        provider: {
          id: provider.id,
          name: provider.name,
          code: provider.code,
          baseUrl: provider.baseUrl,
        },
        message: "Simulation engine online. Ready for zero-cost mock verification requests.",
      });
    }

    // Real live HTTP Ping with 5-second timeout
    try {
      let pingRes: Response;
      try {
        // Try HEAD first to avoid payload transfer
        pingRes = await fetch(targetUrl, {
          method: "HEAD",
          headers,
          signal: AbortSignal.timeout(5000),
        });
      } catch (headErr) {
        // Fallback to GET if HEAD rejected or unsupported
        pingRes = await fetch(targetUrl, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(5000),
        });
      }

      const latencyMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        reachable: true,
        mode: isSimulation ? "SIMULATION" : "LIVE",
        status: pingRes.status,
        statusText: pingRes.statusText || (pingRes.status < 400 ? "OK" : "Reachable"),
        latencyMs,
        provider: {
          id: provider.id,
          name: provider.name,
          code: provider.code,
          baseUrl: provider.baseUrl,
        },
        message: `Upstream endpoint responded with HTTP ${pingRes.status} in ${latencyMs}ms. Reachability verified.`,
      });
    } catch (fetchErr: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = fetchErr.name === "TimeoutError" || fetchErr.message?.includes("timeout");
      
      return NextResponse.json({
        success: false,
        reachable: false,
        mode: isSimulation ? "SIMULATION" : "LIVE",
        status: isTimeout ? 504 : 502,
        statusText: isTimeout ? "Gateway Timeout" : "Bad Gateway / Unreachable",
        latencyMs,
        provider: {
          id: provider.id,
          name: provider.name,
          code: provider.code,
          baseUrl: provider.baseUrl,
        },
        error: isTimeout ? "Upstream connection timed out after 5,000ms" : (fetchErr.message || "Failed to reach provider host"),
      }, { status: 200 }); // Return 200 with reachable: false so frontend displays the diagnostic gracefully
    }
  } catch (err: any) {
    console.error("Provider ping error:", err);
    return NextResponse.json({
      error: err.message || "Internal server error during ping",
    }, { status: 500 });
  }
}
