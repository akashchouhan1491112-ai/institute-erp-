import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Students can ONLY access their own record
  if (user.role !== "STUDENT" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied. Student credentials required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get("studentId");

    const student =
      user.role === "STUDENT"
        ? await prisma.student.findUnique({
            where: { userId: user.id },
            include: {
              guardian: true,
              course: true,
              branch: true,
              batches: {
                include: {
                  batch: {
                    include: {
                      teacher: {
                        select: {
                          fullName: true,
                          designation: true,
                          specialization: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
              admissions: {
                include: {
                  registration: true,
                },
              },
              documents: true,
              feeAssignments: {
                include: {
                  installments: { orderBy: { installmentNo: "asc" } },
                },
              },
              payments: {
                include: { receipt: true, refunds: true },
                orderBy: { paidAt: "desc" },
              },
              attendance: {
                include: { batch: { select: { name: true, code: true } } },
                orderBy: { date: "desc" },
              },
              examMarks: {
                include: {
                  examination: true,
                },
                orderBy: { createdAt: "desc" },
              },
            },
          })
        : await prisma.student.findFirst({
            where: requestedStudentId ? { id: requestedStudentId } : undefined,
            include: {
              guardian: true,
              course: true,
              branch: true,
              batches: {
                include: {
                  batch: {
                    include: {
                      teacher: {
                        select: {
                          fullName: true,
                          designation: true,
                          specialization: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
              admissions: { include: { registration: true } },
              documents: true,
              feeAssignments: {
                include: {
                  installments: { orderBy: { installmentNo: "asc" } },
                },
              },
              payments: {
                include: { receipt: true, refunds: true },
                orderBy: { paidAt: "desc" },
              },
              attendance: {
                include: { batch: { select: { name: true, code: true } } },
                orderBy: { date: "desc" },
              },
              examMarks: {
                include: { examination: true },
                orderBy: { createdAt: "desc" },
              },
            },
          });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const batchIds = student.batches.map((b) => b.batchId);

    const [studyMaterials, assignments, upcomingExams, notifications, settings] =
      await Promise.all([
        prisma.studyMaterial.findMany({
          where: {
            OR: [
              { courseId: student.courseId || "" },
              { batchId: { in: batchIds } },
              { isPublic: true },
            ],
          },
          include: { teacher: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.assignment.findMany({
          where: { batchId: { in: batchIds } },
          include: {
            batch: { select: { name: true } },
            teacher: { select: { fullName: true } },
          },
          orderBy: { dueDate: "asc" },
        }),
        prisma.examination.findMany({
          where: {
            OR: [
              { courseId: student.courseId || "" },
              { batchId: { in: batchIds } },
            ],
          },
          include: { batch: { select: { name: true } } },
          orderBy: { examDate: "desc" },
        }),
        prisma.notification.findMany({
          where: {
            OR: [
              { userId: student.userId },
              { roleTarget: "ALL" },
              { roleTarget: "STUDENT" },
              { batchId: { in: batchIds } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        prisma.instituteSetting.findFirst(),
      ]);

    const totalClasses = student.attendance.length;
    const attendedClasses = student.attendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

    return NextResponse.json({
      student,
      attendanceSummary: {
        totalClasses,
        attendedClasses,
        absentClasses: student.attendance.filter((a) => a.status === "ABSENT").length,
        attendancePercentage,
      },
      studyMaterials,
      assignments,
      upcomingExams,
      notifications,
      settings,
    });
  } catch (err) {
    console.error("Student portal API error:", err);
    return NextResponse.json(
      { error: "Failed to load student portal data." },
      { status: 500 }
    );
  }
}

