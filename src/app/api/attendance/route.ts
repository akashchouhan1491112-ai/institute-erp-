import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");

  if (user.role === "STUDENT") {
    const stu = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!stu) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const records = await prisma.attendance.findMany({
      where: { studentId: stu.id },
      include: { batch: { select: { name: true, code: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ records });
  }

  const records = await prisma.attendance.findMany({
    where: {
      ...(batchId ? { batchId } : {}),
      ...(date ? { date } : {}),
      ...(studentId ? { studentId } : {}),
    },
    include: {
      student: { select: { id: true, fullName: true, studentCode: true, phone: true } },
      batch: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (
    !user ||
    (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "TEACHER")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { batchId, date, entries } = body;
    // entries: Array<{ studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE", remarks?: string }>

    if (!batchId || !date || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Batch ID, date, and attendance entries are required." },
        { status: 400 }
      );
    }

    // If Teacher, verify they are assigned to this batch
    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      const batch = await prisma.batch.findUnique({ where: { id: batchId } });
      if (teacher && batch && batch.teacherId && batch.teacherId !== teacher.id) {
        return NextResponse.json(
          { error: "You can only mark attendance for your assigned batches." },
          { status: 403 }
        );
      }
    }

    const savedRecords = [];

    for (const item of entries) {
      if (!item.studentId || !item.status) continue;

      const existing = await prisma.attendance.findUnique({
        where: {
          batchId_studentId_date: {
            batchId,
            studentId: item.studentId,
            date,
          },
        },
      });

      let historyArr: any[] = [];
      if (existing) {
        try {
          historyArr = existing.correctionHistoryJson
            ? JSON.parse(existing.correctionHistoryJson)
            : [];
        } catch {
          historyArr = [];
        }
        if (existing.status !== item.status) {
          historyArr.push({
            previousStatus: existing.status,
            newStatus: item.status,
            changedBy: user.name,
            changedAt: new Date().toISOString(),
          });
        }
      }

      const record = await prisma.attendance.upsert({
        where: {
          batchId_studentId_date: {
            batchId,
            studentId: item.studentId,
            date,
          },
        },
        update: {
          status: item.status,
          remarks: item.remarks || null,
          markedBy: user.name,
          correctionHistoryJson: historyArr.length > 0 ? JSON.stringify(historyArr) : existing?.correctionHistoryJson,
        },
        create: {
          batchId,
          studentId: item.studentId,
          date,
          status: item.status,
          remarks: item.remarks || null,
          markedBy: user.name,
        },
      });

      savedRecords.push(record);

      // Check for low attendance (<75%) and trigger alert notification if absent
      if (item.status === "ABSENT") {
        const allStuAtt = await prisma.attendance.findMany({
          where: { studentId: item.studentId },
        });
        const presentCount = allStuAtt.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        const pct = allStuAtt.length > 0 ? Math.round((presentCount / allStuAtt.length) * 100) : 100;
        if (pct < 75) {
          const stu = await prisma.student.findUnique({ where: { id: item.studentId } });
          if (stu) {
            await prisma.notification.create({
              data: {
                userId: stu.userId,
                roleTarget: "STUDENT",
                title: `Low Attendance Alert (${pct}%)`,
                message: `Dear ${stu.fullName}, your cumulative class attendance is currently ${pct}% (Marked ABSENT on ${date}). Minimum 75% attendance is mandatory.`,
                category: "ATTENDANCE",
                channel: "IN_APP",
              },
            });
          }
        }
      }
    }

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "ATTENDANCE_MARKED",
      entityType: "ATTENDANCE",
      entityId: `${batchId}_${date}`,
      details: `Marked/updated attendance for ${savedRecords.length} students in batch ${batchId} on ${date}`,
    });

    return NextResponse.json({
      success: true,
      count: savedRecords.length,
      records: savedRecords,
      message: `Attendance saved for ${savedRecords.length} students on ${date}.`,
    });
  } catch (err: any) {
    console.error("Attendance POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save attendance." },
      { status: 500 }
    );
  }
}

