import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up user in database
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "INACTIVE") {
      return NextResponse.json(
        { error: "This account has been suspended or deactivated. Contact support@colladome.com." },
        { status: 403 }
      );
    }

    // Verify password hash
    const inputHash = hashApiKey(password);
    if (user.passwordHash !== inputHash) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    // Generate secure signed session token
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      companyName: user.companyName || undefined,
      clientCode: user.clientCode || undefined,
    });

    const isSuperAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN_STAFF";
    const redirectUrl = isSuperAdmin ? "/admin/dashboard" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName,
        clientCode: user.clientCode,
        walletBalance: user.wallet?.balance || 0,
      },
      redirectUrl,
    });

    // Set HttpOnly signed cookie for 7 days
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (err: any) {
    console.error("Login authentication error:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred during authentication." },
      { status: 500 }
    );
  }
}
