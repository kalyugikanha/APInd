import crypto from "crypto";

const SESSION_SECRET =
  process.env.ENCRYPTION_SECRET || "colladome_super_secure_session_secret_signing_key_32bytes!";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN_STAFF" | "CLIENT_ADMIN" | "CLIENT_DEV";
  companyName?: string;
  clientCode?: string;
  exp: number; // Expiration timestamp in seconds
}

export const SESSION_COOKIE_NAME = "colladome_session";

/**
 * Creates a signed JWT-like session token: base64(payload).signature
 */
export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  expiresInDays = 7
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies and decodes a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, providedSignature] = parts;

  // Recreate expected signature
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
