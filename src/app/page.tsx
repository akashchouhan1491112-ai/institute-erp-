"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Bell,
  Send,
} from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseInterest: "",
    message: "",
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryFeedback, setEnquiryFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        if (res?.courses?.[0]?.title) {
          setEnquiryForm((prev) => ({
            ...prev,
            courseInterest: res.courses[0].title,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnquirySubmitting(true);
    setEnquiryFeedback(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiryForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setEnquiryFeedback({
          type: "error",
          text: json.error || "Could not submit enquiry.",
        });
      } else {
        setEnquiryFeedback({
          type: "success",
          text: json.message || "Enquiry recorded successfully.",
        });
        setEnquiryForm((prev) => ({
          ...prev,
          name: "",
          phone: "",
          email: "",
          message: "",
        }));
      }
    } catch {
      setEnquiryFeedback({
        type: "error",
        text: "Network error while submitting enquiry.",
      });
    } finally {
      setEnquirySubmitting(false);
    }
  }

  const settings = data?.settings;
  const heroCms = data?.cms?.HERO;
  const announcements = Array.isArray(data?.cms?.ANNOUNCEMENTS?.data)
    ? data.cms.ANNOUNCEMENTS.data
    : [];
  const achievements = Array.isArray(data?.cms?.ACHIEVEMENTS?.data)
    ? data.cms.ACHIEVEMENTS.data
    : [];
  const testimonials = Array.isArray(data?.cms?.TESTIMONIALS?.data)
    ? data.cms.TESTIMONIALS.data
    : [];
  const courses = data?.courses || [];
  const teachers = data?.teachers || [];

  return (
    <PublicLayout settings={settings}>
      {/* 1. HERO BANNER */}
      <section className="bg-navy-900 text-white py-16 lg:py-24 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-200">
                {heroCms?.data?.badge || "Academic Session 2026–2027"}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                {heroCms?.title ||
                  "Structured Academic Coaching & Institutional ERP Platform"}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {heroCms?.subtitle ||
                  "Centralized portal for online registrations, admissions, fee management, attendance tracking, and examination evaluation."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-royal-600 hover:bg-royal-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm transition"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Explore Courses
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 px-2 py-2"
                >
                  Track Application Status →
                </Link>
              </div>

              {heroCms?.data?.stats && (
                <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-navy-800">
                  {heroCms.data.stats.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-navy-800/70 rounded-xl p-3.5 border border-navy-700"
                    >
                      <p className="text-lg font-bold text-white">{st.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{st.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admission Enquiry Form */}
            <div className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-royal-600">
                      Admissions Office
                    </span>
                    <h2 className="text-lg font-bold text-navy-900">
                      Admission Enquiry Form
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-navy-800 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                {enquiryFeedback && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold border ${
                      enquiryFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {enquiryFeedback.text}
                  </div>
                )}

                <form onSubmit={handleEnquirySubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={enquiryForm.name}
                      onChange={(e) =>
                        setEnquiryForm({ ...enquiryForm, name: e.target.value })
                      }
                      placeholder="Enter student or parent name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.phone}
                        onChange={(e) =>
                          setEnquiryForm({
                            ...enquiryForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="10-digit mobile"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) =>
                          setEnquiryForm({
                            ...enquiryForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="email@domain.com"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Interested Course *
                    </label>
                    {courses.length > 0 ? (
                      <select
                        value={enquiryForm.courseInterest}
                        onChange={(e) =>
                          setEnquiryForm({
                            ...enquiryForm,
                            courseInterest: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:border-royal-600 focus:outline-none"
                      >
                        {courses.map((c: any) => (
                          <option key={c.id} value={c.title}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={enquiryForm.courseInterest}
                        onChange={(e) =>
                          setEnquiryForm({
                            ...enquiryForm,
                            courseInterest: e.target.value,
                          })
                        }
                        placeholder="Enter program or course name"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={2}
                      value={enquiryForm.message}
                      onChange={(e) =>
                        setEnquiryForm({
                          ...enquiryForm,
                          message: e.target.value,
                        })
                      }
                      placeholder="Enter your enquiry details"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-royal-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="w-full py-3 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {enquirySubmitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LATEST ANNOUNCEMENTS (Only shown when published by Admin) */}
      {announcements.length > 0 && (
        <section className="bg-navy-800 text-white py-4 border-b border-navy-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-full">
                <Bell className="w-3.5 h-3.5" />
                ANNOUNCEMENTS
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-xs">
              {announcements.slice(0, 3).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-navy-900/60 border border-navy-700 rounded-lg px-3 py-2 flex items-start gap-2"
                >
                  <span className="text-blue-300 font-bold shrink-0">
                    [{item.tag || "NOTICE"}]
                  </span>
                  <span className="text-slate-200 line-clamp-2">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. WHY CHOOSE US / PLATFORM CAPABILITIES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
              Why Choose Our Institute
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">
              Comprehensive Academic & Student Lifecycle Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Integrated classroom instruction, structured study materials,
              scheduled examinations, and transparent ERP tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Dedicated Subject Faculty",
                desc: "Structured classroom lectures and scheduled doubt-resolution sessions for every batch.",
              },
              {
                icon: TrendingUp,
                title: "Regular Examination Series",
                desc: "Periodic unit, mock, and cumulative examinations with published scorecards and batch rankings.",
              },
              {
                icon: ShieldCheck,
                title: "Transparent Student & Parent ERP",
                desc: "Online access to daily attendance records, fee ledgers, GST receipts, and study materials.",
              },
              {
                icon: Clock,
                title: "Regulated Batch Capacity",
                desc: "Managed batch sizes with structured offline, online, and hybrid timetable allocations.",
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy-900">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COURSES SECTION (Dynamically loaded from DB) */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
                Academic Programs
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
                Available Courses
              </h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-600 hover:text-navy-900"
            >
              View Course Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-2xl bg-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-navy-900">
                No Courses Published Yet
              </p>
              <p className="text-xs text-slate-500">
                Courses added in the Administration Dashboard (Course Management)
                will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-blue-50 text-royal-700 border border-blue-200 font-bold text-[11px] px-3 py-1 rounded-full">
                        {course.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-navy-900">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {course.shortDesc}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        Base Fee
                      </span>
                      <span className="text-base font-bold text-navy-900">
                        ₹{Number(course.baseFee).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Link
                      href={`/register?courseId=${course.id}`}
                      className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-royal-600 text-white text-xs font-semibold transition"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. FACULTY HIGHLIGHTS (Only shown when faculty records exist in DB) */}
      {teachers.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
                  Academic Department
                </span>
                <h2 className="text-2xl font-bold text-navy-900 mt-1">
                  Faculty Members
                </h2>
              </div>
              <Link
                href="/faculty"
                className="text-xs font-bold text-royal-600 hover:text-navy-900"
              >
                View Faculty Directory →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teachers.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2"
                >
                  <h3 className="text-sm font-bold text-navy-900">
                    {t.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-royal-600">
                    {t.designation}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t.qualification} • {t.specialization}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. ACHIEVEMENTS & TESTIMONIALS (Only rendered if populated in CMS) */}
      {achievements.length > 0 && (
        <section className="py-16 bg-navy-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">
              Student Results & Selections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {achievements.map((ach: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-navy-800 border border-navy-700 rounded-2xl p-5 space-y-2"
                >
                  <span className="text-xs font-bold text-blue-300">
                    {ach.rank} — {ach.exam}
                  </span>
                  <h3 className="text-base font-bold">{ach.name}</h3>
                  <p className="text-xs text-slate-300">{ach.college}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-8">
              Student & Parent Feedback
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700">{item.text}</p>
                  <p className="font-bold text-xs text-navy-900">
                    {item.author} — {item.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
