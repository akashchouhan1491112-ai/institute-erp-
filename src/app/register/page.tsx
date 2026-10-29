"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  CheckCircle2,
  Upload,
  ArrowRight,
  Search,
  AlertCircle,
} from "lucide-react";

function RegistrationFormContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "";

  const [overview, setOverview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedRecord, setSubmittedRecord] = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    fatherName: "",
    motherName: "",
    parentPhone: "",
    occupation: "",
    emergencyPhone: "",
    qualification: "",
    previousSchool: "",
    academicDetails: "",
    courseId: initialCourseId,
    preferredBatchId: "",
    regFeePaid: true,
    parentConsent: false,
    photoFileName: "",
    idProofFileName: "",
    marksheetFileName: "",
    otherDocFileName: "",
  });

  useEffect(() => {
    fetch("/api/public/overview")
      .then((r) => r.json())
      .then((res) => {
        setOverview(res);
        const defaultCourse =
          res?.courses?.find((c: any) => c.id === initialCourseId) ||
          res?.courses?.[0];
        if (defaultCourse) {
          setForm((prev) => ({
            ...prev,
            courseId: defaultCourse.id,
            preferredBatchId: defaultCourse.batches?.[0]?.id || "",
          }));
        }
      })
      .catch(console.error);
  }, [initialCourseId]);

  const courses = overview?.courses || [];
  const selectedCourse = courses.find((c: any) => c.id === form.courseId);
  const availableBatches = selectedCourse?.batches || [];

  async function handleSubmit(e: React.FormEvent, saveStatus: "SUBMITTED" | "DRAFT") {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const documents = [];
      if (form.photoFileName) {
        documents.push({
          docType: "PHOTO",
          title: "Student Photograph",
          fileName: form.photoFileName,
          mimeType: "image/jpeg",
        });
      }
      if (form.idProofFileName) {
        documents.push({
          docType: "ID_PROOF",
          title: "Identity Proof",
          fileName: form.idProofFileName,
          mimeType: "application/pdf",
        });
      }
      if (form.marksheetFileName) {
        documents.push({
          docType: "MARKSHEET",
          title: "Academic Marksheet",
          fileName: form.marksheetFileName,
          mimeType: "application/pdf",
        });
      }
      if (form.otherDocFileName) {
        documents.push({
          docType: "OTHER",
          title: "Supporting Document",
          fileName: form.otherDocFileName,
          mimeType: "application/pdf",
        });
      }

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: saveStatus,
          documents,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to submit registration.");
      } else {
        setSubmittedRecord(json.registration);
      }
    } catch {
      setError("Network error while submitting registration.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout settings={overview?.settings}>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Online Student Registration Form
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Complete all required fields to submit your registration application
            and receive your unique Registration Number.
          </p>
        </div>
      </section>

      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h2 className="text-base font-bold text-navy-900">
              No Active Courses Published Yet
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              An administrator must first publish at least one active course in
              the Administration Dashboard before online student registrations
              can be submitted.
            </p>
          </div>
        ) : submittedRecord ? (
          <div className="bg-white rounded-2xl border border-emerald-500 shadow-sm p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-700">
                    Registration Submitted
                  </span>
                  <h2 className="text-xl font-bold text-navy-900">
                    Application Recorded Successfully
                  </h2>
                </div>
              </div>
              <div className="bg-navy-900 text-white px-5 py-3 rounded-xl text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-300 block">
                  Registration Number
                </span>
                <span className="text-base font-mono font-bold text-white">
                  {submittedRecord.regNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Applicant Name</span>
                <span className="font-bold text-slate-900">
                  {submittedRecord.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Selected Course</span>
                <span className="font-bold text-navy-900">
                  {submittedRecord.course?.title}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Application Status</span>
                <span className="inline-block mt-0.5 bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                  {submittedRecord.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/track?regNumber=${encodeURIComponent(submittedRecord.regNumber)}`}
                className="inline-flex items-center gap-2 bg-navy-800 hover:bg-royal-600 text-white font-semibold text-xs px-5 py-3 rounded-xl transition"
              >
                <Search className="w-4 h-4" />
                Track Application Status
              </Link>
              <button
                onClick={() => setSubmittedRecord(null)}
                className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                New Application
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => handleSubmit(e, "SUBMITTED")}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {error && (
              <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-4 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-8">
              {/* 1. Personal Information */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 border-b border-slate-200 pb-2">
                  1. Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="student@domain.com"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Residential Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="Street address, locality"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.pinCode}
                      onChange={(e) =>
                        setForm({ ...form, pinCode: e.target.value })
                      }
                      placeholder="6-digit PIN code"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Parent / Guardian Information */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 border-b border-slate-200 pb-2">
                  2. Parent / Guardian Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father&apos;s Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fatherName}
                      onChange={(e) =>
                        setForm({ ...form, fatherName: e.target.value })
                      }
                      placeholder="Father's full name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mother&apos;s Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.motherName}
                      onChange={(e) =>
                        setForm({ ...form, motherName: e.target.value })
                      }
                      placeholder="Mother's full name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.parentPhone}
                      onChange={(e) =>
                        setForm({ ...form, parentPhone: e.target.value })
                      }
                      placeholder="10-digit mobile number"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Occupation *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.occupation}
                      onChange={(e) =>
                        setForm({ ...form, occupation: e.target.value })
                      }
                      placeholder="Occupation"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Emergency Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.emergencyPhone}
                      onChange={(e) =>
                        setForm({ ...form, emergencyPhone: e.target.value })
                      }
                      placeholder="10-digit emergency number"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Academic Information */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 border-b border-slate-200 pb-2">
                  3. Academic & Course Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selected Course *
                    </label>
                    <select
                      required
                      value={form.courseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const cObj = courses.find((x: any) => x.id === cid);
                        setForm({
                          ...form,
                          courseId: cid,
                          preferredBatchId: cObj?.batches?.[0]?.id || "",
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      {courses.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{Number(c.baseFee).toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Batch
                    </label>
                    <select
                      value={form.preferredBatchId}
                      onChange={(e) =>
                        setForm({ ...form, preferredBatchId: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="">Any Available Batch</option>
                      {availableBatches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.timing} ({b.mode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Class / Qualification *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.qualification}
                      onChange={(e) =>
                        setForm({ ...form, qualification: e.target.value })
                      }
                      placeholder="Current class or qualification"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Previous School / College *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.previousSchool}
                      onChange={(e) =>
                        setForm({ ...form, previousSchool: e.target.value })
                      }
                      placeholder="School or college name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Details (Percentage / CGPA / Board)
                    </label>
                    <input
                      type="text"
                      value={form.academicDetails}
                      onChange={(e) =>
                        setForm({ ...form, academicDetails: e.target.value })
                      }
                      placeholder="Enter academic percentage or board details"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Document Uploads */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900 border-b border-slate-200 pb-2">
                  4. Document Uploads
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-royal-600" />
                      Student Photograph
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setForm({ ...form, photoFileName: file.name });
                      }}
                      className="block w-full text-xs text-slate-600"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-royal-600" />
                      Identity Proof
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setForm({ ...form, idProofFileName: file.name });
                      }}
                      className="block w-full text-xs text-slate-600"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-royal-600" />
                      Previous Marksheet
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setForm({ ...form, marksheetFileName: file.name });
                      }}
                      className="block w-full text-xs text-slate-600"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-royal-600" />
                      Other Supporting Document (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setForm({ ...form, otherDocFileName: file.name });
                      }}
                      className="block w-full text-xs text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Consent */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={form.parentConsent}
                    onChange={(e) =>
                      setForm({ ...form, parentConsent: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-300 text-royal-600"
                  />
                  <span>
                    I confirm that the particulars submitted above are accurate
                    and authorize the institute to process this registration for
                    admission evaluation.
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleSubmit(e as any, "DRAFT")}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Registration"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading Registration Form...</div>}>
      <RegistrationFormContent />
    </Suspense>
  );
}
