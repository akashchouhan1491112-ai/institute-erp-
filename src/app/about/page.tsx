"use client";

import React, { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Award, Target } from "lucide-react";

export default function AboutPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const teachers = data?.teachers || [];
  const instituteName =
    data?.settings?.instituteName || "National Institute of Academic Studies";

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">About {instituteName}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Institutional overview, academic mission, vision, and faculty
            structure.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-royal-600">
              Institutional Overview
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
              Structured Academic Coaching & Mentorship
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {instituteName} provides structured classroom and hybrid coaching
              programs supported by a centralized Institute Management ERP. All
              registrations, admissions, batch schedules, fee installments,
              attendance records, and examination evaluations are managed on a
              unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <Target className="w-7 h-7 text-royal-600" />
              <h3 className="text-sm font-bold text-navy-900">Our Mission</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To deliver rigorous curriculum instruction, regular diagnostic
                assessments, and transparent academic tracking for every
                enrolled student.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <Award className="w-7 h-7 text-navy-800" />
              <h3 className="text-sm font-bold text-navy-900">Our Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To maintain high standards of academic discipline, faculty
                accountability, and institutional governance.
              </p>
            </div>
          </div>
        </div>

        {teachers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-navy-900 mb-4">
              Academic Faculty
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teachers.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 space-y-1.5"
                >
                  <span className="text-[11px] font-mono font-bold text-royal-600">
                    {t.employeeCode}
                  </span>
                  <h3 className="text-sm font-bold text-navy-900">
                    {t.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    {t.designation}
                  </p>
                  <p className="text-xs text-slate-500">{t.qualification}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
