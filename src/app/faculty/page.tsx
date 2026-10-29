"use client";

import React, { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { GraduationCap } from "lucide-react";

export default function FacultyPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const teachers = data?.teachers || [];

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Faculty Directory</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Academic department members and subject mentors.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-bold text-navy-900">
              No Faculty Profiles Listed Yet
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Faculty members added via the Administration Dashboard (Teacher
              Management) will be listed here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teachers.map((t: any) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-5 items-start"
              >
                <div className="w-14 h-14 rounded-xl bg-navy-800 text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {t.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-navy-900">
                      {t.fullName}
                    </h2>
                    <span className="text-[11px] font-mono bg-blue-50 text-royal-700 px-2.5 py-0.5 rounded-full font-bold">
                      {t.experienceYears} Yrs Exp
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-royal-600">
                    {t.designation}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong>Qualification:</strong> {t.qualification} |{" "}
                    <strong>Specialization:</strong> {t.specialization}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
