"use client";

import React from "react";
import PublicLayout from "@/components/PublicLayout";

export default function TermsPage() {
  return (
    <PublicLayout>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold">
            Terms & Conditions of Admission and Portal Usage
          </h1>
        </div>
      </section>
      <section className="py-12 max-w-4xl mx-auto px-4 space-y-6 text-sm text-slate-700 leading-relaxed bg-white my-8 rounded-2xl border border-slate-200 p-8">
        <h2 className="text-lg font-extrabold text-navy-900">
          1. Academic Discipline & Attendance
        </h2>
        <p>
          Enrolled students must maintain a minimum of 75% attendance across lectures
          and mandatory CBT/OMR tests. Automated low-attendance alerts are sent to
          parents when attendance drops below 75%.
        </p>
        <h2 className="text-lg font-extrabold text-navy-900">
          2. Intellectual Property of Study Material
        </h2>
        <p>
          All printed booklets, DPPs, test papers, and portal PDF downloads are
          copyrighted by the Institute and licensed strictly for the enrolled
          student&apos;s personal preparation.
        </p>
      </section>
    </PublicLayout>
  );
}

