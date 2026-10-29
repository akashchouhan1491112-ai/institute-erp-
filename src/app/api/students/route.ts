import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    include: {
      guardian: true,
      course: { select: { id: true, title: true, code: true } },
      batches: {
        include: {
          batch: { select: { id: true, name: true, code: true, timing: true, days: true } },
        },
      },
      feeAssignments: {
        include: {
          installments: { orderBy: { installmentNo: "asc" } },
        },
      },
      payments: {
        include: { receipt: true },
        orderBy: { paidAt: "desc" },
      },
      attendance: true,
      examMarks: {
        include: { examination: true },
      },
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Support Bulk CSV/JSON Import
    if (body.action === "BULK_IMPORT" && Array.isArray(body.students)) {
      const createdList = [];
      const passwordHash = await hashPassword("Pass@123");
      const defaultCourse = await prisma.course.findFirst();

      for (const row of body.students) {
        if (!row.fullName || !row.phone || !row.email) continue;
        const count = await prisma.student.count();
        const code = `STU-2026-${1000 + count + 1}${Math.floor(10 + Math.random() * 89)}`;
        const admNo = `ADM-2026-${1000 + count + 1}${Math.floor(10 + Math.random() * 89)}`;

        const u = await prisma.user.upsert({
          where: { email: row.email.trim().toLowerCase() },
          update: {},
          create: {
            name: row.fullName.trim(),
            email: row.email.trim().toLowerCase(),
            phone: String(row.phone).slice(-10),
            passwordHash,
            role: "STUDENT",
          },
        });

        const s = await prisma.student.create({
          data: {
            userId: u.id,
            studentCode: code,
            admissionNumber: admNo,
            fullName: row.fullName.trim(),
            dob: row.dob || "2009-01-01",
            gender: row.gender || "Male",
            phone: String(row.phone).slice(-10),
            email: row.email.trim().toLowerCase(),
            address: row.address || "Noida",
            city: row.city || "Noida",
            state: row.state || "Uttar Pradesh",
            pinCode: row.pinCode || "201301",
            qualification: row.qualification || "Class 10",
            previousSchool: row.previousSchool || "CBSE School",
            courseId: row.courseId || defaultCourse?.id || null,
            status: "ACTIVE",
          },
        });
        createdList.push(s);
      }

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "STUDENT_BULK_IMPORT",
        entityType: "STUDENT",
        entityId: "BULK",
        details: `Bulk imported ${createdList.length} students.`,
      });

      return NextResponse.json({
        success: true,
        importedCount: createdList.length,
        students: createdList,
      });
    }

    // Direct Single Student Add by Admin
    const {
      fullName,
      email,
      phone,
      dob = "2009-05-10",
      gender = "Male",
      address = "Sector 62, Noida",
      city = "Noida",
      state = "Uttar Pradesh",
      pinCode = "201309",
      qualification = "Class 10 Passed",
      previousSchool = "DPS Noida",
      fatherName = "Guardian",
      motherName = "Guardian",
      parentPhone,
      occupation = "Service",
      courseId,
      batchId,
      discountAmount = 0,
    } = body;

    if (!fullName || !email || !phone || !courseId) {
      return NextResponse.json(
        { error: "Full name, email, phone, and course are required." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Selected course not found." }, { status: 404 });
    }

    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { _count: { select: { enrollments: true } } },
      });
      if (batch && batch._count.enrollments >= batch.maxCapacity && !body.overrideCapacity) {
        return NextResponse.json(
          { error: `Batch ${batch.name} is at maximum capacity (${batch.maxCapacity}).` },
          { status: 409 }
        );
      }
    }

    const count = await prisma.student.count();
    const suffix = Math.floor(10 + Math.random() * 89);
    const studentCode = `STU-2026-${1000 + count + 1}${suffix}`;
    const admissionNumber = `ADM-2026-${1000 + count + 1}${suffix}`;
    const passwordHash = await hashPassword("Pass@123");

    const studentUser = await prisma.user.create({
      data: {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: String(phone).slice(-10),
        passwordHash,
        role: "STUDENT",
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        studentCode,
        admissionNumber,
        fullName: fullName.trim(),
        dob,
        gender,
        phone: String(phone).slice(-10),
        email: email.trim().toLowerCase(),
        address,
        city,
        state,
        pinCode,
        qualification,
        previousSchool,
        courseId: course.id,
        status: "ACTIVE",
      },
    });

    await prisma.guardian.create({
      data: {
        studentId: student.id,
        fatherName,
        motherName,
        guardianPhone: String(parentPhone || phone).slice(-10),
        occupation,
        emergencyPhone: String(parentPhone || phone).slice(-10),
      },
    });

    if (batchId) {
      await prisma.studentBatch.create({
        data: { studentId: student.id, batchId },
      });
    }

    const gross =
      course.baseFee +
      course.registrationFee +
      course.admissionFee +
      course.studyMatFee +
      course.examFee;
    const disc = Number(discountAmount) || 0;
    const taxable = Math.max(0, gross - disc);
    const taxAmount = Math.round(taxable * (course.gstPercent / 100));
    const netPayable = taxable + taxAmount;

    const feeAssignment = await prisma.studentFeeAssignment.create({
      data: {
        studentId: student.id,
        baseTuitionFee: course.baseFee,
        registrationFee: course.registrationFee,
        admissionFee: course.admissionFee,
        studyMaterialFee: course.studyMatFee,
        examFee: course.examFee,
        discountAmount: disc,
        discountReason: disc > 0 ? "Admin Concession" : null,
        gstPercent: course.gstPercent,
        taxAmount,
        netPayable,
        paidAmount: 0,
        balanceAmount: netPayable,
        status: "UNPAID",
      },
    });

    const i1 = Math.round(netPayable * 0.5);
    const i2 = netPayable - i1;

    await prisma.installmentSchedule.createMany({
      data: [
        {
          feeAssignmentId: feeAssignment.id,
          installmentNo: 1,
          title: "Installment 1 (Admission & Term 1 Fee)",
          dueDate: "2026-11-10",
          amount: i1,
          status: "PENDING",
        },
        {
          feeAssignmentId: feeAssignment.id,
          installmentNo: 2,
          title: "Installment 2 (Term 2 Fee)",
          dueDate: "2027-02-10",
          amount: i2,
          status: "PENDING",
        },
      ],
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "STUDENT_DIRECT_CREATED",
      entityType: "STUDENT",
      entityId: student.id,
      details: `Added student ${student.fullName} (${student.studentCode}) directly.`,
    });

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error("Add student error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to add student." },
      { status: 500 }
    );
  }
}

