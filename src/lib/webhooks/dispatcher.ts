import crypto from "crypto";

export interface WebhookEventPayload {
  event: string;
  eventId: string;
  timestamp: string;
  data: any;
}

export interface WebhookDispatchResult {
  success: boolean;
  httpStatus?: number;
  latencyMs: number;
  deliveryId: string;
  error?: string;
  attempts: number;
}

/**
 * Generate a cryptographically secure webhook secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Sign payload using HMAC-SHA256 (Stripe/GitHub compatible format: t=<timestamp>,v1=<hash>)
 */
export function signWebhookPayload(payload: string, secret: string, timestamp: number): string {
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signaturePayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Asynchronously dispatch a webhook event to a client URL with retries
 */
export async function dispatchWebhook(
  url: string,
  secret: string | null,
  event: string,
  data: any,
  maxRetries: number = 2
): Promise<WebhookDispatchResult> {
  const deliveryId = `del_${crypto.randomBytes(16).toString("hex")}`;
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  const timestampNow = Math.floor(Date.now() / 1000);

  const payloadObject: WebhookEventPayload = {
    event,
    eventId,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payloadObject);
  const signatureHeader = secret
    ? signWebhookPayload(payloadString, secret, timestampNow)
    : `t=${timestampNow},v1=unsigned`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Colladome-Webhook-Dispatcher/1.0",
    "x-colladome-event": event,
    "x-colladome-delivery-id": deliveryId,
    "x-colladome-signature": signatureHeader,
    "x-colladome-timestamp": String(timestampNow),
  };

  let attempts = 0;
  let lastError: string | undefined;
  let lastStatus: number | undefined;
  const startTime = Date.now();

  for (let i = 0; i <= maxRetries; i++) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = res.status;

      if (res.ok) {
        return {
          success: true,
          httpStatus: res.status,
          latencyMs: Date.now() - startTime,
          deliveryId,
          attempts,
        };
      } else {
        lastError = `Target server returned HTTP ${res.status}`;
        // If client returned 4xx (client error), do not retry
        if (res.status >= 400 && res.status < 500) {
          break;
        }
      }
    } catch (err: any) {
      lastError = err.name === "AbortError" ? "Webhook delivery timed out after 5,000ms" : err.message;
    }

    // Wait before retry
    if (i < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
    }
  }

  return {
    success: false,
    httpStatus: lastStatus,
    latencyMs: Date.now() - startTime,
    deliveryId,
    error: lastError || "Failed to deliver webhook",
    attempts,
  };
}
