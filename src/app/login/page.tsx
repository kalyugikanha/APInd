"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const redirectParam = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;

    if (mode === "login") {
      try {
        const res = await fetch("/api/internal/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed");
        }

        setSuccessMsg(data.message || "Login successful! Redirecting...");
        const destination = redirectParam || data.redirectUrl || "/dashboard";
        
        setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 400);
      } catch (err: any) {
        setErrorMsg(err.message || "Invalid credentials. Please try again.");
      } finally {
        setLoading(false);
      }
      // Sign up flow: call clean signup endpoint with user's actual password
      try {
        const res = await fetch("/api/internal/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            companyName: companyName || undefined,
            contactPerson: contactPerson || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(data.message || "Account created! Redirecting to your dashboard...");
          setTimeout(() => {
            router.push(data.redirectUrl || "/dashboard");
            router.refresh();
          }, 500);
        } else {
          setErrorMsg(data.error || "Failed to create account");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Column: Auth Card */}
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
                C
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                COLLADOME
              </span>
            </Link>
            <p className="text-xs text-slate-500 font-medium">
              Dive into Success With Our API Infrastructure
            </p>
          </div>

          {/* Pill Switcher Toggle (Matching Reference Image 1) */}
          <div className="flex justify-center">
            <div className="bg-slate-200/80 p-1 rounded-full flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-8 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  mode === "login"
                    ? "bg-slate-950 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`px-8 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-slate-950 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form Container Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Company / Organization Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Fintech Pvt Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Malhotra"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 accent-slate-950"
                  />
                  <span>Remember me</span>
                </label>

                <a href="#reset" className="text-slate-500 hover:text-slate-900 font-medium">
                  Forgot password? <span className="underline">Reset</span>
                </a>
              </div>

              {/* Primary Solid Dark Pill Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md shadow-slate-950/20 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : mode === "login"
                  ? "Login"
                  : "Create Sandbox Account"}
              </button>

              {/* Social Login Button */}
              <button
                type="button"
                onClick={() => {
                  setEmail("fintech@acme.com");
                  router.push("/dashboard");
                }}
                className="w-full py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            ©2026 Colladome Technologies - All Rights Reserved.
          </div>
        </div>

        {/* Right Column: Premium Onyx / Monochrome Bento Showcase (Matching Reference Image 1) */}
        <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white rounded-3xl p-8 lg:p-10 border border-slate-800 shadow-2xl relative overflow-hidden min-h-[580px]">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_60%)]"></div>

          {/* Top Floating Badge */}
          <div className="relative z-10 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify safely with us</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Identity & Banking Infrastructure
            </h2>
          </div>

          {/* Bento Grid Cards */}
          <div className="grid grid-cols-2 gap-4 relative z-10 my-6">
            {/* Bento Card 1: Skill / Risk */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div>
                <div className="text-xs font-bold text-white">99.9% Redundancy</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Multi-provider failover across Zoop, IDFY & Decentro.
                </div>
              </div>
              {/* Mini visual chart */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Initial Balance</span>
                  <strong className="text-emerald-400">₹45,200</strong>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Win Rate</span>
                  <strong className="text-slate-200">99.8%</strong>
                </div>
                <div className="flex items-end gap-1 h-8 pt-1">
                  {[40, 65, 80, 55, 90, 75, 100, 85].map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${val}%` }}
                      className="flex-1 bg-slate-700 hover:bg-emerald-400 transition rounded-t-sm"
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Card 2: Rewards & Latency */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-white">Sub-25ms Latency</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  High-speed reverse proxy with zero payload overhead.
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center my-auto">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Verified API Hits</div>
                <div className="text-2xl font-extrabold text-white mt-1">₹120,580</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">✓ 100% Settle Guarantee</div>
              </div>
            </div>

            {/* Bento Card 3: 24/7 Dedicated Support */}
            <div className="col-span-2 bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-300">
                  24/7
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dedicated Support Engineering</div>
                  <div className="text-[11px] text-slate-400">
                    Our compliance & integration team is always here to help.
                  </div>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>

          {/* Partner Trust Strip */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono relative z-10">
            <span>ZOOP.ONE</span>
            <span>IDFY</span>
            <span>DECENTRO</span>
            <span>SURPASS</span>
            <span>UIDAI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
