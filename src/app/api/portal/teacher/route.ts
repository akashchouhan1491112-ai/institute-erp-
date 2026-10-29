import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    user.role !== "TEACHER" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Access denied. Faculty credentials required." },
      { status: 403 }
    );
  }

  try {
    const teacher =
      user.role === "TEACHER"
        ? await prisma.teacher.findUnique({
            where: { userId: user.id },
            include: {
              branch: true,
              batches: {
                include: {
                  course: true,
                  enrollments: {
                    include: {
                      student: {
                        include: {
                          attendance: true,
                          examMarks: { include: { examination: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : await prisma.teacher.findFirst({
            include: {
              branch: true,
              batches: {
                include: {
                  course: true,
                  enrollments: {
                    include: {
                      student: {
                        include: {
                          attendance: true,
                          examMarks: { include: { examination: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found." }, { status: 404 });
    }

    const assignedBatchIds = teacher.batches.map((b) => b.id);
    const assignedCourseIds = Array.from(
      new Set(teacher.batches.map((b) => b.courseId))
    );

    const [examinations, studyMaterials, assignments, attendanceRecords, notifications] =
      await Promise.all([
        prisma.examination.findMany({
          where: { batchId: { in: assignedBatchIds } },
          include: {
            batch: { select: { name: true, code: true } },
            course: { select: { title: true } },
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
          where: {
            OR: [
              { teacherId: teacher.id },
              { courseId: { in: assignedCourseIds } },
            ],
          },
          include: {
            course: { select: { title: true } },
            batch: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.assignment.findMany({
          where: { batchId: { in: assignedBatchIds } },
          include: { batch: { select: { name: true, code: true } } },
          orderBy: { dueDate: "asc" },
        }),
        prisma.attendance.findMany({
          where: { batchId: { in: assignedBatchIds } },
          include: {
            student: { select: { id: true, fullName: true, studentCode: true } },
            batch: { select: { id: true, name: true, code: true } },
          },
          orderBy: { date: "desc" },
          take: 100,
        }),
        prisma.notification.findMany({
          where: {
            OR: [
              { roleTarget: "ALL" },
              { roleTarget: "TEACHER" },
              { batchId: { in: assignedBatchIds } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    return NextResponse.json({
      teacher,
      examinations,
      studyMaterials,
      assignments,
      attendanceRecords,
      notifications,
    });
  } catch (err) {
    console.error("Teacher portal API error:", err);
    return NextResponse.json(
      { error: "Failed to load teacher portal data." },
      { status: 500 }
    );
  }
}

