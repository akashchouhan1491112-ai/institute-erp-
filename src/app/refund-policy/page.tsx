"use client";

import React from "react";
import PublicLayout from "@/components/PublicLayout";

export default function RefundPolicyPage() {
  return (
    <PublicLayout>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold">
            Fee Refund, Cancellation & Batch Transfer Policy
          </h1>
        </div>
      </section>
      <section className="py-12 max-w-4xl mx-auto px-4 space-y-6 text-sm text-slate-700 leading-relaxed bg-white my-8 rounded-2xl border border-slate-200 p-8">
        <h2 className="text-lg font-extrabold text-navy-900">
          1. Registration Fee
        </h2>
        <p>
          The one-time Registration & Scholarship Test Fee (₹500–₹1,000) is
          non-refundable as it covers application evaluation and counselling kit costs.
        </p>
        <h2 className="text-lg font-extrabold text-navy-900">
          2. Pro-Rata Tuition Fee Refund Window
        </h2>
        <p>
          Refund requests submitted within 15 days of batch commencement are eligible
          for an 85% tuition fee refund after deducting study material and
          administrative charges. All approved refunds are processed via NEFT/RTGS and
          recorded in the ERP financial audit log.
        </p>
      </section>
    </PublicLayout>
  );
}

