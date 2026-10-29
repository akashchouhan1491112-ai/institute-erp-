"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FilePlus,
  GraduationCap,
  Home,
  LogOut,
  Send,
  Upload,
  Users,
} from "lucide-react";

export default function TeacherPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "OVERVIEW"
    | "ATTENDANCE"
    | "EXAMS_MARKS"
    | "MATERIALS_ASSIGNMENTS"
    | "ANNOUNCEMENTS"
  >("OVERVIEW");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Attendance Marking State
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: string; remarks: string }>
  >({});

  // Exam Marks Entry State
  const [selectedExamId, setSelectedExamId] = useState("");
  const [marksMap, setMarksMap] = useState<
    Record<string, { marksObtained: string; remarks: string }>
  >({});

  // Study Material Form
  const [materialForm, setMaterialForm] = useState({
    title: "",
    subject: "Physics",
    category: "LECTURE_NOTES",
    description: "",
    isPublic: true,
  });

  // Assignment Form
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subject: "Physics",
    description: "",
    dueDate: "2026-11-12",
    maxMarks: 100,
  });

  // Class Announcement Form
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
  });

  async function loadTeacherPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/teacher");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setData(json);
        const firstBatch = json.teacher?.batches?.[0];
        if (firstBatch && !selectedBatchId) {
          setSelectedBatchId(firstBatch.id);
          const initAtt: Record<string, { status: string; remarks: string }> = {};
          for (const enr of firstBatch.enrollments || []) {
            initAtt[enr.student.id] = { status: "PRESENT", remarks: "" };
          }
          setAttendanceMap(initAtt);
        }
        const firstExam = json.examinations?.[0];
        if (firstExam && !selectedExamId) {
          setSelectedExamId(firstExam.id);
          const initMarks: Record<
            string,
            { marksObtained: string; remarks: string }
          > = {};
          for (const m of firstExam.marks || []) {
            initMarks[m.studentId] = {
              marksObtained: String(m.marksObtained),
              remarks: m.remarks || "",
            };
          }
          setMarksMap(initMarks);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeacherPortal();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleSaveAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatchId) return;
    const currentBatch = data.teacher.batches.find(
      (b: any) => b.id === selectedBatchId
    );
    const entries = (currentBatch?.enrollments || []).map((enr: any) => ({
      studentId: enr.student.id,
      status: attendanceMap[enr.student.id]?.status || "PRESENT",
      remarks: attendanceMap[enr.student.id]?.remarks || "",
    }));

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: selectedBatchId,
        date: attendanceDate,
        entries,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadTeacherPortal();
    } else {
      alert(json.error || "Failed to save attendance.");
    }
  }

  async function handleSaveMarks(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExamId) return;
    const exam = data.examinations.find((x: any) => x.id === selectedExamId);
    const batch = data.teacher.batches.find((b: any) => b.id === exam?.batchId);
    const marksList = (batch?.enrollments || []).map((enr: any) => ({
      studentId: enr.student.id,
      marksObtained:
        marksMap[enr.student.id]?.marksObtained ??
        Math.round((exam?.maxMarks || 300) * 0.8),
      remarks: marksMap[enr.student.id]?.remarks || "Consistent Effort",
    }));

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SAVE_MARKS",
        examinationId: selectedExamId,
        marksList,
        publishResults: true,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      await loadTeacherPortal();
    } else {
      alert(json.error || "Failed to save marks.");
    }
  }

  async function handleUploadMaterial(e: React.FormEvent) {
    e.preventDefault();
    const currentBatch = data.teacher.batches.find(
      (b: any) => b.id === selectedBatchId
    );
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "MATERIAL",
        courseId: currentBatch?.courseId || data.teacher.batches[0]?.courseId,
        batchId: selectedBatchId,
        ...materialForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setMaterialForm({
        ...materialForm,
        title: "",
        description: "",
      });
      await loadTeacherPortal();
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ASSIGNMENT",
        batchId: selectedBatchId || data.teacher.batches[0]?.id,
        ...assignmentForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setAssignmentForm({ ...assignmentForm, title: "", description: "" });
      await loadTeacherPortal();
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SEND_NOTIFICATION",
        roleTarget: "STUDENT",
        batchId: selectedBatchId,
        title: announcementForm.title,
        message: announcementForm.message,
        category: "ANNOUNCEMENT",
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setFeedback(json.message);
      setAnnouncementForm({ title: "", message: "" });
      await loadTeacherPortal();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-navy-900 font-bold">
        Loading Faculty Portal...
      </div>
    );
  }

  const teacher = data?.teacher;
  const batches = teacher?.batches || [];
  const currentBatch =
    batches.find((b: any) => b.id === selectedBatchId) || batches[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-navy-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-navy-800 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-royal-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Institute ERP</span>
              <span className="text-[11px] text-blue-300">
                Faculty & Academic Portal
              </span>
            </div>
          </div>

          <div className="p-4 m-4 rounded-2xl bg-navy-800 border border-navy-700 space-y-1">
            <span className="text-[10px] font-mono text-amber-300 font-bold">
              {teacher?.employeeCode}
            </span>
            <h2 className="font-extrabold text-sm">{teacher?.fullName}</h2>
            <p className="text-[11px] text-blue-200">{teacher?.designation}</p>
          </div>

          <nav className="px-3 space-y-1 text-xs font-semibold">
            {[
              {
                id: "OVERVIEW",
                label: "Batches, Timetable & Roster",
                icon: Home,
              },
              {
                id: "ATTENDANCE",
                label: "Mark Student Attendance",
                icon: ClipboardCheck,
              },
              {
                id: "EXAMS_MARKS",
                label: "Record Exam Marks & Results",
                icon: Award,
              },
              {
                id: "MATERIALS_ASSIGNMENTS",
                label: "Study Materials & Homework",
                icon: BookOpen,
              },
              {
                id: "ANNOUNCEMENTS",
                label: "Post Class Announcements",
                icon: Bell,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === item.id
                    ? "bg-royal-600 text-white shadow"
                    : "text-slate-300 hover:bg-navy-800"
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
            className="w-full block text-center py-2 rounded-xl bg-navy-800 text-xs font-semibold text-blue-200"
          >
            ← Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900">
              Faculty Portal — {teacher?.fullName}
            </h1>
            <p className="text-xs text-slate-600">
              Specialization: <strong>{teacher?.specialization}</strong> | Assigned
              Batches: <strong>{batches.length}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Active Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
            >
              {batches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & STUDENT ROSTER */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <span className="text-xs text-slate-500">Assigned Batches</span>
                <p className="text-2xl font-extrabold text-navy-900 mt-1">
                  {batches.length}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <span className="text-xs text-slate-500">
                  Students in Selected Batch
                </span>
                <p className="text-2xl font-extrabold text-royal-600 mt-1">
                  {currentBatch?.enrollments?.length || 0} /{" "}
                  {currentBatch?.maxCapacity || 40}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <span className="text-xs text-slate-500">Class Schedule</span>
                <p className="text-sm font-extrabold text-navy-900 mt-1">
                  {currentBatch?.timing}
                </p>
                <p className="text-xs text-slate-500">{currentBatch?.days}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-navy-900">
                Enrolled Student Roster & Academic Performance ({currentBatch?.name})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Full Name</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3 text-center">Attendance %</th>
                      <th className="p-3 text-center">Latest Exam Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(currentBatch?.enrollments || []).map((enr: any) => {
                      const stu = enr.student;
                      const totalAtt = stu.attendance?.length || 0;
                      const presAtt = (stu.attendance || []).filter(
                        (a: any) => a.status === "PRESENT" || a.status === "LATE"
                      ).length;
                      const pct =
                        totalAtt > 0 ? Math.round((presAtt / totalAtt) * 100) : 100;
                      const latestMark = stu.examMarks?.[0];

                      return (
                        <tr key={stu.id}>
                          <td className="p-3 font-mono font-bold text-royal-700">
                            {stu.studentCode}
                          </td>
                          <td className="p-3 font-bold text-navy-900">
                            {stu.fullName}
                          </td>
                          <td className="p-3">{stu.phone}</td>
                          <td className="p-3 text-center font-bold">{pct}%</td>
                          <td className="p-3 text-center">
                            {latestMark
                              ? `${latestMark.marksObtained}/${latestMark.maxMarks} (${latestMark.grade})`
                              : "Pending"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARK ATTENDANCE */}
        {activeTab === "ATTENDANCE" && (
          <form
            onSubmit={handleSaveAttendance}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-navy-900">
                  Mark Batch-Wise Daily Attendance
                </h2>
                <p className="text-xs text-slate-500">
                  Batch: {currentBatch?.name} ({currentBatch?.timing})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Date:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Attendance Status</th>
                    <th className="p-3">Remarks / Leave Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(currentBatch?.enrollments || []).map((enr: any) => {
                    const stu = enr.student;
                    const currentStatus =
                      attendanceMap[stu.id]?.status || "PRESENT";
                    return (
                      <tr key={stu.id}>
                        <td className="p-3 font-mono font-bold text-royal-700">
                          {stu.studentCode}
                        </td>
                        <td className="p-3 font-bold text-navy-900">
                          {stu.fullName}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {["PRESENT", "ABSENT", "LATE", "LEAVE"].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  setAttendanceMap((prev) => ({
                                    ...prev,
                                    [stu.id]: {
                                      status: st,
                                      remarks: prev[stu.id]?.remarks || "",
                                    },
                                  }))
                                }
                                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                                  currentStatus === st
                                    ? st === "PRESENT"
                                      ? "bg-emerald-600 text-white"
                                      : st === "ABSENT"
                                      ? "bg-red-600 text-white"
                                      : "bg-amber-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={attendanceMap[stu.id]?.remarks || ""}
                            onChange={(e) =>
                              setAttendanceMap((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  status: prev[stu.id]?.status || "PRESENT",
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs shadow"
              >
                Save & Audit Attendance for {attendanceDate}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: RECORD EXAM MARKS */}
        {activeTab === "EXAMS_MARKS" && (
          <form
            onSubmit={handleSaveMarks}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-navy-900">
                  Enter Examination Marks & Publish Results
                </h2>
                <p className="text-xs text-slate-500">
                  Auto-computes Percentage, Grade & Batch Rank
                </p>
              </div>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
              >
                {(data.examinations || []).map((ex: any) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} (Max: {ex.maxMarks})
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Student ID</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Marks Obtained</th>
                    <th className="p-3">Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(currentBatch?.enrollments || []).map((enr: any) => {
                    const stu = enr.student;
                    return (
                      <tr key={stu.id}>
                        <td className="p-3 font-mono font-bold text-royal-700">
                          {stu.studentCode}
                        </td>
                        <td className="p-3 font-bold text-navy-900">
                          {stu.fullName}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={marksMap[stu.id]?.marksObtained ?? ""}
                            placeholder="Marks"
                            onChange={(e) =>
                              setMarksMap((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  marksObtained: e.target.value,
                                  remarks: prev[stu.id]?.remarks || "",
                                },
                              }))
                            }
                            className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Faculty remarks..."
                            value={marksMap[stu.id]?.remarks ?? ""}
                            onChange={(e) =>
                              setMarksMap((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  marksObtained: prev[stu.id]?.marksObtained || "0",
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
              >
                Save Marks & Publish Results to Student Portal
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: UPLOAD STUDY MATERIALS & CREATE ASSIGNMENTS */}
        {activeTab === "MATERIALS_ASSIGNMENTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleUploadMaterial}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-royal-600" />
                Upload Study Material / DPP / Notes
              </h2>
              <div>
                <label className="block font-bold mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={materialForm.title}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, title: e.target.value })
                  }
                  placeholder="e.g. Electrostatics & Capacitors Complete DPP Booklet"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={materialForm.subject}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        subject: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={materialForm.category}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="LECTURE_NOTES">Lecture Notes</option>
                    <option value="DPP">Daily Practice Problems (DPP)</option>
                    <option value="PYQ">Previous Year Questions</option>
                    <option value="FORMULA_SHEET">Formula Sheet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={materialForm.description}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold"
              >
                Publish Study Material
              </button>
            </form>

            <form
              onSubmit={handleCreateAssignment}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <h2 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-royal-600" />
                Create Homework / Practice Assignment
              </h2>
              <div>
                <label className="block font-bold mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Rotational Dynamics Exercise-2 (Q1–Q30)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={assignmentForm.subject}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        subject: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={assignmentForm.dueDate}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Instructions</label>
                <textarea
                  rows={2}
                  value={assignmentForm.description}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold"
              >
                Assign to Batch & Notify Students
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: POST CLASS ANNOUNCEMENTS */}
        {activeTab === "ANNOUNCEMENTS" && (
          <form
            onSubmit={handlePostAnnouncement}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 max-w-2xl text-xs"
          >
            <h2 className="text-base font-extrabold text-navy-900">
              Post Class Announcement to {currentBatch?.name}
            </h2>
            <div>
              <label className="block font-bold mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Extra Doubt Clinic Tomorrow at 2:00 PM"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Message *</label>
              <textarea
                rows={3}
                required
                value={announcementForm.message}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    message: e.target.value,
                  })
                }
                placeholder="Bring your Rotational Mechanics DPP sheet..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Broadcast to Batch Students
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

