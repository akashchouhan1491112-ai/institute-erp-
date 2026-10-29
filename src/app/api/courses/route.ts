import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      batches: {
        include: {
          teacher: { select: { id: true, fullName: true, specialization: true } },
          _count: { select: { enrollments: true } },
        },
      },
      _count: { select: { students: true, registrations: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      code,
      title,
      category,
      shortDesc,
      description,
      duration,
      eligibility,
      syllabus,
      baseFee,
      registrationFee = 1000,
      admissionFee = 5000,
      studyMatFee = 4000,
      examFee = 2000,
      gstPercent = 18,
      capacity = 100,
      facultySummary,
    } = body;

    if (!code || !title || !category || !duration || !baseFee) {
      return NextResponse.json(
        { error: "Code, title, category, duration, and base fee are required." },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      code.toLowerCase().replace(/[^a-z0-9]+/g, "");

    const syllabusArray = Array.isArray(syllabus)
      ? syllabus
      : String(syllabus || "Module 1: Core Fundamentals\nModule 2: Advanced Problem Solving")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    const course = await prisma.course.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        slug,
        category,
        shortDesc: shortDesc || description || title,
        description: description || shortDesc || title,
        duration,
        eligibility: eligibility || "Class 10 / 12 Passed",
        syllabusJson: JSON.stringify(syllabusArray),
        baseFee: Number(baseFee),
        registrationFee: Number(registrationFee),
        admissionFee: Number(admissionFee),
        studyMatFee: Number(studyMatFee),
        examFee: Number(examFee),
        gstPercent: Number(gstPercent),
        capacity: Number(capacity),
        facultySummary: facultySummary || "Senior Institute Faculty",
        status: "ACTIVE",
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "COURSE_CREATED",
      entityType: "COURSE",
      entityId: course.id,
      details: `Created course ${course.code} - ${course.title} (Base Fee: ₹${course.baseFee})`,
    });

    return NextResponse.json({ success: true, course });
  } catch (err: any) {
    console.error("Create course error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create course." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title, shortDesc, description, duration, eligibility, baseFee, gstPercent, capacity, status, syllabus } = body;
    if (!id) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(shortDesc ? { shortDesc } : {}),
        ...(description ? { description } : {}),
        ...(duration ? { duration } : {}),
        ...(eligibility ? { eligibility } : {}),
        ...(baseFee !== undefined ? { baseFee: Number(baseFee) } : {}),
        ...(gstPercent !== undefined ? { gstPercent: Number(gstPercent) } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(status ? { status } : {}),
        ...(syllabus
          ? {
              syllabusJson: JSON.stringify(
                Array.isArray(syllabus) ? syllabus : String(syllabus).split("\n").filter(Boolean)
              ),
            }
          : {}),
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "COURSE_UPDATED",
      entityType: "COURSE",
      entityId: updated.id,
      details: `Updated course ${updated.code} (${updated.status})`,
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (err) {
    console.error("Update course error:", err);
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}

