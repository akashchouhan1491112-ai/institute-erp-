import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 35) return "D";
  return "F";
}

export async function GET() {
  const examinations = await prisma.examination.findMany({
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
  });

  return NextResponse.json({ examinations });
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
    const { action } = body;

    // 1. Create a new Examination
    if (action === "CREATE_EXAM") {
      const {
        code,
        title,
        courseId,
        batchId,
        subject,
        examDate,
        durationMins = 180,
        maxMarks = 300,
        passingMarks = 100,
        examType = "UNIT_TEST",
      } = body;

      if (!title || !courseId || !batchId || !subject || !examDate) {
        return NextResponse.json(
          { error: "Title, course, batch, subject, and exam date are required." },
          { status: 400 }
        );
      }

      const examCode =
        code?.trim().toUpperCase() ||
        `EXM-${Date.now().toString().slice(-5)}`;

      const exam = await prisma.examination.create({
        data: {
          code: examCode,
          title: title.trim(),
          courseId,
          batchId,
          subject,
          examDate,
          durationMins: Number(durationMins) || 180,
          maxMarks: Number(maxMarks) || 300,
          passingMarks: Number(passingMarks) || 100,
          examType,
          isPublished: false,
        },
      });

      await prisma.notification.create({
        data: {
          roleTarget: "STUDENT",
          batchId,
          title: `New Examination Scheduled: ${exam.title}`,
          message: `Exam Date: ${exam.examDate} | Subject: ${exam.subject} | Max Marks: ${exam.maxMarks}`,
          category: "EXAM",
          channel: "IN_APP",
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "EXAMINATION_CREATED",
        entityType: "EXAMINATION",
        entityId: exam.id,
        details: `Scheduled exam ${exam.code} - ${exam.title} on ${exam.examDate}`,
      });

      return NextResponse.json({
        success: true,
        examination: exam,
        message: `Examination "${exam.title}" scheduled for ${exam.examDate}.`,
      });
    }

    // 2. Enter / Update Marks & Optionally Publish Results
    if (action === "SAVE_MARKS") {
      const { examinationId, marksList, publishResults = true } = body;
      // marksList: Array<{ studentId: string, marksObtained: number, remarks?: string }>

      if (!examinationId || !Array.isArray(marksList)) {
        return NextResponse.json(
          { error: "Examination ID and marks list are required." },
          { status: 400 }
        );
      }

      const exam = await prisma.examination.findUnique({
        where: { id: examinationId },
      });
      if (!exam) {
        return NextResponse.json({ error: "Examination not found." }, { status: 404 });
      }

      // Sort descending by marksObtained to assign batch ranks
      const sorted = [...marksList]
        .filter((m) => m.studentId && m.marksObtained !== undefined && m.marksObtained !== "")
        .map((m) => ({
          studentId: String(m.studentId),
          marksObtained: Math.min(exam.maxMarks, Math.max(0, Number(m.marksObtained))),
          remarks: m.remarks || "",
        }))
        .sort((a, b) => b.marksObtained - a.marksObtained);

      const savedMarks = [];

      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const pct = Number(((entry.marksObtained / exam.maxMarks) * 100).toFixed(2));
        const grade = calculateGrade(pct);
        const rank = i + 1;

        const saved = await prisma.examMark.upsert({
          where: {
            examinationId_studentId: {
              examinationId: exam.id,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: entry.marksObtained,
            maxMarks: exam.maxMarks,
            percentage: pct,
            grade,
            rankInBatch: rank,
            remarks: entry.remarks || `Batch Rank #${rank}`,
            enteredBy: user.name,
          },
          create: {
            examinationId: exam.id,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            maxMarks: exam.maxMarks,
            percentage: pct,
            grade,
            rankInBatch: rank,
            remarks: entry.remarks || `Batch Rank #${rank}`,
            enteredBy: user.name,
          },
        });

        savedMarks.push(saved);

        if (publishResults) {
          const stu = await prisma.student.findUnique({ where: { id: entry.studentId } });
          if (stu) {
            await prisma.notification.create({
              data: {
                userId: stu.userId,
                roleTarget: "STUDENT",
                title: `Result Published: ${exam.title}`,
                message: `You scored ${entry.marksObtained}/${exam.maxMarks} (${pct}%, Grade ${grade}, Rank #${rank}).`,
                category: "EXAM",
                channel: "IN_APP",
              },
            });
          }
        }
      }

      if (publishResults) {
        await prisma.examination.update({
          where: { id: exam.id },
          data: { isPublished: true },
        });
      }

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: publishResults ? "EXAM_RESULTS_PUBLISHED" : "EXAM_MARKS_SAVED",
        entityType: "EXAMINATION",
        entityId: exam.id,
        details: `Saved marks for ${savedMarks.length} students in ${exam.code} (Published: ${publishResults})`,
      });

      return NextResponse.json({
        success: true,
        savedCount: savedMarks.length,
        marks: savedMarks,
        message: publishResults
          ? `Marks saved and results published for ${savedMarks.length} students!`
          : `Marks saved for ${savedMarks.length} students.`,
      });
    }

    return NextResponse.json({ error: "Invalid exam action." }, { status: 400 });
  } catch (err: any) {
    console.error("Exams POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process examination action." },
      { status: 500 }
    );
  }
}

