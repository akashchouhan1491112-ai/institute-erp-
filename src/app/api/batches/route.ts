import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET() {
  const batches = await prisma.batch.findMany({
    include: {
      course: { select: { id: true, title: true, code: true } },
      teacher: { select: { id: true, fullName: true, specialization: true } },
      enrollments: {
        include: {
          student: { select: { id: true, studentCode: true, fullName: true, phone: true } },
        },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ batches });
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
      name,
      courseId,
      teacherId,
      startDate,
      endDate,
      days,
      timing,
      mode = "OFFLINE",
      room,
      maxCapacity = 40,
    } = body;

    if (!code || !name || !courseId || !timing) {
      return NextResponse.json(
        { error: "Batch code, name, course, and class timings are required." },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        courseId,
        teacherId: teacherId || null,
        startDate: startDate || "2026-11-01",
        endDate: endDate || "2027-10-31",
        days: days || "Mon, Tue, Wed, Thu, Fri",
        timing,
        mode,
        room: room || "Lecture Hall 101",
        maxCapacity: Number(maxCapacity) || 40,
        status: "ACTIVE",
      },
      include: {
        course: true,
        teacher: true,
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "BATCH_CREATED",
      entityType: "BATCH",
      entityId: batch.id,
      details: `Created batch ${batch.code} - ${batch.name} (Max Capacity: ${batch.maxCapacity})`,
    });

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    console.error("Create batch error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create batch." },
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
    const { id, name, teacherId, days, timing, room, maxCapacity, status, mode } = body;
    if (!id) {
      return NextResponse.json({ error: "Batch ID is required." }, { status: 400 });
    }

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(teacherId !== undefined ? { teacherId: teacherId || null } : {}),
        ...(days ? { days } : {}),
        ...(timing ? { timing } : {}),
        ...(room ? { room } : {}),
        ...(mode ? { mode } : {}),
        ...(maxCapacity !== undefined ? { maxCapacity: Number(maxCapacity) } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (err) {
    console.error("Update batch error:", err);
    return NextResponse.json({ error: "Failed to update batch." }, { status: 500 });
  }
}

