"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    volume: "10,000 - 50,000 hits/month",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <section className="py-16 bg-slate-50 border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            Get in Touch
          </div>
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            Speak with an API Solutions Specialist
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Discuss custom volume pricing, enterprise SLAs, or specific upstream provider route mappings.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Let's talk scale</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Whether you are processing 1,000 checks a month or 10 million transactions a day, Colladome provides custom pricing tiers and high-throughput dedicated infrastructure.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <Mail className="w-5 h-5 text-slate-900 shrink-0" />
              <div>
                <span className="text-slate-400 block font-semibold">Enterprise Inquiries</span>
                <strong className="text-slate-900 text-sm">enterprise@colladome.com</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <Phone className="w-5 h-5 text-slate-900 shrink-0" />
              <div>
                <span className="text-slate-400 block font-semibold">Sales Helpline</span>
                <strong className="text-slate-900 text-sm">+91 (0124) 498-2100</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <MapPin className="w-5 h-5 text-slate-900 shrink-0" />
              <div>
                <span className="text-slate-400 block font-semibold">Headquarters</span>
                <strong className="text-slate-900 text-sm">
                  Cyber City, DLF Phase 2, Gurugram, Haryana 122002
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">Message Received!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Thank you for contacting Colladome. An enterprise account manager will contact you within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold text-lg text-slate-950 mb-2">Request Custom Enterprise Rate</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="vikram@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="Company Legal Name"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Monthly API Hit Volume</label>
                <select
                  value={form.volume}
                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:border-slate-950 font-semibold"
                >
                  <option value="1,000 - 10,000 hits/month">1,000 - 10,000 hits / month</option>
                  <option value="10,000 - 50,000 hits/month">10,000 - 50,000 hits / month</option>
                  <option value="50,000 - 250,000 hits/month">50,000 - 250,000 hits / month</option>
                  <option value="250,000+ Enterprise hits/month">250,000+ Enterprise hits / month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Requirements / APIs Needed</label>
                <textarea
                  rows={3}
                  placeholder="Specify APIs required (e.g. PAN, Bank Penny Drop, Aadhaar OKYC) or specific provider preferences..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-slate-950"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition"
              >
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
