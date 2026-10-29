"use client";

import React, { useEffect, useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { MapPin, Phone, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseInterest: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        if (res?.courses?.[0]?.title) {
          setForm((prev) => ({
            ...prev,
            courseInterest: res.courses[0].title,
          }));
        }
      })
      .catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setFeedback(json.message || "Enquiry recorded.");
        setForm({ ...form, name: "", phone: "", email: "", message: "" });
      } else {
        setFeedback(json.error || "Failed to submit enquiry.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const branches = data?.branches || [];

  return (
    <PublicLayout settings={data?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Contact Us & Campus Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Reach out to our admissions desk or submit an online enquiry.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-lg font-bold text-navy-900">Campus Branches</h2>
          {branches.map((b: any) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-900">{b.name}</h3>
                <span className="bg-blue-50 text-royal-700 font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {b.code}
                </span>
              </div>
              <p className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-royal-600 shrink-0 mt-0.5" />
                <span>
                  {b.address}, {b.city}, {b.state}
                </span>
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-royal-600 shrink-0" />
                <span>{b.phone}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-royal-600 shrink-0" />
                <span>{b.email}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-navy-900">
              Send an Admission Enquiry
            </h2>
            {feedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {feedback}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@domain.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Interested Course *
              </label>
              <input
                type="text"
                required
                value={form.courseInterest}
                onChange={(e) =>
                  setForm({ ...form, courseInterest: e.target.value })
                }
                placeholder="Enter course or program name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message *
              </label>
              <textarea
                rows={3}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Enter your message"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
