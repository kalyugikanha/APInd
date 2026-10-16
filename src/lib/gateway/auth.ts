import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";

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
  error?: { status: number; code: string; message: string };
}> {
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  const clientOrderId = req.headers.get("x-client-order-id") || null;
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
        code: "MISSING_API_KEY",
        message: "Missing 'x-api-key' header. Please provide your Colladome API Key.",
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
        code: "INVALID_API_KEY",
        message: "The provided API key is invalid or has been revoked.",
      },
    };
  }

  const user = keyRecord.user;

  if (user.accountStatus !== "ACTIVE") {
    return {
      error: {
        status: 403,
        code: "ACCOUNT_SUSPENDED",
        message: `Your Colladome account is currently ${user.accountStatus.toLowerCase()}. Please contact support.`,
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
        code: "IP_NOT_WHITELISTED",
        message: `Forbidden: Client IP '${clientIp}' is not authorized in your Colladome IP Whitelist.`,
      },
    };
  }

  // Build pricing lookup map
  const pricingMap = new Map<string, number>();
  if (user.pricingRules) {
    for (const rule of user.pricingRules) {
      if (rule.isEnabled) {
        pricingMap.set(rule.apiId, rule.customPrice);
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
      clientOrderId,
      clientIp,
      webhookUrl: user.clientSettings?.webhookUrl || null,
      webhookSecret: user.clientSettings?.webhookSecret || null,
    },
  };
}
