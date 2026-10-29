import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET() {
  const [studyMaterials, assignments] = await Promise.all([
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
  ]);

  return NextResponse.json({ studyMaterials, assignments });
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
    const { type } = body;

    const teacherRecord = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (type === "ASSIGNMENT") {
      const { batchId, title, subject, description, dueDate, maxMarks = 50 } = body;
      if (!batchId || !title || !subject || !dueDate) {
        return NextResponse.json(
          { error: "Batch, title, subject, and due date are required." },
          { status: 400 }
        );
      }

      const assignment = await prisma.assignment.create({
        data: {
          batchId,
          teacherId: teacherRecord?.id || null,
          title: title.trim(),
          subject: subject.trim(),
          description: description || title,
          dueDate,
          maxMarks: Number(maxMarks) || 50,
        },
      });

      await prisma.notification.create({
        data: {
          roleTarget: "STUDENT",
          batchId,
          title: `New Assignment Posted: ${assignment.title}`,
          message: `Subject: ${assignment.subject} | Due Date: ${assignment.dueDate}`,
          category: "ASSIGNMENT",
          channel: "IN_APP",
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "ASSIGNMENT_CREATED",
        entityType: "ASSIGNMENT",
        entityId: assignment.id,
        details: `Created assignment "${assignment.title}" for batch ${batchId}`,
      });

      return NextResponse.json({
        success: true,
        assignment,
        message: "Assignment published and students notified!",
      });
    }

    // Default: Study Material Upload
    const {
      courseId,
      batchId,
      title,
      subject,
      category = "LECTURE_NOTES",
      description,
      fileUrl,
      isPublic = false,
    } = body;

    if (!courseId || !title || !subject) {
      return NextResponse.json(
        { error: "Course, title, and subject are required." },
        { status: 400 }
      );
    }

    const material = await prisma.studyMaterial.create({
      data: {
        courseId,
        batchId: batchId || null,
        teacherId: teacherRecord?.id || null,
        title: title.trim(),
        subject: subject.trim(),
        category,
        description: description || title,
        fileUrl: fileUrl || `/materials/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
        isPublic: Boolean(isPublic),
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "STUDY_MATERIAL_UPLOADED",
      entityType: "STUDY_MATERIAL",
      entityId: material.id,
      details: `Uploaded study material "${material.title}" (${material.category})`,
    });

    return NextResponse.json({
      success: true,
      material,
      message: "Study material uploaded successfully!",
    });
  } catch (err: any) {
    console.error("Materials POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save material/assignment." },
      { status: 500 }
    );
  }
}

