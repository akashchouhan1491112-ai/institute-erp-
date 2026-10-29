"use client";

import React, { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Award } from "lucide-react";

export default function ResultsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const achievements = Array.isArray(data?.cms?.ACHIEVEMENTS?.data)
    ? data.cms.ACHIEVEMENTS.data
    : [];

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Examination Results & Academic Achievements
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Official examination results and student selections published by the
            institute.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {achievements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Award className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-bold text-navy-900">
              No Public Result Highlights Published Yet
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Enrolled students can view and download their individual
              examination scorecards directly inside the Student Portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-navy-800 text-white font-bold text-xs px-3 py-1 rounded-full">
                    {item.rank} — {item.exam}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {item.score}
                  </span>
                </div>
                <h3 className="text-base font-bold text-navy-900">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-600">{item.college}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
