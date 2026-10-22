"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, Layers, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Hero */}
      <section className="py-20 bg-slate-50 border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            About Colladome
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Building the Foundation for Digital Trust in India
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We aggregate fragmented identity and banking providers into a single, high-availability API gateway, ensuring businesses never face downtime during mission-critical onboarding.
          </p>
        </div>
      </section>

      {/* Mission & Story */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-950">The Multi-Provider Challenge</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In India, financial verification APIs (PAN, Bank Penny Drop, Aadhaar OKYC) frequently experience unexpected provider downtimes, schema changes, and high latency spikes from single upstream vendors.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When a single upstream gateway encounters server downtime, consumer onboarding stalls. <strong>Colladome solves this through intelligent reverse proxying and automated failover</strong>, ensuring 99.9% uptime by automatically routing traffic to secondary providers.
            </p>
          </div>

          <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="text-xs font-bold uppercase text-slate-400 font-mono">Platform Guarantees</div>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">99.9% Multi-Provider Redundancy</strong>
                  <span className="text-slate-400">Automatic retry on secondary providers within 400ms.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Double-Entry Atomic Wallet Accounting</strong>
                  <span className="text-slate-400">Strict ACID compliance guarantees zero double deductions.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">100% Whitelabel Abstraction</strong>
                  <span className="text-slate-400">Third-party provider tokens and identities are never leaked to clients.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white text-center space-y-4">
          <h3 className="text-2xl font-bold">Ready to integrate?</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Get an instant sandbox API key with pre-loaded test balance or speak with our solutions architect.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-full bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition"
            >
              Get Free Sandbox Key
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
