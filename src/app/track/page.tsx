"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

function TrackStatusContent() {
  const searchParams = useSearchParams();
  const initialReg = searchParams.get("regNumber") || "";

  const [regInput, setRegInput] = useState(initialReg);
  const [phoneInput, setPhoneInput] = useState("");
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchStatus(regNo?: string, phone?: string) {
    if (!regNo?.trim() && !phone?.trim()) {
      setError("Please enter a Registration Number or Registered Mobile Number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (regNo?.trim()) qs.set("regNumber", regNo.trim());
      if (phone?.trim()) qs.set("phone", phone.trim());
      const res = await fetch(`/api/registrations?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setRecord(null);
        setError(json.error || "Application record not found.");
      } else {
        setRecord(json.registration);
      }
    } catch {
      setError("Failed to look up registration status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialReg) {
      fetchStatus(initialReg, "");
    }
  }, [initialReg]);

  const steps = [
    { key: "DRAFT", label: "1. Draft Saved" },
    { key: "SUBMITTED", label: "2. Application Submitted" },
    { key: "UNDER_REVIEW", label: "3. Under Review" },
    { key: "APPROVED", label: "4. Registration Approved" },
    { key: "ENROLLED", label: "5. Admission Confirmed" },
  ];

  const getActiveStepIndex = () => {
    if (!record) return 0;
    if (record.admission?.status === "ENROLLED") return 4;
    if (record.status === "APPROVED") return 3;
    if (record.status === "UNDER_REVIEW") return 2;
    if (record.status === "SUBMITTED") return 1;
    return 0;
  };

  const activeIdx = getActiveStepIndex();

  return (
    <PublicLayout>
      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Application & Admission Status Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Enter your Registration Number or Registered Mobile Number to check
            document verification and admission progress.
          </p>
        </div>
      </section>

      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStatus(regInput, phoneInput);
          }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
        >
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={regInput}
              onChange={(e) => setRegInput(e.target.value)}
              placeholder="Enter Registration Number"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono uppercase"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Or Registered Mobile Number
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Check Status"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {!record && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-sm font-bold text-navy-900">
              Enter Application Details Above
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your unique Registration Number is generated immediately upon
              submitting the Online Registration Form.
            </p>
          </div>
        )}

        {record && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-mono font-bold text-royal-600">
                  {record.regNumber}
                </span>
                <h2 className="text-xl font-bold text-navy-900">
                  {record.fullName}
                </h2>
                <p className="text-xs text-slate-600">
                  Course: <strong>{record.course?.title}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase ${
                    record.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : record.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  Registration: {record.status}
                </span>
                {record.admission && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase bg-navy-800 text-white">
                    Admission: {record.admission.status}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {steps.map((st, idx) => {
                const done = idx <= activeIdx;
                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      done
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        done ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>{st.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Submitted Documents
                </h3>
                <div className="space-y-2 text-xs">
                  {(record.documents || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {doc.fileName}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          doc.verified
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Admission & Batch Allocation
                </h3>
                {record.admission?.student ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admission Number:</span>
                      <span className="font-mono font-bold text-navy-900">
                        {record.admission.admissionNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Student ID:</span>
                      <span className="font-mono font-bold text-royal-700">
                        {record.admission.student.studentCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Allocated Batch:</span>
                      <span className="font-semibold text-slate-900">
                        {record.admission.batch?.name ||
                          record.preferredBatch?.name ||
                          "—"}
                      </span>
                    </div>
                    <div className="pt-3">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-royal-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Proceed to Student Portal <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-600">
                    <p>
                      <strong>Preferred Batch:</strong>{" "}
                      {record.preferredBatch?.name || "Not specified"}
                    </p>
                    <p>
                      <strong>Review Remarks:</strong>{" "}
                      {record.reviewNotes ||
                        "Application is awaiting verification by the Admissions Office."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading Tracker...</div>}>
      <TrackStatusContent />
    </Suspense>
  );
}
