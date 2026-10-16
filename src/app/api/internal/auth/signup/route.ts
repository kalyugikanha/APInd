import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashApiKey, generateApiKey } from "@/lib/crypto";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, companyName, contactPerson, fullName, name, phone } = body;

    const personName = (contactPerson || fullName || name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const userPassword = (password || "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!userPassword || userPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!personName) {
      return NextResponse.json(
        { error: "Contact person / full name is required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Generate guaranteed unique client code (e.g. CD-1002)
    let clientCode = "";
    for (let i = 0; i < 15; i++) {
      const candidate = `CD-${1000 + Math.floor(1000 + Math.random() * 9000)}`;
      const existingCode = await db.user.findUnique({ where: { clientCode: candidate } });
      if (!existingCode) {
        clientCode = candidate;
        break;
      }
    }
    if (!clientCode) {
      clientCode = `CD-${Date.now().toString().slice(-6)}`;
    }

    // Generate default Sandbox trial key
    const sandboxKey = generateApiKey("SANDBOX");

    // Create client user, wallet, settings, and initial key atomically
    const newUser = await db.user.create({
      data: {
        clientCode,
        email: cleanEmail,
        passwordHash: hashApiKey(userPassword),
        fullName: personName,
        companyName: companyName?.trim() || `${personName}'s Organization`,
        phone: phone?.trim() || null,
        role: "CLIENT_ADMIN",
        accountStatus: "ACTIVE",
        kycStatus: "NOT_SUBMITTED",
        billingModel: "PREPAID",
        creditLimit: 0,
        wallet: {
          create: {
            balance: 100.0, // ₹100.00 trial credits for instant sandbox testing
            currency: "INR",
          },
        },
        clientSettings: {
          create: {
            allowedIps: JSON.stringify(["*"]),
            sandboxIps: JSON.stringify(["*"]),
            rateLimitRpm: 60,
            isLiveEnabled: true,
          },
        },
        apiKeys: {
          create: {
            keyPrefix: sandboxKey.keyPrefix,
            keyHash: sandboxKey.keyHash,
            keyHint: sandboxKey.keyHint,
            type: "SANDBOX",
            name: "Initial Sandbox Key",
            rateLimitRpm: 60,
            isActive: true,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Record welcome trial bonus transaction
    if (newUser.wallet) {
      await db.walletTransaction.create({
        data: {
          walletId: newUser.wallet.id,
          amount: 100.0,
          type: "CREDIT",
          balanceBefore: 0.0,
          balanceAfter: 100.0,
          referenceId: "WELCOME_TRIAL_BONUS",
          description: "Welcome developer trial bonus",
        },
      });
    }

    // Create session token
    const token = createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role as "CLIENT_ADMIN",
      companyName: newUser.companyName || undefined,
      clientCode: newUser.clientCode || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: `Account created successfully! Welcome to Colladome, ${personName}.`,
      redirectUrl: "/dashboard",
      client: {
        id: newUser.id,
        clientCode: newUser.clientCode,
        email: newUser.email,
        companyName: newUser.companyName,
      },
    });

    // Set 7-day secure HttpOnly session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 });
  }
}
