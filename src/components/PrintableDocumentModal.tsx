"use client";

import React from "react";
import { Printer, X, CheckCircle2, ShieldCheck, Award } from "lucide-react";

export type PrintableDocType =
  | "RECEIPT"
  | "ADMISSION_LETTER"
  | "ID_CARD"
  | "MARKSHEET"
  | "CERTIFICATE";

interface PrintableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: PrintableDocType;
  data: any;
  instituteSettings?: any;
}

export default function PrintableDocumentModal({
  isOpen,
  onClose,
  docType,
  data,
  instituteSettings,
}: PrintableDocumentModalProps) {
  if (!isOpen || !data) return null;

  const instName =
    instituteSettings?.instituteName || "National Institute of Academic Studies";
  const instLogo = instituteSettings?.logoText || "NIAS";
  const instAddress =
    instituteSettings?.address ||
    "Academic Block, Institutional Area, New Delhi - 110016";
  const instPhone = instituteSettings?.phone || "+91 11 2650 0000";
  const instEmail = instituteSettings?.email || "office@institute.edu.in";
  const instGst = instituteSettings?.gstNumber || "07AAACN0000A1Z5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-8">
        <div className="no-print bg-navy-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide uppercase">
              Official Institutional Document
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 bg-white text-slate-900" id="printable-document-area">
          <div className="border-b-2 border-navy-700 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-navy-800 text-white flex items-center justify-center font-bold text-lg">
                {instLogo}
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy-900 tracking-tight">
                  {instName}
                </h2>
                <p className="text-xs text-slate-600 max-w-md">{instAddress}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Phone: {instPhone} | Email: {instEmail} | GSTIN: {instGst}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs px-3 py-1 rounded-full uppercase">
                {docType === "RECEIPT" && "Fee Receipt"}
                {docType === "ADMISSION_LETTER" && "Admission Confirmation"}
                {docType === "ID_CARD" && "Student Identity Card"}
                {docType === "MARKSHEET" && "Examination Scorecard"}
                {docType === "CERTIFICATE" && "Completion Certificate"}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Session: {instituteSettings?.academicSession || "2026-2027"}
              </p>
            </div>
          </div>

          {docType === "RECEIPT" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Receipt Number</span>
                  <span className="font-bold text-navy-900 text-sm">
                    {data.receiptNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(data.issuedAt || Date.now()).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Student ID</span>
                  <span className="font-bold text-blue-700">{data.studentCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Mode</span>
                  <span className="font-semibold text-emerald-700">
                    {data.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-500">Student Name</p>
                  <p className="font-bold text-slate-900">{data.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Transaction Reference</p>
                  <p className="font-mono font-semibold text-slate-800">
                    {data.transactionRef}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Course</p>
                  <p className="font-semibold text-slate-800">{data.courseTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Batch</p>
                  <p className="font-semibold text-slate-800">{data.batchName}</p>
                </div>
              </div>

              <table className="w-full text-sm border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-navy-800 text-white text-left text-xs uppercase">
                    <th className="p-3 border border-slate-200">Fee Category</th>
                    <th className="p-3 border border-slate-200 text-right">
                      Taxable Value
                    </th>
                    <th className="p-3 border border-slate-200 text-right">
                      GST Component
                    </th>
                    <th className="p-3 border border-slate-200 text-right">
                      Total Paid (INR)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-slate-200 font-medium">
                      {data.feeCategory}
                    </td>
                    <td className="p-3 border border-slate-200 text-right">
                      ₹
                      {Math.max(
                        0,
                        Number(data.amountPaid) - Number(data.taxAmount || 0)
                      ).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 border border-slate-200 text-right">
                      ₹{Number(data.taxAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 border border-slate-200 text-right font-bold text-navy-900">
                      ₹{Number(data.amountPaid).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-600">Balance Remaining:</p>
                  <p className="text-lg font-bold text-navy-900">
                    ₹{Number(data.balanceRemaining || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    VERIFIED RECEIPT
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Issued By: {data.issuedBy || "Accounts Office"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {docType === "ADMISSION_LETTER" && (
            <div className="space-y-5 text-sm">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 font-bold uppercase">
                    Admission Confirmed
                  </p>
                  <p className="text-base font-bold text-navy-900">
                    Admission No: {data.admissionNumber} | Student ID: {data.studentCode}
                  </p>
                </div>
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-500 block">Full Name</span>
                  <span className="font-bold text-slate-900">{data.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Birth / Gender</span>
                  <span className="font-semibold text-slate-800">
                    {data.dob} ({data.gender})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mobile</span>
                  <span className="font-semibold text-slate-800">{data.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email</span>
                  <span className="font-semibold text-slate-800">{data.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Guardian</span>
                  <span className="font-semibold text-slate-800">
                    {data.guardian?.fatherName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Qualification</span>
                  <span className="font-semibold text-slate-800">
                    {data.qualification}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-1 text-xs">
                <h4 className="font-bold text-navy-900 uppercase">
                  Course & Batch Allocation
                </h4>
                <p className="font-semibold text-sm text-navy-900">
                  {data.course?.title || "—"}
                </p>
                <p className="text-slate-600">
                  Batch: {data.batches?.[0]?.batch?.name || "—"} | Schedule:{" "}
                  {data.batches?.[0]?.batch?.timing || "—"}
                </p>
              </div>
            </div>
          )}

          {docType === "ID_CARD" && (
            <div className="flex justify-center py-4">
              <div className="w-96 rounded-2xl overflow-hidden border-2 border-navy-800 shadow bg-white">
                <div className="bg-navy-800 text-white p-4 text-center">
                  <h3 className="font-bold text-sm">{instName}</h3>
                  <p className="text-[11px] text-blue-200">
                    STUDENT IDENTITY CARD ({data.academicSession || "2026-2027"})
                  </p>
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xl font-bold text-navy-900 mb-3">
                    {data.fullName
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <h4 className="text-base font-bold text-navy-900">
                    {data.fullName}
                  </h4>
                  <span className="mt-1 inline-block bg-navy-800 text-white font-mono text-xs font-bold px-3 py-0.5 rounded-full">
                    {data.studentCode}
                  </span>
                  <div className="w-full mt-4 pt-3 border-t border-slate-200 text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Admission No:</span>
                      <span className="font-semibold">{data.admissionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Course:</span>
                      <span className="font-semibold text-right max-w-[200px] truncate">
                        {data.course?.title || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-semibold">{data.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {docType === "MARKSHEET" && (
            <div className="space-y-5 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Student Name</span>
                  <span className="font-bold text-slate-900">{data.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Student ID</span>
                  <span className="font-bold text-blue-700">{data.studentCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Exam Code</span>
                  <span className="font-mono font-bold text-slate-800">
                    {data.examination?.code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Exam Date</span>
                  <span className="font-semibold text-slate-800">
                    {data.examination?.examDate}
                  </span>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-navy-800 text-white uppercase">
                    <th className="p-3 border border-slate-200 text-left">
                      Examination & Subject
                    </th>
                    <th className="p-3 border border-slate-200 text-center">
                      Max Marks
                    </th>
                    <th className="p-3 border border-slate-200 text-center">
                      Marks Obtained
                    </th>
                    <th className="p-3 border border-slate-200 text-center">
                      Percentage
                    </th>
                    <th className="p-3 border border-slate-200 text-center">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-slate-200">
                      <p className="font-bold text-navy-900">
                        {data.examination?.title}
                      </p>
                      <p className="text-slate-500">{data.examination?.subject}</p>
                    </td>
                    <td className="p-3 border border-slate-200 text-center">
                      {data.maxMarks}
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-bold text-blue-700">
                      {data.marksObtained}
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-bold">
                      {data.percentage}%
                    </td>
                    <td className="p-3 border border-slate-200 text-center font-bold">
                      {data.grade}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {docType === "CERTIFICATE" && (
            <div className="border-2 border-navy-800 rounded-2xl p-8 text-center space-y-4">
              <Award className="w-12 h-12 text-navy-800 mx-auto" />
              <h3 className="text-xl font-bold text-navy-900 uppercase">
                Course Completion Certificate
              </h3>
              <p className="text-xs text-slate-600">This is to certify that</p>
              <p className="text-xl font-bold text-royal-600">
                {data.fullName} ({data.studentCode})
              </p>
              <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                has completed the prescribed coursework for{" "}
                <strong>{data.course?.title || "the enrolled academic program"}</strong>{" "}
                during Academic Session {data.academicSession || "2026-2027"}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
