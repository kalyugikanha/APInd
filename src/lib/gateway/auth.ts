import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";

export interface ClientApiPricing {
  id: string;
  customPrice: number;
  customSetupFee: number | null;
  isSetupFeePaid: boolean;
}

export interface AuthenticatedClient {
  userId: string;
  userEmail: string;
  companyName: string | null;
  accountStatus: string;
  keyType: "PRODUCTION" | "SANDBOX";
  keyName: string;
  keyId: string;
  rateLimitRpm: number;
  walletId: string | null;
  walletBalance: number;
  allowedIps: string[];
  pricingRules: Map<string, number>; // apiId -> customPrice
  clientPricing: Map<string, ClientApiPricing>; // apiId -> full pricing detail
  clientOrderId: string | null;
  clientIp: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
}

/**
 * Extract client IP from Next.js request headers
 */
export function extractClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Check if IP is in whitelist (supports exact IP, localhost, and wildcard '*')
 */
export function isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
  if (!allowedIps || allowedIps.length === 0) return true; // If no whitelist configured, allow
  if (allowedIps.includes("*")) return true;
  if (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost") return true;

  return allowedIps.some((allowed) => {
    const cleanAllowed = allowed.trim();
    if (cleanAllowed === clientIp) return true;
    // Basic CIDR prefix check (e.g. 103.21.244.0/24)
    if (cleanAllowed.includes("/")) {
      const [subnet] = cleanAllowed.split("/");
      const subnetBase = subnet.substring(0, subnet.lastIndexOf("."));
      return clientIp.startsWith(subnetBase);
    }
    return false;
  });
}

/**
 * Authenticate incoming API request using x-api-key header and IP whitelisting
 */
export async function authenticateApiRequest(req: NextRequest): Promise<{
  client?: AuthenticatedClient;
  error?: { status: number; code: string; response_code: string; message: string };
}> {
  // 1. Extract API key from Base URL query parameters (primary) or request headers
  const queryApiKey = req.nextUrl?.searchParams?.get("api_key") || req.nextUrl?.searchParams?.get("apiKey");
  const headerApiKey =
    req.headers.get("api-key") ||
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const apiKey = queryApiKey || headerApiKey;

  // 2. Extract Client Order / Task ID
  const clientOrderId =
    req.headers.get("x-client-order-id") ||
    req.headers.get("client-order-id") ||
    req.headers.get("task-id") ||
    req.nextUrl?.searchParams?.get("client_order_id") ||
    req.nextUrl?.searchParams?.get("task_id") ||
    null;

  const clientIp = extractClientIp(req);

  const playgroundUserId = req.headers.get("x-playground-user-id");
  if (playgroundUserId) {
    const user = await db.user.findUnique({
      where: { id: playgroundUserId },
      include: {
        wallet: true,
        clientSettings: true,
        pricingRules: true,
      },
    });
    if (user && user.accountStatus === "ACTIVE") {
      return {
        client: {
          userId: user.id,
          userEmail: user.email,
          companyName: user.companyName,
          accountStatus: user.accountStatus,
          keyType: "SANDBOX",
          keyName: "Interactive Playground Session",
          keyId: "playground_key",
          rateLimitRpm: 600,
          walletId: user.wallet?.id || null,
          walletBalance: user.wallet?.balance || 0,
          allowedIps: [],
          pricingRules: new Map(),
          clientPricing: new Map(),
          clientOrderId: clientOrderId,
          clientIp: "127.0.0.1",
          webhookUrl: user.clientSettings?.webhookUrl || null,
          webhookSecret: user.clientSettings?.webhookSecret || null,
        },
      };
    }
  }

  if (!apiKey) {
    return {
      error: {
        status: 401,
        code: "AUTH_INVALID_API_KEY",
        response_code: "101",
        message: "Missing Colladome API Key. Pass 'api_key' in Base URL query parameter (e.g. ?api_key=YOUR_KEY) or 'x-api-key' header.",
      },
    };
  }

  const keyHash = hashApiKey(apiKey.trim());

  const keyRecord = await db.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          wallet: true,
          clientSettings: true,
          pricingRules: true,
        },
      },
    },
  });

  if (!keyRecord || !keyRecord.isActive) {
    return {
      error: {
        status: 401,
        code: "AUTH_INVALID_API_KEY",
        response_code: "101",
        message: "Invalid or inactive Colladome API key.",
      },
    };
  }

  const user = keyRecord.user;

  if (user.accountStatus !== "ACTIVE") {
    return {
      error: {
        status: 403,
        code: "AUTH_ACCOUNT_SUSPENDED",
        response_code: "101",
        message: `Your Colladome client account is currently ${user.accountStatus.toLowerCase()}. Please contact support.`,
      },
    };
  }

  // Parse IP Whitelists
  let allowedIps: string[] = [];
  try {
    if (keyRecord.type === "SANDBOX" && user.clientSettings?.sandboxIps) {
      allowedIps = JSON.parse(user.clientSettings.sandboxIps);
    } else if (user.clientSettings?.allowedIps) {
      allowedIps = JSON.parse(user.clientSettings.allowedIps);
    }
  } catch {
    allowedIps = [];
  }

  if (!isIpAllowed(clientIp, allowedIps)) {
    return {
      error: {
        status: 403,
        code: "SECURITY_IP_NOT_WHITELISTED",
        response_code: "102",
        message: `Forbidden: Client IP '${clientIp}' is not authorized in your Colladome IP Whitelist.`,
      },
    };
  }

  // Build pricing lookup maps
  const pricingMap = new Map<string, number>();
  const clientPricingMap = new Map<string, ClientApiPricing>();
  if (user.pricingRules) {
    for (const rule of user.pricingRules) {
      if (rule.isEnabled) {
        pricingMap.set(rule.apiId, rule.customPrice);
        clientPricingMap.set(rule.apiId, {
          id: rule.id,
          customPrice: rule.customPrice,
          customSetupFee: rule.customSetupFee,
          isSetupFeePaid: rule.isSetupFeePaid,
        });
      }
    }
  }

  // Update lastUsedAt asynchronously
  db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    client: {
      userId: user.id,
      userEmail: user.email,
      companyName: user.companyName,
      accountStatus: user.accountStatus,
      keyType: keyRecord.type as "PRODUCTION" | "SANDBOX",
      keyName: keyRecord.name,
      keyId: keyRecord.id,
      rateLimitRpm: keyRecord.rateLimitRpm || user.clientSettings?.rateLimitRpm || 120,
      walletId: user.wallet?.id || null,
      walletBalance: user.wallet?.balance || 0,
      allowedIps,
      pricingRules: pricingMap,
      clientPricing: clientPricingMap,
      clientOrderId,
      clientIp,
      webhookUrl: user.clientSettings?.webhookUrl || null,
      webhookSecret: user.clientSettings?.webhookSecret || null,
    },
  };
}
