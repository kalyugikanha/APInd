import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, AuthenticatedClient } from "@/lib/gateway/auth";
import { deductWalletForApiHit, deductWalletForSetupFee } from "@/lib/gateway/wallet";
import { generateOrderId, decrypt } from "@/lib/crypto";
import { generateEkoHeaders } from "@/lib/gateway/eko";
import {
  generateMockPanResponse,
  generateMockBankResponse,
  generateMockGstinResponse,
  generateMockIfscResponse,
} from "@/lib/gateway/mockProviders";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";
import { checkRateLimit } from "@/lib/gateway/rateLimiter";

export async function handleGatewayRequest(
  req: NextRequest,
  endpointPath: string,
  method: string = "POST"
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestTimestamp = new Date(startTime).toISOString();

  // Normalize path (strip trailing slashes and optional leading /api prefix)
  const normalizedPath = endpointPath.replace(/\/+$/, "") || "/";
  const strippedApiPath = normalizedPath.replace(/^\/api(?=\/)/, "");

  // 1. Authenticate Request (Checks Base URL query ?api_key=... and headers)
  const auth = await authenticateApiRequest(req);
  if (auth.error) {
    const errorOrderId = generateOrderId("CDO");
    return NextResponse.json(
      {
        success: false,
        response_code: auth.error.response_code || "101",
        response_message: auth.error.message,
        colladome_order_id: errorOrderId,
        client_order_id: null,
        result: null,
        status: "ERROR",
        data: null,
        error: auth.error,
        request_timestamp: requestTimestamp,
        response_timestamp: new Date().toISOString(),
      },
      { status: auth.error.status }
    );
  }

  const client: AuthenticatedClient = auth.client!;
  const colladomeOrderId = generateOrderId("CDO");

  // 1.1 Enforce Sliding-Window Rate Limit (RPM Throttling)
  const rateLimit = checkRateLimit(client.keyId, client.rateLimitRpm || 120);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        response_code: "429",
        response_message: `Rate limit exceeded. Maximum ${rateLimit.limit} RPM allowed. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        colladome_order_id: colladomeOrderId,
        client_order_id: client.clientOrderId,
        result: null,
        status: "ERROR",
        data: null,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Rate limit of ${rateLimit.limit} RPM exceeded.`,
        },
        request_timestamp: requestTimestamp,
        response_timestamp: new Date().toISOString(),
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

  // 2. Parse Body & Query Params
  let body: any = {};
  try {
    if (method !== "GET") {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  // Extract client order/task ID from body or headers or query params
  const clientTaskId =
    body.task_id ||
    body.client_order_id ||
    client.clientOrderId ||
    req.nextUrl?.searchParams?.get("task_id") ||
    req.nextUrl?.searchParams?.get("client_order_id") ||
    null;

  // 3. Find API in Catalog dynamically (supports /:service/v1, /v1/..., /api/...)
  const isIfscPath =
    normalizedPath.includes("ifsc") ||
    strippedApiPath === "/ifsc-verification/v1" ||
    strippedApiPath === "/v1/utility/ifsc";

  const isPanAdvancedPath =
    normalizedPath.includes("pan-advanced") ||
    strippedApiPath === "/pan-advanced/v1" ||
    strippedApiPath === "/v1/identity/pan-advanced";

  const isBankPennylessPath =
    normalizedPath.includes("bank-pennyless") ||
    strippedApiPath === "/bank-pennyless/v1" ||
    strippedApiPath === "/v1/banking/pennyless";

  const isPanPath =
    !isPanAdvancedPath &&
    (normalizedPath.includes("pan") ||
      strippedApiPath === "/pan-verification/v1" ||
      strippedApiPath === "/pan-fetch/v1" ||
      strippedApiPath === "/v1/verification/pan");

  const candidatePaths = Array.from(
    new Set([
      normalizedPath,
      `${normalizedPath}/`,
      strippedApiPath,
      `${strippedApiPath}/`,
      ...(isIfscPath ? ["/ifsc-verification/v1", "/v1/utility/ifsc"] : []),
      ...(isPanAdvancedPath ? ["/pan-advanced/v1", "/v1/identity/pan-advanced"] : []),
      ...(isBankPennylessPath ? ["/bank-pennyless/v1", "/v1/banking/pennyless"] : []),
      ...(isPanPath ? ["/pan-verification/v1", "/pan-fetch/v1", "/v1/verification/pan"] : []),
    ])
  );

  const api = await db.api.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { endpointPath: { in: candidatePaths } },
        ...(isIfscPath ? [{ slug: "ifsc-verification" }] : []),
        ...(isPanAdvancedPath ? [{ slug: "pan-advanced" }] : []),
        ...(isBankPennylessPath ? [{ slug: "bank-pennyless" }] : []),
        ...(isPanPath ? [{ slug: "pan-detailed-verification" }, { slug: "pan-fetch" }] : []),
      ],
    },
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
        success: false,
        response_code: "404",
        response_message: `The endpoint '${normalizedPath}' does not exist or is currently inactive.`,
        colladome_order_id: colladomeOrderId,
        client_order_id: clientTaskId,
        result: null,
        status: "ERROR",
        data: null,
        error: {
          code: "API_NOT_FOUND",
          message: `The endpoint '${normalizedPath}' does not exist or is currently inactive.`,
        },
        request_timestamp: requestTimestamp,
        response_timestamp: new Date().toISOString(),
      },
      { status: 404 }
    );
  }

  // 4. Extract Morphed Payload Fields & Validate Core Formats
  const rawData = body.data && typeof body.data === "object" ? body.data : body;
  const consent = rawData.consent || body.consent || req.nextUrl?.searchParams?.get("consent") || "Y";
  const consentText =
    rawData.consent_text ||
    body.consent_text ||
    "I hear by declare my consent agreement for fetching my information via Colladome API";

  let cleanIfsc = "";
  if (isIfscPath) {
    const rawIfsc = rawData.ifsc || body.ifsc || req.nextUrl?.searchParams?.get("ifsc");
    if (!rawIfsc || typeof rawIfsc !== "string" || rawIfsc.trim().length !== 11) {
      return NextResponse.json(
        {
          success: false,
          response_code: "104",
          response_message:
            "Invalid IFSC Code. IFSC must be an 11-character alphanumeric code (e.g. THRS0000XXX, SBIN0000001, HDFC0000012).",
          colladome_order_id: colladomeOrderId,
          client_order_id: clientTaskId,
          result: null,
          status: "FAILED",
          data: null,
          error: {
            code: "VALIDATION_INVALID_IFSC",
            message: "Invalid IFSC Code. IFSC must be an 11-character alphanumeric code.",
          },
          request_timestamp: requestTimestamp,
          response_timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    cleanIfsc = rawIfsc.trim().toUpperCase();
  }

  let cleanPan = "";
  if (isPanPath) {
    const rawPan =
      rawData.pan_number ||
      rawData.customer_pan_number ||
      rawData.pan ||
      rawData.pan_no ||
      body.pan_number ||
      body.customer_pan_number ||
      body.pan ||
      body.pan_no ||
      req.nextUrl?.searchParams?.get("pan_number") ||
      req.nextUrl?.searchParams?.get("pan");

    if (rawPan && typeof rawPan === "string") {
      cleanPan = rawPan.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    }

    if (cleanPan && cleanPan.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          response_code: "104",
          response_message:
            "Invalid PAN Number. PAN must be a 10-character alphanumeric code (e.g. ABCDE1234F).",
          colladome_order_id: colladomeOrderId,
          client_order_id: clientTaskId,
          result: null,
          status: "FAILED",
          data: null,
          error: {
            code: "VALIDATION_INVALID_PAN",
            message: "Invalid PAN Number. PAN must be a 10-character alphanumeric code.",
          },
          request_timestamp: requestTimestamp,
          response_timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  }

  // 5. Calculate Rate / Surcharge & Setup Fee for this Client
  const clientRule = client.clientPricing?.get(api.id);
  const customPrice = clientRule?.customPrice ?? client.pricingRules.get(api.id);
  const sellPrice = customPrice !== undefined ? customPrice : api.defaultSellPrice;
  const costPrice = api.defaultCostPrice;
  const marginProfit = Number((sellPrice - costPrice).toFixed(2));

  // Determine One-Time Setup Fee
  const customSetupFee = clientRule?.customSetupFee;
  const setupFee =
    customSetupFee !== null && customSetupFee !== undefined
      ? customSetupFee
      : (api.defaultSetupFee || 0);
  const isSetupFeePaid = clientRule ? clientRule.isSetupFeePaid : false;
  const needsSetupFeePayment = client.keyType === "PRODUCTION" && setupFee > 0 && !isSetupFeePaid;
  const totalRequiredBalance = Number((sellPrice + (needsSetupFeePayment ? setupFee : 0)).toFixed(2));

  // 6. Check Wallet Balance (Only for PRODUCTION keys)
  if (client.keyType === "PRODUCTION") {
    if (!client.walletId || client.walletBalance < totalRequiredBalance) {
      const msg = needsSetupFeePayment
        ? `Insufficient wallet balance. Required: ₹${totalRequiredBalance.toFixed(2)} (API Hit: ₹${sellPrice.toFixed(2)} + One-Time API Setup Fee: ₹${setupFee.toFixed(2)}), Available: ₹${client.walletBalance.toFixed(2)}. Please recharge your wallet at dashboard.colladome.com.`
        : `Insufficient wallet balance. Required: ₹${sellPrice.toFixed(2)}, Available: ₹${client.walletBalance.toFixed(2)}. Please recharge your wallet at dashboard.colladome.com.`;

      return NextResponse.json(
        {
          success: false,
          response_code: "103",
          response_message: msg,
          colladome_order_id: colladomeOrderId,
          client_order_id: clientTaskId,
          result: null,
          status: "FAILED",
          data: null,
          error: {
            code: "BILLING_INSUFFICIENT_WALLET_BALANCE",
            message: msg,
          },
          request_timestamp: requestTimestamp,
          response_timestamp: new Date().toISOString(),
        },
        { status: 402 }
      );
    }
  }

  // 6.1 Smart DB Cache & Deduplication Engine (<15ms response, ₹0 Upstream Cost, 100% Margin)
  let isCachedHit = false;
  let responseData: any = null;
  let rawUpstreamResponse: any = null;
  let responseStatus = 200;
  let status: "SUCCESS" | "FAILED" | "TIMEOUT" = "SUCCESS";
  let responseCode = "100";
  let responseMessage = "Valid Authentication";
  let usedProviderId: string | null = api.providerMappings[0]?.providerId || null;
  let providerOrderId: string | null = null;
  let upstreamAttemptedAndHandled = false;

  if (isIfscPath && cleanIfsc) {
    try {
      const existingRecord = await db.bankReport.findFirst({
        where: {
          ifscCode: cleanIfsc,
          status: "VERIFIED",
          accountNumber: "IFSC_LOOKUP",
        },
        include: {
          apiLog: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingRecord && existingRecord.apiLog) {
        let cachedData: any = null;
        try {
          const parsed = JSON.parse(existingRecord.apiLog.responseBody || "{}");
          cachedData = parsed?.result || parsed?.data || parsed;
        } catch {}

        if (cachedData && (cachedData.ifsc || cachedData.bank)) {
          responseData = cachedData;
          status = "SUCCESS";
          responseCode = "100";
          responseMessage = "Valid Authentication";
          responseStatus = 200;
          providerOrderId = `CDO_CACHE_${existingRecord.id.slice(0, 8).toUpperCase()}`;
          usedProviderId = existingRecord.apiLog.providerId;
          upstreamAttemptedAndHandled = true;
          isCachedHit = true;
        }
      }
    } catch (cacheErr: any) {
      console.warn("DB Cache lookup failed, proceeding to live provider:", cacheErr?.message);
    }
  }

  if (!isCachedHit && isPanPath && cleanPan && cleanPan.length === 10) {
    try {
      const existingPanRecord = await db.panReport.findFirst({
        where: {
          panNumber: cleanPan,
          status: { in: ["VALID", "VERIFIED", "SUCCESS"] },
        },
        include: {
          apiLog: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingPanRecord && existingPanRecord.fullName) {
        responseData = {
          pan_number: existingPanRecord.panNumber,
          full_name: existingPanRecord.fullName,
          category: existingPanRecord.category || "Individual",
          status: "VALID",
          pan_aadhaar_linked: existingPanRecord.panAadhaarLinked,
          cached: true,
          verification_date: existingPanRecord.createdAt.toISOString(),
        };
        status = "SUCCESS";
        responseCode = "100";
        responseMessage = "Valid Authentication";
        responseStatus = 200;
        providerOrderId = `CDO_CACHE_${existingPanRecord.id.slice(0, 8).toUpperCase()}`;
        usedProviderId = existingPanRecord.apiLog?.providerId || null;
        upstreamAttemptedAndHandled = true;
        isCachedHit = true;
      }
    } catch (cacheErr: any) {
      console.warn("PAN DB cache lookup failed, proceeding to live provider:", cacheErr?.message);
    }
  }

  // 7. Universal Multi-Provider Morpher Execution (with Primary -> Secondary Failover)
  if (!isCachedHit && client.keyType === "PRODUCTION" && api.providerMappings.length > 0) {
    for (const mapping of api.providerMappings) {
      const provider = mapping.provider;
      if (!provider || !provider.isActive) continue;

      const isEkoProvider = provider.code === "EK" || provider.code === "EKO" || provider.authType === "EKO_HMAC";
      const isZoopProvider = provider.code === "ZO" || provider.code === "ZOOP";

      let appId = isZoopProvider ? process.env.ZOOP_APP_ID || "" : "";
      let apiKey = isZoopProvider ? process.env.ZOOP_API_KEY || "" : "";
      let baseUrl =
        isZoopProvider
          ? process.env.ZOOP_BASE_URL || provider.baseUrl || "https://test.zoop.one"
          : provider.baseUrl || "";
      let isSimulation = false;
      let extraHeaders: Record<string, string> = {};

      let developerKey = process.env.EKO_DEVELOPER_KEY || "";
      let accessKey = process.env.EKO_ACCESS_KEY || "";
      let initiatorId = process.env.EKO_INITIATOR_ID || "9999999999";

      try {
        const decryptedCreds = JSON.parse(decrypt(provider.credentialsEnc) || "{}");
        if (!appId && decryptedCreds.appId) appId = decryptedCreds.appId;
        if (!apiKey && decryptedCreds.apiKey) apiKey = decryptedCreds.apiKey;
        if (decryptedCreds.baseUrl) baseUrl = decryptedCreds.baseUrl;
        if (decryptedCreds.isSimulation) isSimulation = true;
        if (decryptedCreds.headers && typeof decryptedCreds.headers === "object") {
          extraHeaders = decryptedCreds.headers;
        }

        if (isEkoProvider) {
          if (decryptedCreds.developerKey) developerKey = decryptedCreds.developerKey;
          if (decryptedCreds.developer_key) developerKey = decryptedCreds.developer_key;
          if (decryptedCreds.apiKey && !developerKey) developerKey = decryptedCreds.apiKey;

          if (decryptedCreds.accessKey) accessKey = decryptedCreds.accessKey;
          if (decryptedCreds.access_key) accessKey = decryptedCreds.access_key;
          if (decryptedCreds.apiSecret && !accessKey) accessKey = decryptedCreds.apiSecret;

          if (decryptedCreds.initiatorId) initiatorId = decryptedCreds.initiatorId;
          if (decryptedCreds.initiator_id) initiatorId = decryptedCreds.initiator_id;
          if (decryptedCreds.appId && (!initiatorId || initiatorId === "9999999999")) initiatorId = decryptedCreds.appId;
        }
      } catch {}

      if (isSimulation) {
        continue;
      }

      if (isEkoProvider && (!developerKey || !accessKey)) {
        continue;
      }

      if (!isEkoProvider && !apiKey) {
        continue;
      }

      usedProviderId = provider.id;
      const endpointPart =
        mapping.providerEndpoint ||
        (isIfscPath ? "/api/v1/in/utility/ifsc/lite" : strippedApiPath);

      // Automatic URL sanitization to prevent duplicate /api/v1 prefix
      let cleanBase = baseUrl.replace(/\/+$/, "");
      let cleanEndpoint = endpointPart.replace(/^\/+/, "");
      if (cleanBase.endsWith("/api/v1") && cleanEndpoint.startsWith("api/v1/")) {
        cleanEndpoint = cleanEndpoint.replace(/^api\/v1\//, "");
      }
      const targetUrl = endpointPart.startsWith("http")
        ? endpointPart
        : `${cleanBase}/${cleanEndpoint}`;

      // Morph Colladome consent_text -> upstream provider consent_text (e.g. via ZOOP API)
      const morphedConsentText = consentText.replace(/via Colladome API/gi, "via ZOOP API");
      let upstreamPayload: any = {
        mode: body.mode || "sync",
        data: {
          ...rawData,
          ...(isIfscPath ? { ifsc: cleanIfsc } : {}),
          consent,
          consent_text: morphedConsentText,
        },
        task_id: colladomeOrderId,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...extraHeaders,
      };

      if (isEkoProvider) {
        const ekoHeaders = generateEkoHeaders(developerKey, accessKey);
        Object.assign(headers, ekoHeaders);

        if (isPanAdvancedPath || endpointPart.includes("pan-advanced")) {
          upstreamPayload = {
            initiator_id: initiatorId,
            client_ref_id: colladomeOrderId,
            pan_number: cleanPan || rawData.customer_pan_number || rawData.pan_number || rawData.pan,
            name: rawData.name || rawData.registered_name || rawData.customer_name || "Individual",
          };
        } else if (isBankPennylessPath || endpointPart.includes("bank-acc-verify-pennyless")) {
          const accNumber = String(
            rawData.account_number ||
              rawData.account ||
              rawData.bank_account_number ||
              body.account_number ||
              body.account ||
              ""
          ).trim();
          upstreamPayload = {
            initiator_id: initiatorId,
            client_ref_id: colladomeOrderId,
            account: accNumber,
            ifsc: cleanIfsc || rawData.ifsc || rawData.ifsc_code || body.ifsc,
          };
        } else if (isPanPath || endpointPart.includes("fetch-pan")) {
          upstreamPayload = {
            initiator_id: initiatorId,
            client_ref_id: colladomeOrderId,
            pan_number: cleanPan || rawData.customer_pan_number || rawData.pan_number || rawData.pan,
            source: "API",
          };
        }
      } else if (isZoopProvider) {
        if (appId) headers["app-id"] = appId;
        headers["api-key"] = apiKey;
      } else if (provider.authType === "BEARER_TOKEN") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else {
        headers["api-key"] = apiKey;
        headers["x-api-key"] = apiKey;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const rawRes = await fetch(targetUrl, {
          method: mapping.providerMethod || method || "POST",
          headers,
          body: (mapping.providerMethod || method) === "GET" ? undefined : JSON.stringify(upstreamPayload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        rawUpstreamResponse = await rawRes.json();
        providerOrderId =
          rawUpstreamResponse?.task_id ||
          rawUpstreamResponse?.request_id ||
          rawUpstreamResponse?.data?.upstream_rrn ||
          `${provider.code}_LIVE_${Date.now()}`;

        if (isEkoProvider) {
          const isEkoSuccess =
            rawRes.ok &&
            (rawUpstreamResponse?.status === 0 ||
              rawUpstreamResponse?.status === "0" ||
              rawUpstreamResponse?.response_type_id === 0);

          if (isEkoSuccess && rawUpstreamResponse?.data) {
            if (isPanAdvancedPath || endpointPart.includes("pan-advanced")) {
              responseData = {
                pan_number: rawUpstreamResponse.data.pan || cleanPan,
                registered_name: rawUpstreamResponse.data.registered_name || rawUpstreamResponse.data.name_provided,
                name_on_card: rawUpstreamResponse.data.name_pan_card || rawUpstreamResponse.data.registered_name,
                first_name: rawUpstreamResponse.data.first_name,
                last_name: rawUpstreamResponse.data.last_name,
                category: rawUpstreamResponse.data.type || "Individual",
                gender: rawUpstreamResponse.data.gender,
                date_of_birth: rawUpstreamResponse.data.date_of_birth,
                masked_aadhaar: rawUpstreamResponse.data.masked_aadhaar_number,
                aadhaar_linked: rawUpstreamResponse.data.aadhaar_linked,
                email: rawUpstreamResponse.data.email,
                mobile_number: rawUpstreamResponse.data.mobile_number,
                address: rawUpstreamResponse.data.address,
                status: "VALID",
              };
            } else if (isBankPennylessPath || endpointPart.includes("bank-acc-verify-pennyless")) {
              responseData = {
                bank_account_no: rawUpstreamResponse.data.bank_account_no,
                bank_ifsc: rawUpstreamResponse.data.bank_ifsc,
                verified_beneficiary_name: rawUpstreamResponse.data.verified_beneficiary_name,
                status: "VERIFIED",
                account_active: true,
              };
            } else {
              responseData = {
                pan_number: rawUpstreamResponse.data.pan_no || cleanPan,
                full_name: rawUpstreamResponse.data.fullname,
                category: rawUpstreamResponse.data.category || "Individual",
                status: rawUpstreamResponse.data.status || "VALID",
                upstream_rrn: rawUpstreamResponse.data.upstream_rrn || null,
              };
            }
            responseCode = "100";
            responseMessage = rawUpstreamResponse.message || "Valid Authentication";
            status = "SUCCESS";
            responseStatus = 200;
            upstreamAttemptedAndHandled = true;
            break;
          } else if (rawRes.status >= 400 && rawRes.status < 500) {
            status = "FAILED";
            responseCode = "104";
            responseMessage = rawUpstreamResponse?.message || "Upstream PAN verification failed";
            responseStatus = rawRes.status;
            responseData = null;
            upstreamAttemptedAndHandled = true;
            break;
          }
        } else {
          const isUpstreamSuccess =
            rawRes.ok &&
            (rawUpstreamResponse?.success === true ||
              rawUpstreamResponse?.response_code === "100" ||
              rawUpstreamResponse?.status === "SUCCESS");

          if (isUpstreamSuccess) {
            responseData =
              rawUpstreamResponse.result ??
              rawUpstreamResponse.data ??
              rawUpstreamResponse;
            responseCode = "100";
            responseMessage = rawUpstreamResponse.response_message || "Valid Authentication";
            status = "SUCCESS";
            responseStatus = 200;
            upstreamAttemptedAndHandled = true;
            break;
          } else if (rawRes.status >= 400 && rawRes.status < 500) {
            // 4xx validation or upstream client error — do not failover
            status = "FAILED";
            responseCode = rawUpstreamResponse?.response_code || "104";
            responseMessage =
              rawUpstreamResponse?.response_message ||
              rawUpstreamResponse?.message ||
              "Upstream validation failed";
            responseStatus = rawRes.status;
            responseData = null;
            upstreamAttemptedAndHandled = true;
            break;
          }
        }
        // On 5xx error, loop continues to next priority provider mapping (Failover)
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        console.warn(`Upstream provider ${provider.name} fetch failed or timed out:`, fetchErr.message);
        // Continue to next priority provider mapping if available
      }
    }
  }

  // 7.1 Deterministic Simulation / Sandbox Morpher Fallback
  if (!upstreamAttemptedAndHandled) {
    const panInput =
      cleanPan ||
      rawData.customer_pan_number ||
      rawData.pan_number ||
      rawData.pan ||
      rawData.pan_no ||
      body.pan_number ||
      body.customer_pan_number ||
      body.pan ||
      body.pan_no ||
      req.nextUrl?.searchParams?.get("pan_number") ||
      req.nextUrl?.searchParams?.get("pan");
    const accInput = rawData.bank_account_number || rawData.account_number;
    const ifscInput = rawData.bank_ifsc_code || rawData.ifsc_code || rawData.ifsc;
    const benNameInput = rawData.beneficiary_name;
    const gstInput = rawData.business_gstin_number || rawData.gstin;

    if (isIfscPath) {
      const mock = generateMockIfscResponse(cleanIfsc);
      if (mock.status === "SUCCESS") {
        responseData = mock.result;
        status = "SUCCESS";
        responseCode = "100";
        responseMessage = "Valid Authentication";
        responseStatus = 200;
      } else {
        status = "FAILED";
        responseCode = mock.response_code || "104";
        responseMessage = mock.response_message || "Invalid IFSC format";
        responseStatus = 400;
      }
      providerOrderId = `PROV_SIM_${Date.now()}`;
      rawUpstreamResponse = {
        ...mock,
        task_id: `prov_sim_task_${Date.now()}`,
        group_id: `prov_sim_group_${Date.now()}`,
        request_id: `prov_sim_req_${Date.now()}`,
        metadata: { billable: "Y" },
        response_code: responseCode,
        response_message: responseMessage,
        request_timestamp: requestTimestamp,
        response_timestamp: new Date().toISOString(),
      };
    } else if (isPanAdvancedPath) {
      responseData = {
        pan_number: cleanPan || "ABCDE1234F",
        registered_name: rawData.name || "RAJESH KUMAR",
        name_on_card: rawData.name || "RAJESH KUMAR",
        first_name: "RAJESH",
        last_name: "KUMAR",
        category: "Individual",
        gender: "M",
        date_of_birth: "1994-08-29",
        masked_aadhaar: "XXXX XXXX 1234",
        aadhaar_linked: true,
        email: "ra******ar@example.com",
        mobile_number: "98******10",
        address: {
          full_address: "Woodland Heights, Ghatkopar, Mumbai, Maharashtra 400072",
          street: "Woodland Heights, Ghatkopar",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: 400072,
          country: "India",
        },
        status: "VALID",
      };
      status = "SUCCESS";
      responseCode = "100";
      responseMessage = "Valid Authentication";
      responseStatus = 200;
      providerOrderId = `PROV_PAN_ADV_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: true,
        response_code: "100",
        response_message: "Valid Authentication",
      };
    } else if (isBankPennylessPath) {
      const accNumber = String(rawData.account_number || rawData.account || "38759149196");
      responseData = {
        bank_account_no: accNumber,
        bank_ifsc: cleanIfsc || rawData.ifsc || "SBIN0007515",
        verified_beneficiary_name: rawData.beneficiary_name || "Master YASHWANT BASNETT",
        status: "VERIFIED",
        account_active: true,
      };
      status = "SUCCESS";
      responseCode = "100";
      responseMessage = "Valid Authentication";
      responseStatus = 200;
      providerOrderId = `PROV_BAV_PENNY_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: true,
        response_code: "100",
        response_message: "Valid Authentication",
      };
    } else if (strippedApiPath.includes("pan")) {
      const mock = generateMockPanResponse(panInput);
      responseData = mock.data;
      status = mock.status as any;
      responseCode = status === "SUCCESS" ? "100" : "104";
      responseMessage =
        status === "SUCCESS" ? "Valid Authentication" : mock.data?.message || "Invalid PAN format";
      responseStatus = status === "SUCCESS" ? 200 : 400;
      providerOrderId = `PROV_PAN_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: status === "SUCCESS",
        task_id: `prov_sim_task_${Date.now()}`,
        group_id: `prov_sim_group_${Date.now()}`,
        request_id: `prov_sim_req_${Date.now()}`,
        metadata: { billable: status === "SUCCESS" ? "Y" : "N" },
        response_code: responseCode,
        response_message: responseMessage,
      };
    } else if (strippedApiPath.includes("bank")) {
      const mock = generateMockBankResponse(accInput, ifscInput, benNameInput);
      responseData = mock.data;
      status = mock.status as any;
      responseCode = status === "SUCCESS" ? "100" : "104";
      responseMessage =
        status === "SUCCESS"
          ? "Valid Authentication"
          : mock.data?.message || "Invalid Bank/IFSC details";
      responseStatus = status === "SUCCESS" ? 200 : 400;
      providerOrderId = `PROV_BANK_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: status === "SUCCESS",
        task_id: `prov_sim_task_${Date.now()}`,
        group_id: `prov_sim_group_${Date.now()}`,
        request_id: `prov_sim_req_${Date.now()}`,
        metadata: { billable: status === "SUCCESS" ? "Y" : "N" },
        response_code: responseCode,
        response_message: responseMessage,
      };
    } else if (strippedApiPath.includes("gst")) {
      const mock = generateMockGstinResponse(gstInput);
      responseData = mock.data;
      status = mock.status as any;
      responseCode = status === "SUCCESS" ? "100" : "104";
      responseMessage =
        status === "SUCCESS" ? "Valid Authentication" : mock.data?.message || "Invalid GSTIN format";
      responseStatus = status === "SUCCESS" ? 200 : 400;
      providerOrderId = `PROV_GST_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: status === "SUCCESS",
        task_id: `prov_sim_task_${Date.now()}`,
        group_id: `prov_sim_group_${Date.now()}`,
        request_id: `prov_sim_req_${Date.now()}`,
        metadata: { billable: status === "SUCCESS" ? "Y" : "N" },
        response_code: responseCode,
        response_message: responseMessage,
      };
    } else {
      // Dynamic Schema-Driven Simulation for any custom API pasted via Admin Studio
      let schemaResult: any = {
        verified: true,
        message: "Verified successfully",
      };
      try {
        const parsedRespSchema = JSON.parse(api.responseSchema || "{}");
        if (parsedRespSchema.result && typeof parsedRespSchema.result === "object") {
          schemaResult = { ...parsedRespSchema.result };
        } else if (parsedRespSchema.data && typeof parsedRespSchema.data === "object") {
          schemaResult = { ...parsedRespSchema.data };
        }
      } catch {}

      // Overlay non-consent input fields onto the simulated result for realism
      Object.keys(rawData || {}).forEach((k) => {
        if (k !== "consent" && k !== "consent_text" && k !== "mode" && k !== "task_id") {
          schemaResult[k] = rawData[k];
        }
      });

      status = "SUCCESS";
      responseCode = "100";
      responseMessage = "Valid Authentication";
      responseStatus = 200;
      responseData = schemaResult;
      providerOrderId = `PROV_CUSTOM_${Date.now()}`;
      rawUpstreamResponse = {
        result: responseData,
        success: true,
        task_id: `prov_sim_task_${Date.now()}`,
        group_id: `prov_sim_group_${Date.now()}`,
        request_id: `prov_sim_req_${Date.now()}`,
        metadata: { billable: "Y" },
        response_code: "100",
        response_message: "Valid Authentication",
      };
    }
  }

  const latencyMs = Date.now() - startTime;

  // 8. Atomic Wallet Settlement (only for live production keys on success)
  if (client.keyType === "PRODUCTION" && status === "SUCCESS" && client.walletId) {
    if (needsSetupFeePayment) {
      const setupDeduction = await deductWalletForSetupFee(
        client.walletId,
        client.userId,
        api.id,
        api.name,
        setupFee,
        clientRule?.id,
        sellPrice
      );
      if (!setupDeduction.success) {
        console.error(`Failed to deduct setup fee for API ${api.name}:`, setupDeduction.error);
      }
    }

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

  // 9. Asynchronous Internal Audit Logging & Report Generation
  // Upstream raw vendor IDs (task_id, group_id, request_id, metadata) are stored strictly inside db.apiLog
  const logPromise = (async () => {
    try {
      const log = await db.apiLog.create({
        data: {
          colladomeOrderId,
          clientOrderId: clientTaskId,
          userId: client.userId,
          apiId: api.id,
          providerId: usedProviderId,
          providerOrderId, // Raw upstream task_id / request_id
          ipAddress: client.clientIp,
          endpointPath: strippedApiPath,
          httpMethod: method,
          requestHeaders: JSON.stringify({
            "x-api-key": "cd_***",
            "client-ip": client.clientIp,
          }),
          requestBody: JSON.stringify(body),
          responseStatus,
          responseBody: JSON.stringify(rawUpstreamResponse || responseData), // Full raw upstream logs
          status,
          latencyMs,
          costPrice: client.keyType === "PRODUCTION" ? (isCachedHit ? 0 : costPrice) : 0,
          sellPrice: client.keyType === "PRODUCTION" ? sellPrice : 0,
          marginProfit:
            client.keyType === "PRODUCTION"
              ? isCachedHit
                ? sellPrice
                : marginProfit
              : 0,
        },
      });

      // Record Bank & IFSC Verification Report for Admin & Client Portals
      if (isIfscPath && responseData) {
        await db.bankReport.create({
          data: {
            apiLogId: log.id,
            userId: client.userId,
            accountNumber: "IFSC_LOOKUP",
            ifscCode: responseData.ifsc || cleanIfsc,
            beneficiaryName: `${responseData.branch || ""} (${responseData.city || ""}, ${responseData.state || ""})`.trim(),
            nameAtBank: responseData.bank || null,
            matchPercentage: 100.0,
            utrNumber: responseData.micr ? `MICR:${responseData.micr}` : null,
            status: status === "SUCCESS" ? "VERIFIED" : "FAILED",
          },
        });
      } else if (strippedApiPath.includes("bank") && responseData) {
        await db.bankReport.create({
          data: {
            apiLogId: log.id,
            userId: client.userId,
            accountNumber: responseData.account_number || responseData.bank_account_number || "UNKNOWN",
            ifscCode: responseData.ifsc_code || responseData.ifsc || "UNKNOWN",
            beneficiaryName: responseData.beneficiary_name || responseData.user_full_name || null,
            nameAtBank: responseData.name_at_bank || responseData.bank_name || null,
            matchPercentage: responseData.name_match_score || 100.0,
            utrNumber: responseData.utr_number || responseData.rrn || null,
            status: responseData.status || (status === "SUCCESS" ? "VERIFIED" : "FAILED"),
          },
        });
      } else if ((isPanPath || strippedApiPath.includes("pan")) && responseData) {
        await db.panReport.create({
          data: {
            apiLogId: log.id,
            userId: client.userId,
            panNumber:
              responseData.pan_number ||
              responseData.pan_no ||
              cleanPan ||
              responseData.customer_pan_number ||
              rawData.customer_pan_number ||
              rawData.pan_number ||
              "UNKNOWN",
            fullName:
              responseData.full_name ||
              responseData.fullname ||
              responseData.user_full_name ||
              responseData.name_on_card ||
              null,
            category: responseData.category || responseData.pan_type || "Individual",
            status: responseData.status || status,
            panAadhaarLinked: Boolean(
              responseData.pan_aadhaar_linked ?? responseData.aadhaar_seeding_status === "Y"
            ),
          },
        });
      }

      // Optional Webhook Event Dispatch
      if (client.webhookUrl) {
        dispatchWebhook(
          client.webhookUrl,
          client.webhookSecret,
          isIfscPath ? "utility.ifsc.verified" : "verification.completed",
          {
            order_id: colladomeOrderId,
            client_order_id: clientTaskId,
            endpoint: strippedApiPath,
            status,
            data: responseData,
            completed_at: new Date().toISOString(),
          }
        ).catch(() => {});
      }
    } catch (logErr) {
      console.error("Error writing gateway log:", logErr);
    }
  })();

  logPromise.catch(() => {});

  // 10. Return Sanitized & Morphed Colladome Response
  // Client only receives Colladome's client_order_id, colladome_order_id, response_code, and result
  const responseTimestamp = new Date().toISOString();

  if (status === "SUCCESS") {
    return NextResponse.json(
      {
        success: true,
        response_code: "100",
        response_message: responseMessage,
        colladome_order_id: colladomeOrderId,
        client_order_id: clientTaskId,
        result: responseData,
        // Compatibility mirrors
        status: "SUCCESS",
        data: responseData,
        request_timestamp: requestTimestamp,
        response_timestamp: responseTimestamp,
      },
      {
        status: 200,
        headers: {
          "x-ratelimit-limit": String(rateLimit.limit),
          "x-ratelimit-remaining": String(rateLimit.remaining),
        },
      }
    );
  } else {
    return NextResponse.json(
      {
        success: false,
        response_code: responseCode,
        response_message: responseMessage,
        colladome_order_id: colladomeOrderId,
        client_order_id: clientTaskId,
        result: null,
        status: "FAILED",
        data: null,
        error: {
          code:
            responseCode === "104"
              ? isIfscPath
                ? "VALIDATION_INVALID_IFSC"
                : "VALIDATION_INVALID_INPUT"
              : responseCode === "103"
              ? "BILLING_INSUFFICIENT_WALLET_BALANCE"
              : "PROVIDER_UPSTREAM_ERROR",
          message: responseMessage,
        },
        request_timestamp: requestTimestamp,
        response_timestamp: responseTimestamp,
      },
      {
        status: responseStatus,
        headers: {
          "x-ratelimit-limit": String(rateLimit.limit),
          "x-ratelimit-remaining": String(rateLimit.remaining),
        },
      }
    );
  }
}
