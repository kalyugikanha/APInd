import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.ENCRYPTION_SECRET || "colladome_super_secure_aes_256_key_32bytes!";
// Ensure key is 32 bytes
const KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encrypt sensitive credentials (e.g. 3rd-party provider secrets)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive credentials
 */
export function decrypt(encryptedText: string): string {
  try {
    const [ivHex, tagHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !tagHex || !encrypted) return encryptedText;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedText;
  }
}

/**
 * Hash an API key for secure storage using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate a new API Key with prefix (cd_live_ or cd_test_)
 */
export function generateApiKey(type: "PRODUCTION" | "SANDBOX" = "PRODUCTION"): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
  keyHint: string;
} {
  const prefix = type === "PRODUCTION" ? "cd_live_" : "cd_test_";
  const randomSecret = crypto.randomBytes(24).toString("hex");
  const rawKey = `${prefix}${randomSecret}`;
  const keyHash = hashApiKey(rawKey);
  const keyHint = `...${randomSecret.slice(-4)}`;

  return {
    rawKey,
    keyPrefix: prefix,
    keyHash,
    keyHint,
  };
}

/**
 * Generate a unique Colladome Order ID
 */
export function generateOrderId(prefix = "CDO"): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}_${dateStr}_${random}`;
}
