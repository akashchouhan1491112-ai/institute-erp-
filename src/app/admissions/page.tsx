"use client";

import React from "react";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  CheckCircle2,
  FileText,
  ArrowRight,
  Search,
  ShieldCheck,
  Award,
  ClipboardCheck,
} from "lucide-react";

export default function AdmissionsPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-royal-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Admission Process, Eligibility & Online Application
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mt-2">
            Transparent 5-step digital admission workflow separating Online
            Registration from Confirmed Admission & Batch Allocation.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-navy-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow transition"
            >
              Apply Online (Registration Form) <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl transition"
            >
              <Search className="w-4 h-4" />
              Track Existing Application
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Step-by-Step Workflow */}
        <div>
          <h2 className="text-2xl font-extrabold text-navy-900 mb-6">
            Step-by-Step Registration & Admission Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "Step 01",
                title: "Online Registration",
                desc: "Fill out personal, parent, and academic details online and receive your unique REG-2026-XXXX number.",
              },
              {
                step: "Step 02",
                title: "Document Upload",
                desc: "Upload passport photo, Aadhaar/ID proof, and previous class marksheet for verification.",
              },
              {
                step: "Step 03",
                title: "Admin Review & Approval",
                desc: "Admissions Cell verifies documents, checks scholarship eligibility, and approves registration.",
              },
              {
                step: "Step 04",
                title: "Batch & Fee Allocation",
                desc: "Course, batch, and customized installment schedule are assigned; ADM-2026 & STU-2026 IDs generated.",
              },
              {
                step: "Step 05",
                title: "Fee Payment & Portal Login",
                desc: "Pay fees online via Razorpay (UPI/Card/NetBanking) or offline at campus and download GST receipts.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2"
              >
                <span className="text-xs font-extrabold text-royal-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {item.step}
                </span>
                <h3 className="text-sm font-extrabold text-navy-900 pt-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility & Required Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
            <h3 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-royal-600" />
              Course-Wise Eligibility Requirements
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>2-Year Integrated Programs (JEE / NEET):</strong>{" "}
                  Class 10 passed / appearing students moving to Class 11 (Science
                  Stream).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>1-Year Target / Repeater Programs:</strong> Class 12
                  passed or appeared candidates aiming for competitive entrance rank improvement.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Foundation & Olympiad Programs:</strong> Students moving
                  to Class 9 or Class 10 in CBSE/ICSE/State Boards.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Civil Services & Graduate Programs:</strong> Final-year
                  undergraduates or graduates in any discipline.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
            <h3 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-royal-600" />
              Mandatory Documents Required for Admission
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                <span>
                  Recent Passport-size Colour Photograph of Student (JPG/PNG).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                <span>
                  Student Identity Proof (Aadhaar Card / Passport / School ID Card).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                <span>
                  Previous Class Board Marksheet / School Report Card (Class 9/10/12).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                <span>
                  Scholarship / Olympiad / Category Certificate (if claiming fee
                  concession).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

