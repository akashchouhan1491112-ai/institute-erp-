"use client";

import React from "react";
import PublicLayout from "@/components/PublicLayout";

const FAQS = [
  {
    q: "How are Online Registration and Confirmed Admission separated?",
    a: "First, students complete the Online Registration Form (/register) and receive a unique REG-2026-XXXX number. Once the Admissions Office verifies uploaded documents and approves the registration, the student is allocated a batch, Admission Number (ADM-2026-XXXX), Student ID (STU-2026-XXXX), and a customized Fee Installment Schedule.",
  },
  {
    q: "How can I pay course fees online and download GST-compliant receipts?",
    a: "Admitted students and parents can log in to the Student Portal (/student) and pay installments via Razorpay (UPI, Debit/Credit Card, NetBanking). Payments are cryptographically verified on the server using HMAC-SHA256 signatures, and an official PDF/Print receipt (RCP-2026-XXXX) is generated immediately.",
  },
  {
    q: "Can parents pay fees offline at the institute accounts counter?",
    a: "Yes. We accept Cash, NEFT/RTGS/IMPS Bank Transfer, Manual UPI, and Cheque payments at the campus accounts counter. Authorized staff verify and record offline payments in the ERP, generating the same official receipt.",
  },
  {
    q: "What happens if a student misses a class or needs doubt resolution?",
    a: "Every lecture is backed by downloadable PDF lecture notes & DPPs in the Student Portal and scheduled faculty doubt resolution sessions.",
  },
  {
    q: "How do scholarships and fee concessions work?",
    a: "Students can avail merit-based tuition fee waivers based on Board examination marks, competitive exam qualifications, or performance in the Institute Scholarship Test.",
  },
];

export default function FaqPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-royal-700 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Frequently Asked Questions (FAQs)
          </h1>
          <p className="text-sm sm:text-base text-blue-100 mt-2">
            Answers regarding admissions, batches, scholarships, fee installments,
            and ERP portal access.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {FAQS.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2"
          >
            <h3 className="text-base font-extrabold text-navy-900">{item.q}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}

