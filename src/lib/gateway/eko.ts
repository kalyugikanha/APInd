import crypto from "crypto";

export interface EkoAuthCredentials {
  developerKey: string;
  accessKey: string;
  initiatorId: string;
}

/**
 * Generates official Eko EPS HMAC-SHA256 authenticated headers.
 * Reference: https://eps.eko.in/docs/how-auth-works
 */
export function generateEkoHeaders(developerKey: string, accessKey: string) {
  const timestamp = Date.now().toString();
  // 1. Base64 encode the secret access key
  const encodedKey = Buffer.from(accessKey).toString("base64");
  // 2. Compute HMAC-SHA256 signature using the encodedKey on the timestamp
  const secretKey = crypto
    .createHmac("sha256", encodedKey)
    .update(timestamp)
    .digest("base64");

  return {
    developer_key: developerKey,
    "secret-key": secretKey,
    "secret-key-timestamp": timestamp,
    "content-type": "application/json",
    accept: "application/json",
  };
}

/**
 * Normalizes and formats PAN number to standard uppercase 10-character string
 */
export function normalizePan(pan: string): string {
  return pan.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
