"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Play, Key, ArrowRight, ShieldCheck, Building2, FileCheck } from "lucide-react";

export default function ApisCatalogPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");

  useEffect(() => {
    fetch("/api/internal/admin/apis")
      .then((r) => r.json())
      .then((data) => {
        setApis(data.apis || []);
        setCategories(data.categories || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const filtered = selectedCat === "all" ? apis : apis.filter((a) => a.category?.slug === selectedCat);

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <section className="py-16 bg-slate-50 border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            API Documentation & Catalog
          </div>
          <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">
            Indian Verification & Banking APIs
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Clean JSON contracts, sub-25ms response overhead, and instant sandbox keys.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              selectedCat === "all" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-950"
            }`}
          >
            All Services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                selectedCat === c.slug ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-950"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((api) => (
            <div
              key={api.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {api.httpMethod}
                  </span>
                  <span className="font-bold text-xs text-emerald-600">₹{api.defaultSellPrice.toFixed(2)} / call</span>
                </div>

                <h3 className="font-bold text-base text-slate-950 mt-3">{api.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{api.description}</p>
                <code className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 block mt-3">
                  https://api.colladome.com{api.endpointPath}
                </code>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">{api.category?.name}</span>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-950 hover:underline"
                >
                  <span>Test in Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
