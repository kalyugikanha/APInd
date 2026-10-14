"use client";

import React from "react";
import Link from "next/link";
import {
  Hotel,
  Landmark,
  CreditCard,
  Users,
  Gamepad2,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function IndustriesPage() {
  const industries = [
    {
      title: "Hotels & Hospitality",
      icon: Hotel,
      badge: "Fast Front-Desk Check-in",
      headline: "Eliminate Front-Desk Paperwork with Instant 10-Second Digital Verification",
      painPoints: "Manual photocopy collection of Aadhaar/Passport at hotel check-in creates front-desk bottlenecks and risks regulatory non-compliance.",
      solution: "Colladome enables contactless check-in kiosks or mobile web forms. Guests input Aadhaar OTP or Passport details; Colladome verifies government records instantly, populating guest folios with 100% regulatory compliance.",
      apisUsed: ["Aadhaar Paperless OKYC", "PAN Detailed Verification", "Passport Lookup"],
    },
    {
      title: "Fintech, NBFCs & Digital Lending",
      icon: Landmark,
      badge: "Sub-30s Underwriting",
      headline: "Real-time Borrower Identity, Bank & Employment Verification",
      painPoints: "High drop-offs during KYC and fraudulent loan disbursements caused by mismatched bank accounts.",
      solution: "Colladome authenticates borrower PAN with income-tax records, verifies bank account ownership via ₹1 IMPS penny-drop, and runs bureau checks in under 30 seconds before loan disbursement.",
      apisUsed: ["PAN Detailed Verification", "Bank Penny Drop", "Aadhaar OKYC", "UPI VPA Verification"],
    },
    {
      title: "Banking & Neo-Banks",
      icon: CreditCard,
      badge: "High Redundancy & Redundancy",
      headline: "Mission-Critical Payment Validation with Multi-Provider Failover",
      painPoints: "Single upstream provider outages cause mass transaction drops and client dissatisfaction.",
      solution: "Colladome automatically balances traffic across Decentro, IDFY, and Zoop. If Decentro experiences a latency spike, the request is seamlessly fulfilled by IDFY with zero disruption.",
      apisUsed: ["Bank Penny Drop Verification", "UPI Account Lookup", "GSTIN Search"],
    },
    {
      title: "HR, Staffing & Background Screening",
      icon: Users,
      badge: "Pre-employment Verification",
      headline: "Automate Employee Onboarding and Payroll Bank Verification",
      painPoints: "Manual resume checks and payroll bounce-backs due to incorrect employee account details.",
      solution: "Instantly verify candidate PAN, Aadhaar identity, past director directorships (DIN), and bank accounts to guarantee first-month salary payouts never bounce.",
      apisUsed: ["PAN Verification", "Bank Account Verify", "MCA Director DIN Verification"],
    },
    {
      title: "Gaming & Real-Money Entertainment",
      icon: Gamepad2,
      badge: "Instant 24/7 Withdrawals",
      headline: "Age Verification, TDS Compliance & Instant Winning Payouts",
      painPoints: "Regulatory mandates requiring strict 18+ age checks and TDS withholding against valid PAN numbers.",
      solution: "Verify player PAN and DOB in real time. Validate winning withdrawal bank accounts via penny-drop before crediting funds.",
      apisUsed: ["PAN Verification", "Bank Penny Drop", "UPI Validation"],
    },
  ];

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <section className="py-20 bg-slate-50 border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            Industry Compliance Playbooks
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            How Colladome Powers Modern Indian Industries
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Discover tailored verification architectures built specifically for hospitality, fintech, banking, and workforce management.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        {industries.map((ind, idx) => {
          const Icon = ind.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {ind.badge}
                    </span>
                    <h2 className="text-xl font-bold text-slate-950">{ind.title}</h2>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-800">{ind.headline}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] block">
                    The Industry Bottleneck:
                  </span>
                  <p className="leading-relaxed">{ind.painPoints}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 text-white space-y-2">
                  <span className="font-bold text-emerald-400 uppercase text-[11px] block">
                    The Colladome Solution:
                  </span>
                  <p className="leading-relaxed text-slate-300">{ind.solution}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Recommended APIs:</span>
                  {ind.apisUsed.map((api, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-bold"
                    >
                      {api}
                    </span>
                  ))}
                </div>

                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-black transition"
                >
                  Start Integration
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
