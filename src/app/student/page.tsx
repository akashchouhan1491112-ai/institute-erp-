"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrintableDocumentModal, {
  PrintableDocType,
} from "@/components/PrintableDocumentModal";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  LogOut,
  Printer,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";

export default function StudentPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "OVERVIEW"
    | "FEES"
    | "TIMETABLE_ATTENDANCE"
    | "MATERIALS"
    | "EXAMS"
    | "NOTIFICATIONS"
    | "PROFILE"
  >("OVERVIEW");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Printable Document Modal State
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    docType: PrintableDocType;
    data: any;
  }>({
    isOpen: false,
    docType: "RECEIPT",
    data: null,
  });

  // Razorpay Online Checkout Modal State
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    orderData: any;
    sandboxCreds: any;
    selectedMethod: string;
    upiId: string;
    processing: boolean;
  }>({
    isOpen: false,
    orderData: null,
    sandboxCreds: null,
    selectedMethod: "RAZORPAY_UPI",
    upiId: "",
    processing: false,
  });

  async function loadStudentPortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/student");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load student portal.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error loading student portal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentPortal();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function initiateRazorpayPayment(
    feeAssignmentId: string,
    installmentId: string | null,
    amount: number
  ) {
    setFeedback(null);
    try {
      const res = await fetch("/api/fees/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeAssignmentId,
          installmentId,
          amount,
          paymentMethod: "RAZORPAY_UPI",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Could not create Razorpay order.");
        return;
      }
      setCheckoutModal({
        isOpen: true,
        orderData: json.order,
        sandboxCreds: json.sandboxTestCredentials,
        selectedMethod: "RAZORPAY_UPI",
        upiId: "student@okicici",
        processing: false,
      });
    } catch {
      alert("Network error creating Razorpay order.");
    }
  }

  async function completeServerVerifiedPayment() {
    if (!checkoutModal.orderData || !checkoutModal.sandboxCreds) return;
    setCheckoutModal((prev) => ({ ...prev, processing: true }));
    try {
      const res = await fetch("/api/fees/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: checkoutModal.sandboxCreds.razorpay_order_id,
          razorpay_payment_id: checkoutModal.sandboxCreds.razorpay_payment_id,
          razorpay_signature: checkoutModal.sandboxCreds.razorpay_signature,
          feeAssignmentId: checkoutModal.orderData.feeAssignmentId,
          installmentId: checkoutModal.orderData.installmentId,
          amount: checkoutModal.orderData.amountInRupees,
          paymentMethod: checkoutModal.selectedMethod,
          feeCategory: "TUITION",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Payment verification failed.");
      } else {
        setCheckoutModal((prev) => ({ ...prev, isOpen: false, processing: false }));
        setFeedback(json.message);
        await loadStudentPortal();
        if (json.receipt) {
          setPrintModal({
            isOpen: true,
            docType: "RECEIPT",
            data: json.receipt,
          });
        }
      }
    } finally {
      setCheckoutModal((prev) => ({ ...prev, processing: false }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-navy-900 font-bold">
        Loading Student Portal...
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-600 font-bold">{error || "Student record not found"}</p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-navy-800 text-white text-xs font-bold"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const student = data.student;
  const attSummary = data.attendanceSummary;
  const feeAssignment = student.feeAssignments?.[0];
  const primaryBatch = student.batches?.[0]?.batch;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-navy-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-navy-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-royal-600 flex items-center justify-center font-extrabold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm block leading-none">
                  {data?.settings?.logoText || "Institute"} ERP
                </span>
                <span className="text-[11px] text-blue-300">
                  Student & Parent Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Student Mini Card */}
          <div className="p-4 m-4 rounded-2xl bg-navy-800 border border-navy-700 space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
              {student.studentCode}
            </span>
            <h2 className="font-extrabold text-sm text-white truncate">
              {student.fullName}
            </h2>
            <p className="text-[11px] text-blue-200 truncate">
              {student.course?.title}
            </p>
            <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Status: {student.status}
            </span>
          </div>

          <nav className="px-3 space-y-1 text-xs font-semibold">
            {[
              { id: "OVERVIEW", label: "Dashboard Overview", icon: Home },
              {
                id: "FEES",
                label: "Fee Payment & Receipts",
                icon: Wallet,
              },
              {
                id: "TIMETABLE_ATTENDANCE",
                label: "Timetable & Attendance",
                icon: Calendar,
              },
              {
                id: "MATERIALS",
                label: "Study Materials & Homework",
                icon: BookOpen,
              },
              {
                id: "EXAMS",
                label: "Exams & Results Marksheet",
                icon: Award,
              },
              {
                id: "NOTIFICATIONS",
                label: "Important Notifications",
                icon: Bell,
              },
              {
                id: "PROFILE",
                label: "Profile, ID Card & Docs",
                icon: User,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === item.id
                    ? "bg-royal-600 text-white shadow"
                    : "text-slate-300 hover:bg-navy-800 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-navy-800 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-blue-200"
          >
            ← Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900">
              Welcome back, {student.fullName}!
            </h1>
            <p className="text-xs text-slate-600">
              Student ID: <strong>{student.studentCode}</strong> | Admission No:{" "}
              <strong>{student.admissionNumber}</strong> | Session:{" "}
              <strong>{student.academicSession}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setPrintModal({
                  isOpen: true,
                  docType: "ID_CARD",
                  data: student,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5 text-royal-600" />
              Print Student ID Card
            </button>
            <button
              onClick={() =>
                setPrintModal({
                  isOpen: true,
                  docType: "ADMISSION_LETTER",
                  data: student,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold"
            >
              <FileText className="w-3.5 h-3.5" />
              Admission Confirmation PDF
            </button>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">
                  Attendance Percentage
                </span>
                <p className="text-2xl font-extrabold text-navy-900 mt-1">
                  {attSummary?.attendancePercentage}%
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {attSummary?.attendedClasses} / {attSummary?.totalClasses} Classes
                  Attended
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">
                  Total Fees Paid
                </span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                  ₹{Number(feeAssignment?.paidAmount || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Net Payable: ₹
                  {Number(feeAssignment?.netPayable || 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">
                  Outstanding Fee Dues
                </span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">
                  ₹
                  {Number(feeAssignment?.balanceAmount || 0).toLocaleString("en-IN")}
                </p>
                <button
                  onClick={() => setActiveTab("FEES")}
                  className="text-[11px] font-bold text-royal-600 hover:underline mt-1"
                >
                  Pay Installment Online →
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">
                  Published Exam Results
                </span>
                <p className="text-2xl font-extrabold text-navy-900 mt-1">
                  {student.examMarks?.length || 0} Tests
                </p>
                <p className="text-[11px] text-royal-600 font-semibold mt-1">
                  Latest Grade: {student.examMarks?.[0]?.grade || "—"}
                </p>
              </div>
            </div>

            {/* Course & Batch Schedule Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-navy-900">
                  Enrolled Course & Allocated Batch Timetable
                </h3>
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2 text-xs">
                  <p className="text-sm font-extrabold text-navy-900">
                    {student.course?.title || "—"} {student.course?.code ? `(${student.course.code})` : ""}
                  </p>
                  <p className="text-slate-700">
                    <strong>Batch Name:</strong>{" "}
                    {primaryBatch?.name || "Not Allocated"} {primaryBatch?.code ? `(${primaryBatch.code})` : ""}
                  </p>
                  <p className="text-slate-700">
                    <strong>Class Days & Timings:</strong>{" "}
                    {primaryBatch?.days || "—"} |{" "}
                    {primaryBatch?.timing || "—"}
                  </p>
                  <p className="text-slate-700">
                    <strong>Classroom / Mode:</strong>{" "}
                    {primaryBatch?.room || "—"} {primaryBatch?.mode ? `(${primaryBatch.mode})` : ""}
                  </p>
                  <p className="text-slate-700">
                    <strong>Batch Mentor:</strong>{" "}
                    {primaryBatch?.teacher?.fullName || "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab("FEES")}
                    className="px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold"
                  >
                    Pay Fees Online / Download Receipts
                  </button>
                  <button
                    onClick={() => setActiveTab("MATERIALS")}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                  >
                    Study Materials ({data.studyMaterials?.length || 0})
                  </button>
                  <button
                    onClick={() =>
                      setPrintModal({
                        isOpen: true,
                        docType: "CERTIFICATE",
                        data: student,
                      })
                    }
                    className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100"
                  >
                    Preview Completion Certificate
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-extrabold text-navy-900">
                  Recent Notifications & Alerts
                </h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {(data.notifications || []).slice(0, 4).map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-900">{n.title}</span>
                        <span className="text-[10px] bg-blue-100 text-royal-700 font-bold px-2 py-0.5 rounded-full">
                          {n.category}
                        </span>
                      </div>
                      <p className="text-slate-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEE PAYMENT & RECEIPTS */}
        {activeTab === "FEES" && (
          <div className="space-y-6">
            {feeAssignment ? (
              <>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-navy-900">
                        Student Fee Structure & Installment Schedule
                      </h2>
                      <p className="text-xs text-slate-500">
                        Plan: {feeAssignment.planType} | Scholarship Discount: ₹
                        {Number(feeAssignment.discountAmount).toLocaleString("en-IN")}{" "}
                        ({feeAssignment.discountReason || "Merit Concession"})
                      </p>
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase bg-blue-100 text-royal-700">
                      Status: {feeAssignment.status}
                    </span>
                  </div>

                  {/* Installments Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase">
                          <th className="p-3 rounded-tl-lg">#</th>
                          <th className="p-3">Installment Particulars</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Paid</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 rounded-tr-lg text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(feeAssignment.installments || []).map((inst: any) => {
                          const dueRem = Math.max(0, inst.amount - inst.paidAmount);
                          return (
                            <tr key={inst.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold">
                                #{inst.installmentNo}
                              </td>
                              <td className="p-3 font-semibold text-navy-900">
                                {inst.title}
                              </td>
                              <td className="p-3 text-slate-600">{inst.dueDate}</td>
                              <td className="p-3 text-right font-bold">
                                ₹{Number(inst.amount).toLocaleString("en-IN")}
                              </td>
                              <td className="p-3 text-right text-emerald-700 font-semibold">
                                ₹{Number(inst.paidAmount).toLocaleString("en-IN")}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    inst.status === "PAID"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : inst.status === "OVERDUE"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {inst.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {dueRem > 0 ? (
                                  <button
                                    onClick={() =>
                                      initiateRazorpayPayment(
                                        feeAssignment.id,
                                        inst.id,
                                        dueRem
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 bg-royal-600 hover:bg-royal-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow transition"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Pay ₹{dueRem.toLocaleString("en-IN")}
                                  </button>
                                ) : (
                                  <span className="text-emerald-700 font-bold">
                                    Cleared ✓
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History & Downloadable Receipts */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-navy-900">
                    Verified Payment History & Downloadable GST Receipts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase">
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Transaction Ref</th>
                          <th className="p-3 text-right">Amount Paid</th>
                          <th className="p-3 text-right">Receipt PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(student.payments || []).map((p: any) => (
                          <tr key={p.id}>
                            <td className="p-3 font-mono font-bold text-navy-900">
                              {p.receipt?.receiptNumber || "VERIFIED"}
                            </td>
                            <td className="p-3">
                              {new Date(p.paidAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="p-3 font-semibold">{p.paymentMethod}</td>
                            <td className="p-3 font-mono text-slate-600">
                              {p.transactionRef}
                            </td>
                            <td className="p-3 text-right font-extrabold text-emerald-700">
                              ₹{Number(p.amount).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 text-right">
                              {p.receipt && (
                                <button
                                  onClick={() =>
                                    setPrintModal({
                                      isOpen: true,
                                      docType: "RECEIPT",
                                      data: p.receipt,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download / Print
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-xs text-slate-600">
                No fee assignment found.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TIMETABLE & ATTENDANCE */}
        {activeTab === "TIMETABLE_ATTENDANCE" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy-900">
                  Date-Wise Class Attendance Ledger
                </h2>
                <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                  Overall Attendance: {attSummary?.attendancePercentage}%
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-3">Date</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Marked By Faculty</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(student.attendance || []).map((a: any) => (
                      <tr key={a.id}>
                        <td className="p-3 font-bold">{a.date}</td>
                        <td className="p-3">{a.batch?.name}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              a.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : a.status === "ABSENT"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{a.markedBy}</td>
                        <td className="p-3 text-slate-500">{a.remarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STUDY MATERIALS & ASSIGNMENTS */}
        {activeTab === "MATERIALS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-navy-900">
                Downloadable Study Materials, Notes & DPPs
              </h2>
              <div className="space-y-3">
                {(data.studyMaterials || []).map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                        {m.subject} • {m.category}
                      </span>
                      <span className="text-slate-500">
                        {m.teacher?.fullName || "Faculty"}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-navy-900 text-sm">
                      {m.title}
                    </h3>
                    <p className="text-slate-600">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-navy-900">
                Homework & Practice Assignments
              </h2>
              <div className="space-y-3">
                {(data.assignments || []).map((asg: any) => (
                  <div
                    key={asg.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-royal-700">
                        {asg.subject} (Max Marks: {asg.maxMarks})
                      </span>
                      <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                        Due: {asg.dueDate}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-navy-900 text-sm">
                      {asg.title}
                    </h3>
                    <p className="text-slate-600">{asg.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXAMS & RESULTS MARKSHEETS */}
        {activeTab === "EXAMS" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-navy-900">
                Published Examination Results & Printable Marksheets
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-3">Examination Title</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-center">Marks Obtained</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Grade & Rank</th>
                      <th className="p-3 text-right">Marksheet PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(student.examMarks || []).map((em: any) => (
                      <tr key={em.id}>
                        <td className="p-3">
                          <p className="font-bold text-navy-900">
                            {em.examination?.title}
                          </p>
                          <p className="text-slate-500">
                            {em.examination?.subject}
                          </p>
                        </td>
                        <td className="p-3">{em.examination?.examDate}</td>
                        <td className="p-3 text-center font-extrabold text-blue-700">
                          {em.marksObtained} / {em.maxMarks}
                        </td>
                        <td className="p-3 text-center font-bold">
                          {em.percentage}%
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {em.grade} (Rank #{em.rankInBatch || 1})
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              setPrintModal({
                                isOpen: true,
                                docType: "MARKSHEET",
                                data: {
                                  ...em,
                                  studentName: student.fullName,
                                  studentCode: student.studentCode,
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-800 text-white font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Scorecard
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: NOTIFICATIONS */}
        {activeTab === "NOTIFICATIONS" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-extrabold text-navy-900">
              All Student & Batch Notifications
            </h2>
            {(data.notifications || []).map((n: any) => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-navy-900 text-sm">
                    {n.title}
                  </span>
                  <span className="text-[11px] bg-blue-100 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                    {n.category}
                  </span>
                </div>
                <p className="text-slate-600">{n.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: PROFILE & VERIFIED DOCUMENTS */}
        {activeTab === "PROFILE" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
            <h2 className="text-lg font-extrabold text-navy-900">
              Student Personal, Guardian & Document Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Full Name</span>
                <span className="font-bold text-slate-900">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Birth / Gender</span>
                <span className="font-bold text-slate-900">
                  {student.dob} ({student.gender})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile & Email</span>
                <span className="font-bold text-slate-900">
                  {student.phone} | {student.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Father&apos;s Name</span>
                <span className="font-bold text-slate-900">
                  {student.guardian?.fatherName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Mother&apos;s Name</span>
                <span className="font-bold text-slate-900">
                  {student.guardian?.motherName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Guardian Phone</span>
                <span className="font-bold text-slate-900">
                  {student.guardian?.guardianPhone}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RAZORPAY ONLINE FEE CHECKOUT MODAL */}
      {checkoutModal.isOpen && checkoutModal.orderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-navy-900 to-royal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    Razorpay Secure Fee Checkout
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Order ID: {checkoutModal.orderData.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setCheckoutModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Payable Amount</span>
                  <span className="text-2xl font-extrabold text-navy-900">
                    ₹
                    {Number(
                      checkoutModal.orderData.amountInRupees
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Student ID</span>
                  <span className="font-mono font-bold text-royal-700">
                    {checkoutModal.orderData.studentCode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "RAZORPAY_UPI", label: "UPI (GPay / PhonePe)" },
                    { id: "RAZORPAY_CARD", label: "Debit / Credit Card" },
                    { id: "RAZORPAY_NETBANKING", label: "Net Banking" },
                    { id: "RAZORPAY_WALLET", label: "Wallets / BharatQR" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setCheckoutModal((prev) => ({
                          ...prev,
                          selectedMethod: m.id,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left font-bold transition ${
                        checkoutModal.selectedMethod === m.id
                          ? "border-royal-600 bg-blue-50 text-royal-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900">
                <strong>Server HMAC-SHA256 Verification Active:</strong> Clicking
                &ldquo;Authorize & Verify Payment&rdquo; sends the cryptographic order
                signature to <code>/api/fees/razorpay/verify</code> and generates an
                instant official PDF receipt.
              </div>

              <button
                type="button"
                disabled={checkoutModal.processing}
                onClick={completeServerVerifiedPayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg transition disabled:opacity-50"
              >
                {checkoutModal.processing
                  ? "Verifying HMAC Signature on Server..."
                  : `Authorize & Pay ₹${Number(
                      checkoutModal.orderData.amountInRupees
                    ).toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Document Modal */}
      <PrintableDocumentModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal((prev) => ({ ...prev, isOpen: false }))}
        docType={printModal.docType}
        data={printModal.data}
        instituteSettings={data.settings}
      />
    </div>
  );
}

