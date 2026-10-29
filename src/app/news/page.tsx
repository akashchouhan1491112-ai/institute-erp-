"use client";

import React, { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Calendar, Bell } from "lucide-react";

export default function NewsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const announcements = Array.isArray(data?.cms?.ANNOUNCEMENTS?.data)
    ? data.cms.ANNOUNCEMENTS.data
    : [];

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            News, Notices & Academic Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Official circulars, schedule updates, and examination notices.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-bold text-navy-900">
              No Public Notices Published
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Official notices published by the administration will appear on
              this page.
            </p>
          </div>
        ) : (
          announcements.map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-100 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                    {item.tag || "NOTICE"}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                </div>
                <p className="text-sm font-bold text-navy-900">{item.text}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </PublicLayout>
  );
}
