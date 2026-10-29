"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PrintableDocumentModal, {
  PrintableDocType,
} from "@/components/PrintableDocumentModal";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  MessageSquare,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

type AdminModuleId =
  | "DASHBOARD"
  | "STUDENTS"
  | "REGISTRATIONS"
  | "ADMISSIONS"
  | "COURSES"
  | "BATCHES"
  | "TEACHERS"
  | "FEES"
  | "ATTENDANCE"
  | "EXAMS"
  | "RESULTS"
  | "TIMETABLE"
  | "MATERIALS"
  | "ENQUIRIES"
  | "NOTIFICATIONS"
  | "REPORTS"
  | "CMS"
  | "SETTINGS";

const ADMIN_MODULES: { id: AdminModuleId; label: string; icon: any }[] = [
  { id: "DASHBOARD", label: "1. Dashboard Overview", icon: Home },
  { id: "STUDENTS", label: "2. Student Management", icon: Users },
  { id: "REGISTRATIONS", label: "3. Registration Management", icon: FileText },
  { id: "ADMISSIONS", label: "4. Admission Management", icon: UserCheck },
  { id: "COURSES", label: "5. Course Management", icon: BookOpen },
  { id: "BATCHES", label: "6. Batch Management", icon: Layers },
  { id: "TEACHERS", label: "7. Teacher Management", icon: GraduationCap },
  { id: "FEES", label: "8. Fee Management", icon: Wallet },
  { id: "ATTENDANCE", label: "9. Attendance Management", icon: ClipboardCheck },
  { id: "EXAMS", label: "10. Examination Management", icon: Calendar },
  { id: "RESULTS", label: "11. Results Management", icon: Award },
  { id: "TIMETABLE", label: "12. Timetable Management", icon: Clock },
  { id: "MATERIALS", label: "13. Study Materials", icon: FolderOpen },
  { id: "ENQUIRIES", label: "14. Enquiry Management", icon: MessageSquare },
  { id: "NOTIFICATIONS", label: "15. Notifications", icon: Bell },
  { id: "REPORTS", label: "16. Reports & Analytics", icon: BarChart3 },
  { id: "CMS", label: "17. Website CMS", icon: Globe },
  { id: "SETTINGS", label: "18. Settings & Roles", icon: Settings },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<AdminModuleId>("DASHBOARD");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Printable Document Modal
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    docType: PrintableDocType;
    data: any;
  }>({
    isOpen: false,
    docType: "RECEIPT",
    data: null,
  });

  // Forms State
  const [newCourse, setNewCourse] = useState({
    code: "",
    title: "",
    category: "COMPETITIVE_EXAMS",
    duration: "",
    eligibility: "",
    baseFee: "",
    gstPercent: "18",
    capacity: "60",
    shortDesc: "",
    syllabus: "",
  });

  const [newBatch, setNewBatch] = useState({
    code: "",
    name: "",
    courseId: "",
    teacherId: "",
    days: "",
    timing: "",
    mode: "OFFLINE",
    room: "",
    maxCapacity: "40",
  });

  const [newTeacher, setNewTeacher] = useState({
    fullName: "",
    email: "",
    phone: "",
    designation: "",
    specialization: "",
    qualification: "",
    experienceYears: "",
  });

  const [newStudent, setNewStudent] = useState({
    fullName: "",
    email: "",
    phone: "",
    parentPhone: "",
    fatherName: "",
    motherName: "",
    courseId: "",
    batchId: "",
    discountAmount: "0",
  });

  const [offlinePayForm, setOfflinePayForm] = useState({
    feeAssignmentId: "",
    amount: "",
    paymentMethod: "OFFLINE_CASH",
    transactionRef: "",
    notes: "",
  });

  const [concessionForm, setConcessionForm] = useState({
    feeAssignmentId: "",
    discountAmount: "",
    discountReason: "",
    lateFeeAmount: "0",
  });

  const [refundForm, setRefundForm] = useState({
    paymentId: "",
    amount: "",
    reason: "",
    mode: "BANK_TRANSFER",
  });

  const [newExam, setNewExam] = useState({
    title: "",
    courseId: "",
    batchId: "",
    subject: "",
    examDate: "",
    maxMarks: "100",
    passingMarks: "35",
    examType: "UNIT_TEST",
  });

  const [notifForm, setNotifForm] = useState({
    roleTarget: "ALL",
    title: "",
    message: "",
    category: "ANNOUNCEMENT",
    channel: "IN_APP",
  });

  const [cmsHeroForm, setCmsHeroForm] = useState({
    title: "",
    subtitle: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    instituteName: "",
    tagline: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    academicSession: "2026-2027",
    gstNumber: "",
    defaultGstPercent: 18,
  });

  async function loadAdminData() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/admin");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.courses?.[0] && !newBatch.courseId) {
          setNewBatch((p) => ({
            ...p,
            courseId: json.courses[0].id,
            teacherId: json.teachers?.[0]?.id || "",
          }));
          setNewStudent((p) => ({
            ...p,
            courseId: json.courses[0].id,
            batchId: json.batches?.[0]?.id || "",
          }));
          setNewExam((p) => ({
            ...p,
            courseId: json.courses[0].id,
            batchId: json.batches?.[0]?.id || "",
          }));
        }
        if (json.feeAssignments?.[0] && !offlinePayForm.feeAssignmentId) {
          setOfflinePayForm((p) => ({
            ...p,
            feeAssignmentId: json.feeAssignments[0].id,
          }));
          setConcessionForm((p) => ({
            ...p,
            feeAssignmentId: json.feeAssignments[0].id,
          }));
        }
        if (json.payments?.[0] && !refundForm.paymentId) {
          setRefundForm((p) => ({
            ...p,
            paymentId: json.payments[0].id,
          }));
        }
        const heroBlock = (json.cmsBlocks || []).find(
          (b: any) => b.section === "HERO"
        );
        if (heroBlock && !cmsHeroForm.title) {
          setCmsHeroForm({
            title: heroBlock.title,
            subtitle: heroBlock.subtitle || "",
          });
        }
        if (json.settings && !settingsForm.instituteName) {
          setSettingsForm({
            instituteName: json.settings.instituteName,
            tagline: json.settings.tagline,
            address: json.settings.address,
            phone: json.settings.phone,
            whatsapp: json.settings.whatsapp,
            email: json.settings.email,
            academicSession: json.settings.academicSession,
            gstNumber: json.settings.gstNumber,
            defaultGstPercent: json.settings.defaultGstPercent,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Export any array of objects to CSV
  function exportToCsv(filename: string, rows: Record<string, any>[]) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Approve Registration or Update Status
  async function handleUpdateRegistration(
    id: string,
    status: string,
    reviewNotes: string
  ) {
    const res = await fetch("/api/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        reviewNotes,
        verifyAllDocs: status === "APPROVED",
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(`Registration updated to ${status}.`);
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Convert Approved Registration -> Confirmed Admission & Enrolled Student
  async function handleConvertAdmission(reg: any, overrideCapacity = false) {
    const res = await fetch("/api/admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: reg.id,
        courseId: reg.courseId,
        batchId: reg.preferredBatchId || data.batches?.[0]?.id,
        scholarshipDiscount: 5000,
        discountReason: "Merit Admission Scholarship",
        planType: "INSTALLMENT",
        overrideCapacity,
      }),
    });
    const json = await res.json();
    if (res.status === 409 && json.capacityFull) {
      if (
        confirm(
          `${json.error}\n\nClick OK to explicitly override batch capacity as Administrator.`
        )
      ) {
        return handleConvertAdmission(reg, true);
      }
      return;
    }
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
    } else {
      alert(json.error || "Failed to enroll student.");
    }
  }

  // Add Course
  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(`Course "${json.course.title}" created!`);
      setNewCourse({ ...newCourse, code: "", title: "", shortDesc: "" });
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Add Batch
  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBatch),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(`Batch "${json.batch.name}" created!`);
      setNewBatch({ ...newBatch, code: "", name: "" });
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Add Teacher
  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_TEACHER", ...newTeacher }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setNewTeacher({ ...newTeacher, fullName: "", email: "", phone: "" });
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Direct Add Student
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStudent),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(
        `Student ${json.student.fullName} (${json.student.studentCode}) enrolled!`
      );
      setNewStudent({ ...newStudent, fullName: "", email: "", phone: "" });
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Change Student Status (preserves fee transactions)
  async function handleChangeStudentStatus(studentId: string, status: string) {
    const res = await fetch("/api/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: studentId, status }),
    });
    if (res.ok) {
      setFeedback(`Student status updated to ${status} (Fee history preserved).`);
      await loadAdminData();
    }
  }

  // Record Verified Offline Payment
  async function handleRecordOfflinePayment(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RECORD_OFFLINE_PAYMENT",
        ...offlinePayForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
      if (json.receipt) {
        setPrintModal({
          isOpen: true,
          docType: "RECEIPT",
          data: json.receipt,
        });
      }
    } else {
      alert(json.error);
    }
  }

  // Apply Concession / Late Fee
  async function handleAdjustConcession(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADJUST_CONCESSION_OR_LATE_FEE",
        ...concessionForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Process Refund
  async function handleProcessRefund(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PROCESS_REFUND",
        ...refundForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Create Exam
  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_EXAM",
        ...newExam,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setNewExam({ ...newExam, title: "" });
      await loadAdminData();
    } else {
      alert(json.error);
    }
  }

  // Update Enquiry Status
  async function handleUpdateEnquiry(
    id: string,
    status: string,
    notes: string,
    followUpDate: string
  ) {
    const res = await fetch("/api/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes, followUpDate }),
    });
    if (res.ok) {
      setFeedback(`Enquiry updated to ${status}.`);
      await loadAdminData();
    }
  }

  // Send Notification
  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SEND_NOTIFICATION",
        ...notifForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setNotifForm({ ...notifForm, title: "", message: "" });
      await loadAdminData();
    }
  }

  // Save CMS Hero Block
  async function handleUpdateHeroCms(e: React.FormEvent) {
    e.preventDefault();
    const existingHero = (data.cmsBlocks || []).find(
      (b: any) => b.section === "HERO"
    );
    let parsedContent = {};
    try {
      parsedContent = existingHero?.contentJson
        ? JSON.parse(existingHero.contentJson)
        : {};
    } catch {
      parsedContent = {};
    }

    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_CMS_BLOCK",
        section: "HERO",
        title: cmsHeroForm.title,
        subtitle: cmsHeroForm.subtitle,
        contentJson: parsedContent,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
    }
  }

  // Save Institute Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_SETTINGS",
        ...settingsForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadAdminData();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-navy-900 font-bold">
        Loading 18-Module Admin ERP Dashboard...
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const students = data?.students || [];
  const registrations = data?.registrations || [];
  const admissions = data?.admissions || [];
  const courses = data?.courses || [];
  const batches = data?.batches || [];
  const teachers = data?.teachers || [];
  const feeAssignments = data?.feeAssignments || [];
  const payments = data?.payments || [];
  const receipts = data?.receipts || [];
  const refunds = data?.refunds || [];
  const examinations = data?.examinations || [];
  const enquiries = data?.enquiries || [];
  const notifications = data?.notifications || [];
  const auditLogs = data?.auditLogs || [];

  const filteredStudents = students.filter((s: any) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Left 18-Module Sidebar */}
      <aside className="w-full lg:w-72 bg-navy-900 text-white flex flex-col justify-between shrink-0 max-h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div>
          <div className="p-4 border-b border-navy-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-royal-600 flex items-center justify-center font-extrabold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm block leading-none">
                  {data?.settings?.logoText || "Institute"} ERP
                </span>
                <span className="text-[10px] text-amber-300 font-bold uppercase">
                  Admin Command Center
                </span>
              </div>
            </Link>
          </div>

          <nav className="p-2.5 space-y-0.5 text-xs font-semibold">
            {ADMIN_MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                  activeModule === mod.id
                    ? "bg-royal-600 text-white shadow"
                    : "text-slate-300 hover:bg-navy-800 hover:text-white"
                }`}
              >
                <mod.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{mod.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-navy-800 space-y-1.5">
          <Link
            href="/"
            className="w-full block text-center py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-blue-200"
          >
            ← View Live Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-7 overflow-y-auto space-y-6">
        {/* Top Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-royal-600">
              {data?.settings?.instituteName} • Session{" "}
              {data?.settings?.academicSession}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900">
              {ADMIN_MODULES.find((m) => m.id === activeModule)?.label}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadAdminData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Live Data
            </button>
            <Link
              href="/student"
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-royal-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"
            >
              Preview Student Portal
            </Link>
            <Link
              href="/teacher"
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-royal-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"
            >
              Preview Faculty Portal
            </Link>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
            <span>✓ {feedback}</span>
            <button onClick={() => setFeedback(null)} className="font-bold px-2">
              ✕
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 1: DASHBOARD OVERVIEW */}
        {/* =================================================================== */}
        {activeModule === "DASHBOARD" && (
          <div className="space-y-6">
            {/* 12 Overview KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                {
                  label: "Total Registrations",
                  val: kpis.totalRegisteredStudents,
                  sub: `${kpis.pendingAdmissionRequests} Pending Review`,
                  color: "text-navy-900",
                },
                {
                  label: "Active Students",
                  val: kpis.totalActiveStudents,
                  sub: `${kpis.newAdmissions} Confirmed Admissions`,
                  color: "text-royal-600",
                },
                {
                  label: "Courses & Batches",
                  val: `${kpis.totalCourses} / ${kpis.activeBatches}`,
                  sub: `${kpis.totalTeachers} Active Faculty`,
                  color: "text-navy-900",
                },
                {
                  label: "Total Fees Collected",
                  val: `₹${Number(kpis.totalCollectedFees || 0).toLocaleString(
                    "en-IN"
                  )}`,
                  sub: `Today: ₹${Number(
                    kpis.todaysFeeCollection || 0
                  ).toLocaleString("en-IN")}`,
                  color: "text-emerald-700",
                },
                {
                  label: "Pending Fee Dues",
                  val: `₹${Number(kpis.pendingFees || 0).toLocaleString("en-IN")}`,
                  sub: `Overdue: ₹${Number(
                    kpis.overdueFees || 0
                  ).toLocaleString("en-IN")}`,
                  color: "text-amber-600",
                },
                {
                  label: "Today's Attendance",
                  val: `${kpis.todaysAttendanceRate}%`,
                  sub: `${kpis.upcomingExamsCount} Upcoming Exams`,
                  color: "text-emerald-700",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"
                >
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {card.label}
                  </span>
                  <p className={`text-lg font-extrabold mt-1 ${card.color}`}>
                    {card.val}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Action Cards & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Pending Registrations for Approval */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-navy-900">
                    Pending Online Registrations (Action Required)
                  </h2>
                  <button
                    onClick={() => setActiveModule("REGISTRATIONS")}
                    className="text-xs font-bold text-royal-600 hover:underline"
                  >
                    Open Full Module →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase">
                        <th className="p-2.5">Reg No</th>
                        <th className="p-2.5">Applicant</th>
                        <th className="p-2.5">Course</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {registrations.slice(0, 5).map((r: any) => (
                        <tr key={r.id}>
                          <td className="p-2.5 font-mono font-bold text-royal-700">
                            {r.regNumber}
                          </td>
                          <td className="p-2.5 font-bold text-navy-900">
                            {r.fullName}
                          </td>
                          <td className="p-2.5 truncate max-w-[160px]">
                            {r.course?.title}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            {r.admission?.studentId ? (
                              <span className="text-emerald-700 font-bold">
                                Enrolled ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConvertAdmission(r)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                              >
                                Approve & Enroll
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Verified Fee Transactions */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-navy-900">
                    Recent Fee Transactions
                  </h2>
                  <button
                    onClick={() => setActiveModule("FEES")}
                    className="text-xs font-bold text-royal-600 hover:underline"
                  >
                    Fee Ledger →
                  </button>
                </div>
                <div className="space-y-2.5 text-xs">
                  {payments.slice(0, 4).map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-navy-900">
                          {p.student?.fullName} ({p.student?.studentCode})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {p.paymentMethod} • {p.transactionRef}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-emerald-700">
                          +₹{Number(p.amount).toLocaleString("en-IN")}
                        </p>
                        {p.receipt && (
                          <button
                            onClick={() =>
                              setPrintModal({
                                isOpen: true,
                                docType: "RECEIPT",
                                data: p.receipt,
                              })
                            }
                            className="text-[11px] font-bold text-royal-600 hover:underline"
                          >
                            {p.receipt.receiptNumber}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 2: STUDENT MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "STUDENTS" && (
          <div className="space-y-6">
            {/* Search, Filter & Export Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Student Name, ID (STU-2026...), or Mobile..."
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="DROPPED_OUT">DROPPED_OUT</option>
                </select>
              </div>
              <button
                onClick={() =>
                  exportToCsv(
                    "vidyavikas_students_directory.csv",
                    filteredStudents.map((s: any) => ({
                      StudentID: s.studentCode,
                      AdmissionNo: s.admissionNumber,
                      FullName: s.fullName,
                      Phone: s.phone,
                      Email: s.email,
                      Course: s.course?.title || "",
                      Status: s.status,
                      FeePaid: s.feeAssignments?.[0]?.paidAmount || 0,
                      FeeBalance: s.feeAssignments?.[0]?.balanceAmount || 0,
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
              >
                <Download className="w-3.5 h-3.5" />
                Export Students CSV
              </button>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Full Name & Guardian</th>
                    <th className="p-3">Course & Batch</th>
                    <th className="p-3 text-right">Fee Balance</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions & Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((stu: any) => (
                    <tr key={stu.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-mono font-bold text-royal-700 block">
                          {stu.studentCode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {stu.admissionNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-navy-900">{stu.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          Father: {stu.guardian?.fatherName || "—"} | {stu.phone}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {stu.course?.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Batch: {stu.batches?.[0]?.batch?.name || "Allocated"}
                        </p>
                      </td>
                      <td className="p-3 text-right">
                        <p className="font-bold text-amber-700">
                          ₹
                          {Number(
                            stu.feeAssignments?.[0]?.balanceAmount || 0
                          ).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-emerald-700">
                          Paid: ₹
                          {Number(
                            stu.feeAssignments?.[0]?.paidAmount || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={stu.status}
                          onChange={(e) =>
                            handleChangeStudentStatus(stu.id, e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-bold bg-white"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DROPPED_OUT">DROPPED_OUT</option>
                        </select>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              docType: "ID_CARD",
                              data: stu,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                        >
                          ID Card
                        </button>
                        <button
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              docType: "ADMISSION_LETTER",
                              data: stu,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-navy-800 text-white font-bold"
                        >
                          Admission PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Direct Add Student Form */}
            <form
              onSubmit={handleAddStudent}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-royal-600" />
                Add / Register New Student Directly
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Student Full Name *"
                  value={newStudent.fullName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, fullName: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="email"
                  required
                  placeholder="Student Email *"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-Digit Mobile *"
                  value={newStudent.phone}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, phone: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Father's Name"
                  value={newStudent.fatherName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, fatherName: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={newStudent.courseId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, courseId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={newStudent.batchId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, batchId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Scholarship Concession (₹)"
                  value={newStudent.discountAmount}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      discountAmount: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold py-2 px-4 shadow"
                >
                  Enroll Student & Create Fee Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 3: REGISTRATION MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "REGISTRATIONS" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900">
              Online Student Registrations & Document Review
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Reg Number</th>
                    <th className="p-3">Applicant & Contact</th>
                    <th className="p-3">Selected Course & Batch</th>
                    <th className="p-3">Uploaded Docs</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {registrations.map((reg: any) => (
                    <tr key={reg.id}>
                      <td className="p-3 font-mono font-bold text-royal-700">
                        {reg.regNumber}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-navy-900">{reg.fullName}</p>
                        <p className="text-slate-500">
                          {reg.phone} | {reg.email}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">
                          {reg.course?.title}
                        </p>
                        <p className="text-slate-500">
                          Batch: {reg.preferredBatch?.name || "Any"}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                          {reg.documents?.length || 0} Files Attached
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            reg.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : reg.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {reg.status !== "APPROVED" && (
                          <button
                            onClick={() =>
                              handleUpdateRegistration(
                                reg.id,
                                "APPROVED",
                                "Documents verified and registration approved."
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold"
                          >
                            Approve Reg
                          </button>
                        )}
                        {!reg.admission?.studentId ? (
                          <button
                            onClick={() => handleConvertAdmission(reg)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Confirm Admission & Enroll
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            Enrolled ({reg.admission.admissionNumber})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 4: ADMISSION MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "ADMISSIONS" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900">
              Confirmed Admissions, Student IDs & Batch Allocations
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student ID & Name</th>
                    <th className="p-3">Course & Batch</th>
                    <th className="p-3">Docs Verified</th>
                    <th className="p-3">Scholarship</th>
                    <th className="p-3 text-right">Admission Form PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {admissions.map((adm: any) => (
                    <tr key={adm.id}>
                      <td className="p-3 font-mono font-bold text-navy-900">
                        {adm.admissionNumber}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-royal-700">
                          {adm.student?.studentCode}
                        </p>
                        <p className="font-semibold text-slate-900">
                          {adm.student?.fullName}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{adm.course?.title}</p>
                        <p className="text-slate-500">{adm.batch?.name}</p>
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                          {adm.docsVerified ? "Verified ✓" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        ₹{Number(adm.scholarshipDiscount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right">
                        {adm.student && (
                          <button
                            onClick={() =>
                              setPrintModal({
                                isOpen: true,
                                docType: "ADMISSION_LETTER",
                                data: {
                                  ...adm.student,
                                  course: adm.course,
                                  batches: [{ batch: adm.batch }],
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-800 text-white font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Form
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 5: COURSE MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "COURSES" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateCourse}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900">
                Create New Coaching Course (Reflects Live on Public Website)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Course Code (e.g. JEE-CRASH-26) *"
                  value={newCourse.code}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, code: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Course Title *"
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, title: e.target.value })
                  }
                  className="sm:col-span-2 rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={newCourse.category}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, category: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="IIT-JEE">IIT-JEE</option>
                  <option value="NEET-UG">NEET-UG</option>
                  <option value="FOUNDATION">FOUNDATION</option>
                  <option value="UPSC / CIVIL SERVICES">UPSC / CIVIL SERVICES</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Duration (e.g. 1 Year) *"
                  value={newCourse.duration}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, duration: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="number"
                  required
                  placeholder="Base Tuition Fee (₹) *"
                  value={newCourse.baseFee}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, baseFee: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="GST %"
                  value={newCourse.gstPercent}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, gstPercent: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold py-2 px-4 shadow"
                >
                  + Publish Course
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Code</th>
                    <th className="p-3">Course Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3 text-right">Base Fee</th>
                    <th className="p-3 text-center">GST %</th>
                    <th className="p-3 text-center">Batches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {courses.map((c: any) => (
                    <tr key={c.id}>
                      <td className="p-3 font-mono font-bold text-royal-700">
                        {c.code}
                      </td>
                      <td className="p-3 font-bold text-navy-900">{c.title}</td>
                      <td className="p-3">{c.category}</td>
                      <td className="p-3">{c.duration}</td>
                      <td className="p-3 text-right font-bold">
                        ₹{Number(c.baseFee).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-center">{c.gstPercent}%</td>
                      <td className="p-3 text-center font-bold">
                        {c.batches?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 6: BATCH MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "BATCHES" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateBatch}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900">
                Create New Classroom / Hybrid Batch
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Batch Code (e.g. JEE-26-EVE-C) *"
                  value={newBatch.code}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, code: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Batch Name *"
                  value={newBatch.name}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, name: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={newBatch.courseId}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, courseId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={newBatch.teacherId}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, teacherId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Class Timings *"
                  value={newBatch.timing}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, timing: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Classroom / Studio"
                  value={newBatch.room}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, room: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max Capacity"
                  value={newBatch.maxCapacity}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, maxCapacity: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold py-2 px-4 shadow"
                >
                  + Create Batch
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Batch Code & Name</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Faculty Mentor</th>
                    <th className="p-3">Schedule & Room</th>
                    <th className="p-3 text-center">Enrolled / Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batches.map((b: any) => (
                    <tr key={b.id}>
                      <td className="p-3">
                        <span className="font-mono font-bold text-royal-700 block">
                          {b.code}
                        </span>
                        <span className="font-bold text-navy-900">{b.name}</span>
                      </td>
                      <td className="p-3">{b.course?.title}</td>
                      <td className="p-3 font-semibold">
                        {b.teacher?.fullName || "Assigned"}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{b.timing}</p>
                        <p className="text-slate-500">
                          {b.days} • {b.room} ({b.mode})
                        </p>
                      </td>
                      <td className="p-3 text-center font-extrabold">
                        {b._count?.enrollments || 0} / {b.maxCapacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 7: TEACHER MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "TEACHERS" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateTeacher}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900">
                Add New Faculty Member
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Faculty Full Name *"
                  value={newTeacher.fullName}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, fullName: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="email"
                  required
                  placeholder="Email (For Faculty Login) *"
                  value={newTeacher.email}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, email: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile Number *"
                  value={newTeacher.phone}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, phone: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Specialization *"
                  value={newTeacher.specialization}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      specialization: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Designation"
                  value={newTeacher.designation}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      designation: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Qualification"
                  value={newTeacher.qualification}
                  onChange={(e) =>
                    setNewTeacher({
                      ...newTeacher,
                      qualification: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold py-2 px-4 shadow"
                >
                  + Add Faculty Member
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-royal-700">
                      {t.employeeCode}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                      {t.experienceYears}+ Yrs Exp
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-navy-900">
                    {t.fullName}
                  </h3>
                  <p className="font-bold text-royal-600">{t.designation}</p>
                  <p className="text-slate-600">
                    {t.qualification} • {t.specialization}
                  </p>
                  <p className="text-slate-500">
                    Assigned Batches:{" "}
                    {t.batches?.map((b: any) => b.name).join(", ") || "None"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 8: COMPLETE FEE MANAGEMENT SYSTEM */}
        {/* =================================================================== */}
        {activeModule === "FEES" && (
          <div className="space-y-6">
            {/* Offline Payment Collection + Concession Adjustment + Refund Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. Record Verified Offline Payment */}
              <form
                onSubmit={handleRecordOfflinePayment}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs"
              >
                <h3 className="text-sm font-extrabold text-navy-900">
                  1. Verify & Record Offline Fee Payment
                </h3>
                <select
                  value={offlinePayForm.feeAssignmentId}
                  onChange={(e) =>
                    setOfflinePayForm({
                      ...offlinePayForm,
                      feeAssignmentId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white font-semibold"
                >
                  {feeAssignments.map((fa: any) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.student?.fullName} ({fa.student?.studentCode}) — Bal: ₹
                      {Number(fa.balanceAmount).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Amount (₹)"
                    value={offlinePayForm.amount}
                    onChange={(e) =>
                      setOfflinePayForm({
                        ...offlinePayForm,
                        amount: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  />
                  <select
                    value={offlinePayForm.paymentMethod}
                    onChange={(e) =>
                      setOfflinePayForm({
                        ...offlinePayForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="OFFLINE_CASH">Cash at Counter</option>
                    <option value="OFFLINE_UPI">Manual UPI Collection</option>
                    <option value="OFFLINE_BANK">NEFT / RTGS Bank Transfer</option>
                    <option value="OFFLINE_CHEQUE">Cheque / DD</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Bank / UPI / Cheque Reference (Optional)"
                  value={offlinePayForm.transactionRef}
                  onChange={(e) =>
                    setOfflinePayForm({
                      ...offlinePayForm,
                      transactionRef: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow"
                >
                  Verify Payment & Generate PDF Receipt
                </button>
              </form>

              {/* 2. Apply Scholarship / Concession or Late Fee */}
              <form
                onSubmit={handleAdjustConcession}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs"
              >
                <h3 className="text-sm font-extrabold text-navy-900">
                  2. Scholarship Concession / Late Fee
                </h3>
                <select
                  value={concessionForm.feeAssignmentId}
                  onChange={(e) =>
                    setConcessionForm({
                      ...concessionForm,
                      feeAssignmentId: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white font-semibold"
                >
                  {feeAssignments.map((fa: any) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.student?.fullName} ({fa.student?.studentCode})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">
                      Add Discount (₹)
                    </label>
                    <input
                      type="number"
                      value={concessionForm.discountAmount}
                      onChange={(e) =>
                        setConcessionForm({
                          ...concessionForm,
                          discountAmount: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">
                      Add Late Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={concessionForm.lateFeeAmount}
                      onChange={(e) =>
                        setConcessionForm({
                          ...concessionForm,
                          lateFeeAmount: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Concession Reason"
                  value={concessionForm.discountReason}
                  onChange={(e) =>
                    setConcessionForm({
                      ...concessionForm,
                      discountReason: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold shadow"
                >
                  Apply Ledger Adjustment
                </button>
              </form>

              {/* 3. Process Refund / Reversal */}
              <form
                onSubmit={handleProcessRefund}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs"
              >
                <h3 className="text-sm font-extrabold text-navy-900">
                  3. Process Fee Refund / Reversal
                </h3>
                <select
                  value={refundForm.paymentId}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, paymentId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white font-semibold"
                >
                  {payments.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.transactionRef} — {p.student?.fullName} (₹
                      {Number(p.amount).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  required
                  placeholder="Refund Amount (₹)"
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, amount: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Reason for Refund / Reversal *"
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold shadow"
                >
                  Process Refund & Audit
                </button>
              </form>
            </div>

            {/* Student-Wise Fee Ledgers Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-navy-900">
                Student-Wise Outstanding Balances & Fee Reminders
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-3">Student</th>
                      <th className="p-3">Course</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">Net Payable (Incl GST)</th>
                      <th className="p-3 text-right">Paid</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Reminder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {feeAssignments.map((fa: any) => (
                      <tr key={fa.id}>
                        <td className="p-3">
                          <p className="font-bold text-navy-900">
                            {fa.student?.fullName}
                          </p>
                          <p className="font-mono text-[10px] text-royal-700">
                            {fa.student?.studentCode}
                          </p>
                        </td>
                        <td className="p-3 truncate max-w-[180px]">
                          {fa.student?.course?.title}
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-semibold">
                          ₹{Number(fa.discountAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-bold">
                          ₹{Number(fa.netPayable).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          ₹{Number(fa.paidAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-extrabold text-amber-700">
                          ₹{Number(fa.balanceAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              fa.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : fa.status === "OVERDUE"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {fa.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {fa.balanceAmount > 0 && (
                            <button
                              onClick={async () => {
                                const res = await fetch("/api/fees", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "SEND_FEE_REMINDER",
                                    studentId: fa.studentId,
                                  }),
                                });
                                const j = await res.json();
                                if (res.ok) setFeedback(j.message);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px]"
                            >
                              Send Due Alert
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 9: ATTENDANCE MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "ATTENDANCE" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-navy-900">
                Institute Attendance Ledger & Audit History
              </h2>
              <Link
                href="/teacher"
                className="px-4 py-2 rounded-xl bg-royal-600 text-white text-xs font-bold"
              >
                Open Batch Attendance Marker →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">Student</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Marked By</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(data.attendance || []).slice(0, 30).map((a: any) => (
                    <tr key={a.id}>
                      <td className="p-3 font-bold">{a.date}</td>
                      <td className="p-3 font-semibold text-navy-900">
                        {a.student?.fullName} ({a.student?.studentCode})
                      </td>
                      <td className="p-3">{a.batch?.name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <td className="p-3">{a.markedBy}</td>
                      <td className="p-3 text-slate-500">{a.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 10 & 11: EXAMINATION & RESULTS MANAGEMENT */}
        {/* =================================================================== */}
        {(activeModule === "EXAMS" || activeModule === "RESULTS") && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateExam}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900">
                Schedule New Examination
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Examination Title *"
                  value={newExam.title}
                  onChange={(e) =>
                    setNewExam({ ...newExam, title: e.target.value })
                  }
                  className="sm:col-span-2 rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={newExam.courseId}
                  onChange={(e) =>
                    setNewExam({ ...newExam, courseId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <select
                  value={newExam.batchId}
                  onChange={(e) =>
                    setNewExam({ ...newExam, batchId: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {batches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Subjects *"
                  value={newExam.subject}
                  onChange={(e) =>
                    setNewExam({ ...newExam, subject: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="date"
                  required
                  value={newExam.examDate}
                  onChange={(e) =>
                    setNewExam({ ...newExam, examDate: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="number"
                  required
                  placeholder="Max Marks"
                  value={newExam.maxMarks}
                  onChange={(e) =>
                    setNewExam({ ...newExam, maxMarks: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold py-2 px-4 shadow"
                >
                  + Schedule Exam
                </button>
              </div>
            </form>

            {examinations.map((ex: any) => (
              <div
                key={ex.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-royal-600">
                      {ex.code} • {ex.examDate}
                    </span>
                    <h3 className="text-base font-extrabold text-navy-900">
                      {ex.title}
                    </h3>
                    <p className="text-slate-500">
                      Batch: {ex.batch?.name} | Max Marks: {ex.maxMarks}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      ex.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ex.isPublished ? "Results Published" : "Scheduled"}
                  </span>
                </div>

                {ex.marks && ex.marks.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 uppercase">
                          <th className="p-2.5">Rank</th>
                          <th className="p-2.5">Student</th>
                          <th className="p-2.5 text-center">Score</th>
                          <th className="p-2.5 text-center">Percentage</th>
                          <th className="p-2.5 text-center">Grade</th>
                          <th className="p-2.5 text-right">Marksheet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ex.marks.map((m: any) => (
                          <tr key={m.id}>
                            <td className="p-2.5 font-extrabold text-navy-900">
                              #{m.rankInBatch || 1}
                            </td>
                            <td className="p-2.5 font-bold">
                              {m.student?.fullName} ({m.student?.studentCode})
                            </td>
                            <td className="p-2.5 text-center font-extrabold text-royal-700">
                              {m.marksObtained} / {m.maxMarks}
                            </td>
                            <td className="p-2.5 text-center font-bold">
                              {m.percentage}%
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {m.grade}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() =>
                                  setPrintModal({
                                    isOpen: true,
                                    docType: "MARKSHEET",
                                    data: {
                                      ...m,
                                      studentName: m.student?.fullName,
                                      studentCode: m.student?.studentCode,
                                      examination: ex,
                                    },
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-navy-800 text-white font-bold"
                              >
                                Print PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 12: TIMETABLE MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "TIMETABLE" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900">
              Master Institute Class Timetable & Lecture Hall Allocation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((b: any) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-royal-700">
                      {b.code}
                    </span>
                    <span className="bg-navy-800 text-white font-bold px-2.5 py-0.5 rounded-full">
                      {b.mode}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-navy-900">
                    {b.name}
                  </h3>
                  <p className="text-slate-700">
                    <strong>Course:</strong> {b.course?.title}
                  </p>
                  <p className="text-slate-700">
                    <strong>Class Days:</strong> {b.days}
                  </p>
                  <p className="text-slate-700">
                    <strong>Class Timing:</strong> {b.timing}
                  </p>
                  <p className="text-slate-700">
                    <strong>Venue / Room:</strong> {b.room} |{" "}
                    <strong>Faculty:</strong> {b.teacher?.fullName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 13: STUDY MATERIAL MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "MATERIALS" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900">
              Digital Study Materials, Notes, DPPs & Assignments Repository
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {(data.studyMaterials || []).map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                      {m.subject} • {m.category}
                    </span>
                    <span className="text-slate-500">{m.teacher?.fullName}</span>
                  </div>
                  <h3 className="font-extrabold text-navy-900 text-sm">
                    {m.title}
                  </h3>
                  <p className="text-slate-600">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 14: ENQUIRY & LEAD MANAGEMENT */}
        {/* =================================================================== */}
        {activeModule === "ENQUIRIES" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-navy-900">
              Website & WhatsApp Admission Enquiries (Lead CRM)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Lead Name & Phone</th>
                    <th className="p-3">Interested Course</th>
                    <th className="p-3">Query & Counselor Notes</th>
                    <th className="p-3">Follow-Up Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enquiries.map((enq: any) => (
                    <tr key={enq.id}>
                      <td className="p-3">
                        <p className="font-bold text-navy-900">{enq.name}</p>
                        <p className="text-slate-500">
                          {enq.phone} • {enq.source}
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate">
                        {enq.courseInterest}
                      </td>
                      <td className="p-3 max-w-[240px]">
                        <p className="text-slate-700">{enq.message}</p>
                        {enq.notes && (
                          <p className="text-[11px] text-royal-600 font-semibold mt-0.5">
                            Note: {enq.notes}
                          </p>
                        )}
                      </td>
                      <td className="p-3">{enq.followUpDate || "2026-10-30"}</td>
                      <td className="p-3">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            handleUpdateEnquiry(
                              enq.id,
                              e.target.value,
                              enq.notes || "Contacted by Admissions Team",
                              enq.followUpDate || "2026-11-01"
                            )
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1 font-bold bg-white"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="FOLLOW_UP">FOLLOW_UP</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 15: NOTIFICATIONS SYSTEM */}
        {/* =================================================================== */}
        {activeModule === "NOTIFICATIONS" && (
          <div className="space-y-6">
            <form
              onSubmit={handleSendNotification}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900">
                Broadcast Institute Notification (In-App + Configurable
                Email/SMS/WhatsApp)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={notifForm.roleTarget}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, roleTarget: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white font-bold"
                >
                  <option value="ALL">Target: All Users</option>
                  <option value="STUDENT">Target: All Students & Parents</option>
                  <option value="TEACHER">Target: All Faculty</option>
                </select>
                <select
                  value={notifForm.category}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, category: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="ANNOUNCEMENT">Category: Announcement</option>
                  <option value="FEE">Category: Fee Due Reminder</option>
                  <option value="EXAM">Category: Examination Notice</option>
                  <option value="SCHEDULE">Category: Schedule Update</option>
                </select>
                <select
                  value={notifForm.channel}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, channel: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="IN_APP">In-App Portal Alert</option>
                  <option value="IN_APP_EMAIL_WHATSAPP">
                    In-App + Email + WhatsApp
                  </option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Notification Headline *"
                value={notifForm.title}
                onChange={(e) =>
                  setNotifForm({ ...notifForm, title: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5"
              />
              <textarea
                rows={2}
                required
                placeholder="Detailed notification message *"
                value={notifForm.message}
                onChange={(e) =>
                  setNotifForm({ ...notifForm, message: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold shadow"
              >
                Dispatch Notification
              </button>
            </form>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2.5 text-xs">
              <h3 className="font-extrabold text-sm text-navy-900">
                Notification Dispatch History
              </h3>
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-navy-900">{n.title}</p>
                    <p className="text-slate-600">{n.message}</p>
                  </div>
                  <span className="bg-blue-100 text-royal-700 font-bold px-2.5 py-0.5 rounded-full">
                    {n.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 16: REPORTS & ANALYTICS */}
        {/* =================================================================== */}
        {activeModule === "REPORTS" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-navy-900">
                Institutional Reports & One-Click CSV/Excel Exports
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  {
                    title: "1. Student Registration Report",
                    desc: `${registrations.length} total online registrations with status & course breakdown.`,
                    file: "registration_report.csv",
                    rows: registrations.map((r: any) => ({
                      RegNo: r.regNumber,
                      Name: r.fullName,
                      Phone: r.phone,
                      Course: r.course?.title,
                      Status: r.status,
                    })),
                  },
                  {
                    title: "2. Confirmed Admission Report",
                    desc: `${admissions.length} enrolled students with Admission Nos, Student IDs, and Batches.`,
                    file: "admission_report.csv",
                    rows: admissions.map((a: any) => ({
                      AdmissionNo: a.admissionNumber,
                      StudentCode: a.student?.studentCode,
                      Name: a.student?.fullName,
                      Course: a.course?.title,
                      Batch: a.batch?.name,
                      Scholarship: a.scholarshipDiscount,
                    })),
                  },
                  {
                    title: "3. Fee Collection & GST Report",
                    desc: `₹${Number(kpis.totalCollectedFees || 0).toLocaleString(
                      "en-IN"
                    )} verified revenue across online & offline modes.`,
                    file: "fee_collection_report.csv",
                    rows: payments.map((p: any) => ({
                      ReceiptNo: p.receipt?.receiptNumber,
                      Student: p.student?.fullName,
                      Amount: p.amount,
                      Tax: p.taxAmount,
                      Method: p.paymentMethod,
                      TransactionRef: p.transactionRef,
                      Status: p.status,
                    })),
                  },
                  {
                    title: "4. Pending & Overdue Fees Report",
                    desc: `₹${Number(kpis.pendingFees || 0).toLocaleString(
                      "en-IN"
                    )} outstanding dues across active student ledgers.`,
                    file: "pending_fees_report.csv",
                    rows: feeAssignments.map((f: any) => ({
                      StudentCode: f.student?.studentCode,
                      StudentName: f.student?.fullName,
                      Phone: f.student?.phone,
                      NetPayable: f.netPayable,
                      Paid: f.paidAmount,
                      BalanceDue: f.balanceAmount,
                      Status: f.status,
                    })),
                  },
                  {
                    title: "5. Course & Batch Enrollment Report",
                    desc: `${courses.length} courses and ${batches.length} batches with seat occupancy metrics.`,
                    file: "batch_enrollment_report.csv",
                    rows: batches.map((b: any) => ({
                      BatchCode: b.code,
                      BatchName: b.name,
                      Course: b.course?.title,
                      Faculty: b.teacher?.fullName,
                      Enrolled: b._count?.enrollments || 0,
                      MaxCapacity: b.maxCapacity,
                    })),
                  },
                  {
                    title: "6. Enquiry Lead Conversion Report",
                    desc: `${enquiries.length} website & WhatsApp leads tracked by status.`,
                    file: "enquiry_conversion_report.csv",
                    rows: enquiries.map((e: any) => ({
                      Name: e.name,
                      Phone: e.phone,
                      CourseInterest: e.courseInterest,
                      Source: e.source,
                      Status: e.status,
                    })),
                  },
                ].map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <h3 className="font-extrabold text-navy-900 text-sm">
                        {rep.title}
                      </h3>
                      <p className="text-slate-600 mt-1">{rep.desc}</p>
                    </div>
                    <button
                      onClick={() => exportToCsv(rep.file, rep.rows)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV / Excel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODULE 17: WEBSITE CONTENT MANAGEMENT (CMS) */}
        {/* =================================================================== */}
        {activeModule === "CMS" && (
          <form
            onSubmit={handleUpdateHeroCms}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
          >
            <h2 className="text-lg font-extrabold text-navy-900">
              Dynamic Public Website CMS Editor
            </h2>
            <p className="text-slate-600">
              Changes saved here immediately update the public Homepage hero banner
              without editing code.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Homepage Hero Main Headline *
              </label>
              <input
                type="text"
                required
                value={cmsHeroForm.title}
                onChange={(e) =>
                  setCmsHeroForm({ ...cmsHeroForm, title: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Homepage Hero Sub-headline *
              </label>
              <textarea
                rows={3}
                required
                value={cmsHeroForm.subtitle}
                onChange={(e) =>
                  setCmsHeroForm({ ...cmsHeroForm, subtitle: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold shadow"
            >
              Publish Live to Homepage
            </button>
          </form>
        )}

        {/* =================================================================== */}
        {/* MODULE 18: SETTINGS, USER ROLES & AUDIT LOGS */}
        {/* =================================================================== */}
        {activeModule === "SETTINGS" && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-lg font-extrabold text-navy-900">
                Global Institute Branding, Tax & Session Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-1">Institute Name</label>
                  <input
                    type="text"
                    value={settingsForm.instituteName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        instituteName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={settingsForm.academicSession}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        academicSession: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    GSTIN & Default GST %
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.gstNumber}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          gstNumber: e.target.value,
                        })
                      }
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 font-mono"
                    />
                    <input
                      type="number"
                      value={settingsForm.defaultGstPercent}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          defaultGstPercent: Number(e.target.value),
                        })
                      }
                      className="w-20 rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsapp: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold shadow"
              >
                Save Institute Configuration
              </button>
            </form>

            {/* Security & Financial Audit Logs */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-navy-900">
                Immutable Security & Financial Audit Trail
              </h3>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Actor & Role</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </td>
                        <td className="p-2.5 font-bold text-navy-900">
                          {log.actorName} ({log.actorRole})
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-royal-700 bg-blue-50 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Document Modal */}
      <PrintableDocumentModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal((prev) => ({ ...prev, isOpen: false }))}
        docType={printModal.docType}
        data={printModal.data}
        instituteSettings={data?.settings}
      />
    </div>
  );
}

