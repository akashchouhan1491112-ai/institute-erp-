"use client";

import React from "react";
import PublicLayout from "@/components/PublicLayout";
import { Camera, Award, Monitor, BookOpen, Users } from "lucide-react";

const GALLERY_ITEMS = [
  {
    title: "Smart Lecture Theatre",
    category: "Classrooms",
    desc: "Acoustic air-conditioned lecture hall with interactive digital boards and hybrid recording capability.",
    badge: "Smart Classroom",
  },
  {
    title: "Computer Based Test (CBT) Examination Lab",
    category: "Testing Infrastructure",
    desc: "Dedicated CBT center for scheduled mock tests and online assessments.",
    badge: "CBT Lab",
  },
  {
    title: "Academic Convocation & Merit Felicitation Hall",
    category: "Events & Achievements",
    desc: "Auditorium for academic seminars, orientation sessions, and annual merit awards.",
    badge: "Auditorium",
  },
  {
    title: "Reference Library & Individual Study Zone",
    category: "Library",
    desc: "Reference textbooks, previous year question archives, and quiet self-study cubicles.",
    badge: "Reading Room",
  },
  {
    title: "Faculty Doubt Resolution Counters",
    category: "Academic Support",
    desc: "Dedicated academic cubicles for scheduled one-on-one doubt clearing with subject faculty.",
    badge: "Academic Support",
  },
  {
    title: "Parent-Faculty Academic Review Room",
    category: "Parent Connect",
    desc: "Dedicated conference facility for periodic parent-faculty academic progress reviews.",
    badge: "Conference Room",
  },
];

export default function GalleryPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-royal-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Campus Infrastructure & Photo Gallery
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mt-2">
            Explore our smart classrooms, CBT examination labs, doubt-clearing zones,
            and annual rankers felicitation events.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between"
            >
              <div className="h-44 bg-gradient-to-br from-navy-800 via-royal-700 to-blue-500 p-6 text-white flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase bg-white/15 px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <Camera className="w-5 h-5 text-blue-200" />
                </div>
                <span className="inline-block w-fit bg-amber-400 text-navy-950 font-extrabold text-xs px-3 py-1 rounded-lg">
                  {item.badge}
                </span>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-base font-extrabold text-navy-900">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

