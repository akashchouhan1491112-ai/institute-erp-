"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default function CoursesPage() {
  const [data, setData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const courses = data?.courses || [];
  const categories = [
    "ALL",
    ...Array.from(new Set(courses.map((c: any) => c.category))),
  ] as string[];

  const filteredCourses =
    selectedCategory === "ALL"
      ? courses
      : courses.filter((c: any) => c.category === selectedCategory);

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Academic Courses, Syllabus & Fee Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Detailed syllabus modules, batch schedules, eligibility criteria,
            and fee breakdown.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-navy-800 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-bold text-navy-900">
              No Courses Published Yet
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Courses created in the Administration Dashboard (Course
              Management) are dynamically displayed here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCourses.map((course: any) => {
              let syllabusList: string[] = [];
              try {
                syllabusList = JSON.parse(course.syllabusJson || "[]");
              } catch {
                syllabusList = [];
              }
              const totalBeforeTax =
                Number(course.baseFee) +
                Number(course.registrationFee) +
                Number(course.admissionFee) +
                Number(course.studyMatFee) +
                Number(course.examFee);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="bg-blue-50 text-royal-700 font-bold text-xs px-3 py-1 rounded-full">
                          {course.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                          {course.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-royal-600" />
                          {course.duration}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-navy-900">
                          {course.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-500 block">
                            Eligibility
                          </span>
                          <span className="font-bold text-slate-900">
                            {course.eligibility}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Faculty</span>
                          <span className="font-bold text-navy-800">
                            {course.facultySummary || "Assigned Faculty"}
                          </span>
                        </div>
                      </div>

                      {syllabusList.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2.5 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-royal-600" />
                            Course Syllabus
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {syllabusList.map((mod, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{mod}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2.5 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-royal-600" />
                          Available Batches
                        </h3>
                        {course.batches && course.batches.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {course.batches.map((b: any) => (
                              <div
                                key={b.id}
                                className="border border-slate-200 bg-slate-50 rounded-xl p-3 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-navy-900">
                                    {b.name}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                    {b.mode}
                                  </span>
                                </div>
                                <p className="text-slate-600">
                                  Timing: <strong>{b.timing}</strong> ({b.days})
                                </p>
                                <p className="text-slate-600">
                                  Enrolled:{" "}
                                  <strong>
                                    {b._count?.enrollments || 0}/{b.maxCapacity}
                                  </strong>
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No active batches scheduled yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-3">
                          <span className="text-[11px] font-bold uppercase text-royal-600">
                            Fee Structure
                          </span>
                          <h3 className="text-2xl font-bold text-navy-900 mt-0.5">
                            ₹{Number(course.baseFee).toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-slate-500">
                              {" "}
                              Base Tuition
                            </span>
                          </h3>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Registration Fee:
                            </span>
                            <span className="font-semibold">
                              ₹
                              {Number(course.registrationFee).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Admission Fee:
                            </span>
                            <span className="font-semibold">
                              ₹
                              {Number(course.admissionFee).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tuition Fee:</span>
                            <span className="font-semibold">
                              ₹{Number(course.baseFee).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Study Material Fee:
                            </span>
                            <span className="font-semibold">
                              ₹
                              {Number(course.studyMatFee).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Examination Fee:
                            </span>
                            <span className="font-semibold">
                              ₹{Number(course.examFee).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-navy-900">
                            <span>
                              Total (Excl. {course.gstPercent}% GST):
                            </span>
                            <span>
                              ₹{totalBeforeTax.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Link
                          href={`/register?courseId=${course.id}`}
                          className="w-full py-3 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                        >
                          Enroll Now
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
