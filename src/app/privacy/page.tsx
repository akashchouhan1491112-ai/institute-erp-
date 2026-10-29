"use client";

import React from "react";
import PublicLayout from "@/components/PublicLayout";

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold">
            Privacy Policy & Child Data Protection Notice (DPDP Act Compliant)
          </h1>
        </div>
      </section>
      <section className="py-12 max-w-4xl mx-auto px-4 space-y-6 text-sm text-slate-700 leading-relaxed bg-white my-8 rounded-2xl border border-slate-200 p-8">
        <h2 className="text-lg font-extrabold text-navy-900">
          1. Collection of Student & Parent Information
        </h2>
        <p>
          The Institute collects student personal, academic,
          guardian, and identity proof documents solely for admission processing,
          batch allocation, attendance tracking, examination evaluation, and statutory
          tax invoicing.
        </p>
        <h2 className="text-lg font-extrabold text-navy-900">
          2. Verifiable Parental Consent for Minors
        </h2>
        <p>
          In accordance with India&apos;s Digital Personal Data Protection (DPDP)
          framework, registrations for students under 18 years of age require explicit
          parent/guardian contact verification and consent.
        </p>
        <h2 className="text-lg font-extrabold text-navy-900">
          3. Payment & Financial Security
        </h2>
        <p>
          We never store credit/debit card numbers, CVV, or UPI PINs on our servers.
          All online payments are processed via PCI-DSS compliant Razorpay checkout
          with server-side HMAC-SHA256 verification.
        </p>
      </section>
    </PublicLayout>
  );
}