/**
 * Updates student profile, status (ACTIVE, INACTIVE, COMPLETED, DROPPED_OUT),
 * batch allocation, or guardian details.
 * Preserves all fee transaction history even when a student is deactivated.
 */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      fullName,
      phone,
      address,
      city,
      state,
      status,
      courseId,
      batchId,
      fatherName,
      motherName,
      guardianPhone,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(phone ? { phone } : {}),
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(status ? { status } : {}),
        ...(courseId ? { courseId } : {}),
      },
    });

    if (fatherName || motherName || guardianPhone) {
      await prisma.guardian.updateMany({
        where: { studentId: id },
        data: {
          ...(fatherName ? { fatherName } : {}),
          ...(motherName ? { motherName } : {}),
          ...(guardianPhone ? { guardianPhone } : {}),
        },
      });
    }

    if (batchId) {
      await prisma.studentBatch.upsert({
        where: {
          studentId_batchId: { studentId: id, batchId },
        },
        update: { isActive: true },
        create: { studentId: id, batchId, isActive: true },
      });
    }

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "STUDENT_UPDATED",
      entityType: "STUDENT",
      entityId: updated.id,
      details: `Updated student ${updated.studentCode} (Status: ${updated.status}). Financial ledger preserved.`,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (err) {
    console.error("Update student error:", err);
    return NextResponse.json({ error: "Failed to update student." }, { status: 500 });
  }
}

