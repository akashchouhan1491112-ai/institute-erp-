import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Unauthorized. Admin credentials required." },
      { status: 403 }
    );
  }

  try {
    const [
      settings,
      students,
      registrations,
      admissions,
      courses,
      batches,
      teachers,
      feeAssignments,
      payments,
      receipts,
      refunds,
      attendance,
      examinations,
      studyMaterials,
      assignments,
      enquiries,
      notifications,
      cmsBlocks,
      auditLogs,
      roles,
    ] = await Promise.all([
      prisma.instituteSetting.findFirst(),
      prisma.student.findMany({
        include: {
          guardian: true,
          course: { select: { id: true, title: true, code: true } },
          batches: {
            include: {
              batch: { select: { id: true, name: true, code: true, timing: true } },
            },
          },
          feeAssignments: {
            include: { installments: { orderBy: { installmentNo: "asc" } } },
          },
          payments: { include: { receipt: true } },
          attendance: true,
          examMarks: { include: { examination: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.registration.findMany({
        include: {
          course: { select: { id: true, title: true, code: true, baseFee: true } },
          preferredBatch: { select: { id: true, name: true, timing: true } },
          documents: true,
          admission: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.admission.findMany({
        include: {
          registration: { include: { documents: true } },
          student: true,
          course: true,
          batch: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.findMany({
        include: {
          batches: {
            include: {
              teacher: { select: { id: true, fullName: true } },
              _count: { select: { enrollments: true } },
            },
          },
          _count: { select: { students: true, registrations: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.batch.findMany({
        include: {
          course: { select: { id: true, title: true, code: true } },
          teacher: { select: { id: true, fullName: true, specialization: true } },
          enrollments: {
            include: {
              student: { select: { id: true, fullName: true, studentCode: true } },
            },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.teacher.findMany({
        include: {
          batches: { select: { id: true, name: true, code: true, timing: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.studentFeeAssignment.findMany({
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentCode: true,
              phone: true,
              course: { select: { title: true, code: true } },
            },
          },
          installments: { orderBy: { installmentNo: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        include: {
          student: { select: { id: true, fullName: true, studentCode: true } },
          receipt: true,
          refunds: true,
        },
        orderBy: { paidAt: "desc" },
      }),
      prisma.receipt.findMany({ orderBy: { issuedAt: "desc" } }),
      prisma.refund.findMany({
        include: {
          payment: {
            include: { student: { select: { fullName: true, studentCode: true } } },
          },
        },
        orderBy: { processedAt: "desc" },
      }),
      prisma.attendance.findMany({
        include: {
          student: { select: { id: true, fullName: true, studentCode: true } },
          batch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { date: "desc" },
        take: 150,
      }),
      prisma.examination.findMany({
        include: {
          course: { select: { id: true, title: true, code: true } },
          batch: { select: { id: true, name: true, code: true } },
          marks: {
            include: {
              student: { select: { id: true, fullName: true, studentCode: true } },
            },
            orderBy: { marksObtained: "desc" },
          },
        },
        orderBy: { examDate: "desc" },
      }),
      prisma.studyMaterial.findMany({
        include: {
          course: { select: { title: true, code: true } },
          batch: { select: { name: true, code: true } },
          teacher: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assignment.findMany({
        include: {
          batch: { select: { name: true, code: true } },
          teacher: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.websiteContent.findMany(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.role.findMany(),
    ]);

    const totalAssignedFees = feeAssignments.reduce((s, f) => s + f.netPayable, 0);
    const totalCollectedFees = feeAssignments.reduce((s, f) => s + f.paidAmount, 0);
    const pendingFees = feeAssignments.reduce((s, f) => s + f.balanceAmount, 0);
    const overdueFees = feeAssignments
      .filter((f) => f.status === "OVERDUE")
      .reduce((s, f) => s + f.balanceAmount, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaysFeeCollection = payments
      .filter(
        (p) => p.status === "SUCCESS" && p.paidAt.toISOString().slice(0, 10) === todayStr
      )
      .reduce((s, p) => s + p.amount, 0);

    const latestAttendanceDate = attendance[0]?.date || todayStr;
    const todaysAttRecords = attendance.filter((a) => a.date === latestAttendanceDate);
    const todaysAttendanceRate =
      todaysAttRecords.length > 0
        ? Math.round(
            (todaysAttRecords.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length /
              todaysAttRecords.length) *
              100
          )
        : 94;

    return NextResponse.json({
      kpis: {
        totalRegisteredStudents: registrations.length,
        totalActiveStudents: students.filter((s) => s.status === "ACTIVE").length,
        newAdmissions: admissions.length,
        pendingAdmissionRequests: registrations.filter(
          (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW"
        ).length,
        totalCourses: courses.length,
        activeBatches: batches.filter((b) => b.status === "ACTIVE").length,
        totalTeachers: teachers.length,
        todaysFeeCollection,
        totalAssignedFees,
        totalCollectedFees,
        pendingFees,
        overdueFees,
        todaysAttendanceRate,
        upcomingExamsCount: examinations.filter((e) => !e.isPublished).length,
        newEnquiriesCount: enquiries.filter((e) => e.status === "NEW").length,
      },
      settings,
      students,
      registrations,
      admissions,
      courses,
      batches,
      teachers,
      feeAssignments,
      payments,
      receipts,
      refunds,
      attendance,
      examinations,
      studyMaterials,
      assignments,
      enquiries,
      notifications,
      cmsBlocks,
      auditLogs,
      roles,
    });
  } catch (err) {
    console.error("Admin portal API error:", err);
    return NextResponse.json(
      { error: "Failed to load admin dashboard data." },
      { status: 500 }
    );
  }
}

