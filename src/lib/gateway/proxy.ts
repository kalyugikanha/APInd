import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, AuthenticatedClient } from "@/lib/gateway/auth";
import { deductWalletForApiHit } from "@/lib/gateway/wallet";
import { generateOrderId, decrypt } from "@/lib/crypto";
import {
  generateMockPanResponse,
  generateMockBankResponse,
  generateMockGstinResponse,
} from "@/lib/gateway/mockProviders";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";
import { checkRateLimit } from "@/lib/gateway/rateLimiter";
import { GatewayResponse } from "@/types";

export async function handleGatewayRequest(
  req: NextRequest,
  endpointPath: string,
  method: string = "POST"
): Promise<NextResponse> {
  const startTime = Date.now();

  // 1. Authenticate Request
  const auth = await authenticateApiRequest(req);
  if (auth.error) {
    return NextResponse.json(
      {
        status: "ERROR",
        colladome_order_id: generateOrderId(),
        timestamp: new Date().toISOString(),
        data: null,
        error: auth.error,
      },
      { status: auth.error.status }
    );
  }

  const client: AuthenticatedClient = auth.client!;
  const colladomeOrderId = generateOrderId("CDO");

  // 1.1 Enforce Sliding-Window Rate Limit (RPM Throttling)
  const rateLimit = checkRateLimit(client.keyId, client.rateLimitRpm || 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        status: "ERROR",
        colladome_order_id: colladomeOrderId,
        timestamp: new Date().toISOString(),
        data: null,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Rate limit of ${rateLimit.limit} RPM exceeded. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        },
      },
      {
        status: 429,
        headers: {
          "x-ratelimit-limit": String(rateLimit.limit),
          "x-ratelimit-remaining": String(rateLimit.remaining),
          "retry-after": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  // 2. Parse Body
  let body: any = {};
  try {
    if (method !== "GET") {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  // 3. Find API in Catalog
  const api = await db.api.findUnique({
    where: { endpointPath },
    include: {
      providerMappings: {
        where: { isActive: true },
        orderBy: { priority: "asc" },
        include: { provider: true },
      },
    },
  });

  if (!api || api.status !== "ACTIVE") {
    return NextResponse.json(
      {
        status: "ERROR",
        colladome_order_id: colladomeOrderId,
        client_order_id: client.clientOrderId,
        timestamp: new Date().toISOString(),
        data: null,
        error: {
          code: "API_NOT_FOUND",
          message: `The endpoint '${endpointPath}' does not exist or is currently inactive.`,
        },
      },
      { status: 404 }
    );
  }

  // 4. Calculate Rate / Surcharge for this Client
  const customPrice = client.pricingRules.get(api.id);
  const sellPrice = customPrice !== undefined ? customPrice : api.defaultSellPrice;
  const costPrice = api.defaultCostPrice;
  const marginProfit = Number((sellPrice - costPrice).toFixed(2));

  // 5. Check Wallet Balance
  if (client.keyType === "PRODUCTION") {
    if (!client.walletId || client.walletBalance < sellPrice) {
      return NextResponse.json(
        {
          status: "FAILED",
          colladome_order_id: colladomeOrderId,
          client_order_id: client.clientOrderId,
          timestamp: new Date().toISOString(),
          data: null,
          error: {
            code: "INSUFFICIENT_WALLET_BALANCE",
            message: `Insufficient wallet balance. Required: ₹${sellPrice.toFixed(2)}, Available: ₹${client.walletBalance.toFixed(2)}. Please recharge your wallet at dashboard.colladome.com.`,
          },
        },
        { status: 402 }
      );
    }
  }

  // 6. Execute Request: Sandbox Mock OR Live Upstream Provider
  let responseData: any = null;
  let responseStatus = 200;
  let status: "SUCCESS" | "FAILED" | "TIMEOUT" = "SUCCESS";
  let usedProviderId: string | null = null;
  let providerOrderId: string | null = null;

  if (client.keyType === "SANDBOX") {
    // Sandbox / Mock Handling
    if (endpointPath.includes("/pan")) {
      const mock = generateMockPanResponse(body.pan_number);
      responseData = mock.data;
      status = mock.status as any;
      responseStatus = mock.status === "SUCCESS" ? 200 : 422;
    } else if (endpointPath.includes("/bank-verify")) {
      const mock = generateMockBankResponse(body.account_number, body.ifsc_code, body.beneficiary_name);
      responseData = mock.data;
      status = mock.status as any;
      responseStatus = mock.status === "SUCCESS" ? 200 : 422;
    } else if (endpointPath.includes("/gstin-verify")) {
      const mock = generateMockGstinResponse(body.gstin);
      responseData = mock.data;
      status = mock.status as any;
      responseStatus = mock.status === "SUCCESS" ? 200 : 422;
    } else {
      responseData = { message: "Sandbox mock response", input: body };
    }
    usedProviderId = api.providerMappings[0]?.providerId || null;
    providerOrderId = `SANDBOX_MOCK_${Date.now()}`;
  } else {
    // Live Upstream Provider Routing with Automatic Failover
    let providerSuccess = false;

    for (const mapping of api.providerMappings) {
      usedProviderId = mapping.providerId;
      try {
        const provider = mapping.provider;
        const targetUrl = `${provider.baseUrl}${mapping.providerEndpoint}`;
        const creds = JSON.parse(decrypt(provider.credentialsEnc) || "{}");

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (provider.authType === "HEADER_API_KEY") {
          headers["x-api-key"] = creds.apiKey || "demo_key";
        } else if (provider.authType === "BEARER_TOKEN") {
          headers["Authorization"] = `Bearer ${creds.apiKey || "demo_token"}`;
        }

        const isMockSimulation =
          creds.isSimulation === true ||
          !creds.apiKey ||
          creds.apiKey === "demo_key";

        let upstreamRes: any = null;

        if (!isMockSimulation && provider.isActive) {
          // Execute REAL external HTTP request to Upstream Provider (Zoop, IDFY, Decentro, Surpass)
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          try {
            const rawRes = await fetch(targetUrl, {
              method: mapping.providerMethod || "POST",
              headers,
              body: JSON.stringify(body),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            upstreamRes = await rawRes.json();
            providerOrderId =
              upstreamRes?.order_id ||
              upstreamRes?.transaction_id ||
              upstreamRes?.data?.order_id ||
              upstreamRes?.id ||
              `${provider.code}_LIVE_${Date.now()}`;
          } catch (fetchErr: any) {
            clearTimeout(timeout);
            console.warn(`Upstream provider ${provider.name} request failed or timed out:`, fetchErr.message);
            continue; // Automatic failover to next provider mapping
          }
        } else {
          // Simulated mock response when in simulation/staging mode
          if (endpointPath.includes("/pan")) {
            upstreamRes = generateMockPanResponse(body.pan_number || body.pan);
          } else if (endpointPath.includes("/bank-verify") || endpointPath.includes("/bank")) {
            upstreamRes = generateMockBankResponse(
              body.account_number || body.accountNumber || body.account,
              body.ifsc_code || body.ifsc,
              body.beneficiary_name || body.beneficiaryName || body.name
            );
          } else if (endpointPath.includes("/gstin-verify") || endpointPath.includes("/gstin")) {
            upstreamRes = generateMockGstinResponse(body.gstin || body.gstNumber || body.gst);
          } else {
            upstreamRes = { status: "SUCCESS", data: { verified: true, message: "Sandbox simulation passed" } };
          }
          providerOrderId = `${provider.code}_MOCK_${Date.now()}`;
        }

        if (upstreamRes) {
          responseData = upstreamRes.data || upstreamRes;
          status = upstreamRes.status === "FAILED" ? "FAILED" : "SUCCESS";
          providerSuccess = true;
          break; // Provider succeeded!
        }
      } catch (err) {
        console.warn(`Mapping failed for provider ${mapping.provider.name}:`, err);
      }
    }

    if (!providerSuccess) {
      status = "FAILED";
      responseStatus = 502;
      responseData = null;
    }
  }

  const latencyMs = Date.now() - startTime;

  // 7. Atomic Wallet Settlement (only for live production keys on success)
  if (client.keyType === "PRODUCTION" && status === "SUCCESS" && client.walletId) {
    const deduction = await deductWalletForApiHit(
      client.walletId,
      sellPrice,
      colladomeOrderId,
      api.name
    );
    if (!deduction.success) {
      console.error(`Failed to deduct wallet for order ${colladomeOrderId}:`, deduction.error);
    }
  }

  // 8. Asynchronous Audit Logging & Specialized Report Generation
  const logPromise = (async () => {
    try {
      const log = await db.apiLog.create({
        data: {
          colladomeOrderId,
          clientOrderId: client.clientOrderId,
          userId: client.userId,
          apiId: api.id,
          providerId: usedProviderId,
          providerOrderId,
          ipAddress: client.clientIp,
          endpointPath,
          httpMethod: method,
          requestHeaders: JSON.stringify({ "x-api-key": "cd_***" }),
          requestBody: JSON.stringify(body),
          responseStatus,
          responseBody: JSON.stringify(responseData),
          status,
          latencyMs,
          costPrice: client.keyType === "PRODUCTION" ? costPrice : 0,
          sellPrice: client.keyType === "PRODUCTION" ? sellPrice : 0,
          marginProfit: client.keyType === "PRODUCTION" ? marginProfit : 0,
        },
      });

      // Specialized PAN Card Report Record
      if (endpointPath.includes("/pan") && responseData) {
        await db.panReport.create({
          data: {
            apiLogId: log.id,
            userId: client.userId,
            panNumber: responseData.pan_number || body.pan_number || "UNKNOWN",
            fullName: responseData.full_name || null,
            category: responseData.category || null,
            status: responseData.status || status,
            panAadhaarLinked: responseData.pan_aadhaar_linked ?? false,
          },
        });
      }

      // Specialized Bank Verification Report Record
      if (endpointPath.includes("/bank-verify") && responseData) {
        await db.bankReport.create({
          data: {
            apiLogId: log.id,
            userId: client.userId,
            accountNumber: responseData.account_number || body.account_number || "UNKNOWN",
            ifscCode: responseData.ifsc_code || body.ifsc_code || "UNKNOWN",
            beneficiaryName: responseData.beneficiary_name || body.beneficiary_name || null,
            nameAtBank: responseData.name_at_bank || null,
            matchPercentage: responseData.name_match_score || null,
            utrNumber: responseData.utr_number || null,
            status: responseData.status || status,
          },
        });
      }

      // Asynchronous Webhook Event Dispatch
      if (client.webhookUrl) {
        const eventName = endpointPath.includes("/pan")
          ? "identity.pan.verified"
          : endpointPath.includes("/bank-verify")
          ? "banking.penny_drop.completed"
          : endpointPath.includes("/gstin-verify")
          ? "business.gstin.verified"
          : "verification.completed";

        dispatchWebhook(
          client.webhookUrl,
          client.webhookSecret,
          eventName,
          {
            order_id: colladomeOrderId,
            client_order_id: client.clientOrderId,
            endpoint: endpointPath,
            status,
            data: responseData,
            completed_at: new Date().toISOString(),
          }
        ).catch((err) => console.warn("Background webhook dispatch failed:", err));
      }
    } catch (logErr) {
      console.error("Error writing gateway log:", logErr);
    }
  })();

  // Do not block client response on background logging
  logPromise.catch(() => {});

  // 9. Return Standardized Colladome Gateway Response
  const gatewayResponse: GatewayResponse = {
    status,
    colladome_order_id: colladomeOrderId,
    client_order_id: client.clientOrderId,
    timestamp: new Date().toISOString(),
    data: responseData,
    error:
      status === "SUCCESS"
        ? null
        : {
            code: "UPSTREAM_VERIFICATION_FAILED",
            message: "The requested identity verification could not be completed with the provider.",
          },
  };

  return NextResponse.json(gatewayResponse, {
    status: responseStatus,
    headers: {
      "x-ratelimit-limit": String(rateLimit.limit),
      "x-ratelimit-remaining": String(rateLimit.remaining),
    },
  });
}
