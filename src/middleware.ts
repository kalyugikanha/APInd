import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_SECRET =
  process.env.ENCRYPTION_SECRET || "colladome_super_secure_session_secret_signing_key_32bytes!";

/**
 * Converts a base64url string to Uint8Array
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts an ArrayBuffer to base64url string
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Verifies session token on Edge Runtime using native Web Crypto API
 */
async function verifySessionTokenEdge(
  token: string
): Promise<{ userId: string; email: string; role: string; exp: number } | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, providedSig] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const calculatedSigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadBase64));
    const calculatedSig = bufferToBase64Url(calculatedSigBuffer);

    if (calculatedSig !== providedSig) {
      return null;
    }

    // Decode JSON payload
    const payloadBytes = base64UrlToUint8Array(payloadBase64);
    const jsonStr = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(jsonStr);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("colladome_session")?.value;
  const session = token ? await verifySessionTokenEdge(token) : null;

  // 1. Protect Admin Portal (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role Guard: Only SUPER_ADMIN and ADMIN_STAFF can enter
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_STAFF") {
      // Forbidden: redirect to Client Portal
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 2. Protect Client Portal (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3. Auth pages (/login, /signup) - redirect if already logged in
  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const isSuperAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN_STAFF";
      const target = isSuperAdmin ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
