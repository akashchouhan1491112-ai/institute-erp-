import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admissions = await prisma.admission.findMany({
    include: {
      registration: { include: { documents: true } },
      student: true,
      course: true,
      batch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ admissions });
}

/**
 * Converts an Approved Registration into a Confirmed Admission & Enrolled Student,
 * allocates Course & Batch (checking capacity with optional Admin override),
 * generates Admission Number & Student ID, creates Student login & Fee Schedule.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      registrationId,
      courseId,
      batchId,
      scholarshipDiscount = 0,
      discountReason = "Admission Scholarship Concession",
      planType = "INSTALLMENT",
      overrideCapacity = false,
      remarks = "Approved & enrolled into batch",
    } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }

    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { admission: true, course: true },
    });

    if (!reg) {
      return NextResponse.json(
        { error: "Registration record not found." },
        { status: 404 }
      );
    }

    if (reg.admission && reg.admission.studentId) {
      return NextResponse.json(
        { error: "This applicant has already been converted into an enrolled student." },
        { status: 400 }
      );
    }

    const targetCourseId = courseId || reg.courseId;
    const targetBatchId = batchId || reg.preferredBatchId;

    const course = await prisma.course.findUnique({ where: { id: targetCourseId } });
    if (!course) {
      return NextResponse.json({ error: "Selected course not found." }, { status: 404 });
    }

    // Batch capacity verification
    if (targetBatchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: targetBatchId },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!batch) {
        return NextResponse.json({ error: "Selected batch not found." }, { status: 404 });
      }
      if (batch._count.enrollments >= batch.maxCapacity && !overrideCapacity) {
        return NextResponse.json(
          {
            error: `Batch "${batch.name}" is at full capacity (${batch._count.enrollments}/${batch.maxCapacity}). Enable Administrator Capacity Override to enroll.`,
            capacityFull: true,
          },
          { status: 409 }
        );
      }
    }

    // Ensure registration is marked APPROVED and documents verified
    await prisma.registration.update({
      where: { id: reg.id },
      data: {
        status: "APPROVED",
        reviewedBy: user.name,
        reviewedAt: new Date(),
      },
    });

    await prisma.document.updateMany({
      where: { registrationId: reg.id },
      data: { verified: true, verifiedBy: user.name },
    });

    const studentCount = await prisma.student.count();
    const seq = 1000 + studentCount + 1;
    const suffix = Math.floor(10 + Math.random() * 89);
    const studentCode = `STU-2026-${seq}${suffix}`;
    const admissionNumber = `ADM-2026-${seq}${suffix}`;

    // Create or link User account for the Student portal
    let studentUser = await prisma.user.findUnique({
      where: { email: reg.email.toLowerCase() },
    });
    const passwordHash = await hashPassword("Pass@123");
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          name: reg.fullName,
          email: reg.email.toLowerCase(),
          phone: reg.phone,
          passwordHash,
          role: "STUDENT",
        },
      });
    }

    const mainBranch = await prisma.branch.findFirst({ where: { isMain: true } });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        branchId: mainBranch?.id || null,
        studentCode,
        admissionNumber,
        fullName: reg.fullName,
        dob: reg.dob,
        gender: reg.gender,
        phone: reg.phone,
        email: reg.email.toLowerCase(),
        photoUrl: reg.photoUrl,
        address: reg.address,
        city: reg.city,
        state: reg.state,
        pinCode: reg.pinCode,
        qualification: reg.qualification,
        previousSchool: reg.previousSchool,
        academicSession: "2026-2027",
        status: "ACTIVE",
        courseId: course.id,
      },
    });

    await prisma.guardian.create({
      data: {
        studentId: student.id,
        fatherName: reg.fatherName,
        motherName: reg.motherName,
        guardianPhone: reg.parentPhone,
        occupation: reg.occupation,
        emergencyPhone: reg.emergencyPhone,
      },
    });

    if (targetBatchId) {
      await prisma.studentBatch.create({
        data: {
          studentId: student.id,
          batchId: targetBatchId,
        },
      });
    }

    // Link uploaded documents to student
    await prisma.document.updateMany({
      where: { registrationId: reg.id },
      data: { studentId: student.id },
    });

    const admission = await prisma.admission.upsert({
      where: { registrationId: reg.id },
      update: {
        admissionNumber,
        studentId: student.id,
        courseId: course.id,
        batchId: targetBatchId || null,
        status: "ENROLLED",
        docsVerified: true,
        capacityOverridden: Boolean(overrideCapacity),
        scholarshipDiscount: Number(scholarshipDiscount) || 0,
        remarks,
        approvedBy: user.name,
      },
      create: {
        admissionNumber,
        registrationId: reg.id,
        studentId: student.id,
        courseId: course.id,
        batchId: targetBatchId || null,
        status: "ENROLLED",
        docsVerified: true,
        capacityOverridden: Boolean(overrideCapacity),
        scholarshipDiscount: Number(scholarshipDiscount) || 0,
        remarks,
        approvedBy: user.name,
      },
    });

    // Create Student Fee Assignment & Installment Schedule
    const discount = Number(scholarshipDiscount) || 0;
    const gross =
      course.baseFee +
      course.registrationFee +
      course.admissionFee +
      course.studyMatFee +
      course.examFee;
    const taxable = Math.max(0, gross - discount);
    const taxAmount = Math.round(taxable * (course.gstPercent / 100));
    const netPayable = taxable + taxAmount;

    const feeAssignment = await prisma.studentFeeAssignment.create({
      data: {
        studentId: student.id,
        academicSession: "2026-2027",
        planType,
        baseTuitionFee: course.baseFee,
        registrationFee: course.registrationFee,
        admissionFee: course.admissionFee,
        studyMaterialFee: course.studyMatFee,
        examFee: course.examFee,
        discountType: discount > 0 ? "SCHOLARSHIP" : null,
        discountAmount: discount,
        discountReason: discount > 0 ? discountReason : null,
        gstPercent: course.gstPercent,
        taxAmount,
        netPayable,
        paidAmount: 0,
        balanceAmount: netPayable,
        status: "UNPAID",
      },
    });

    if (planType === "ONE_TIME") {
      await prisma.installmentSchedule.create({
        data: {
          feeAssignmentId: feeAssignment.id,
          installmentNo: 1,
          title: "One-Time Full Course Fee Payment",
          category: "FULL_FEE",
          dueDate: "2026-11-05",
          amount: netPayable,
          status: "PENDING",
        },
      });
    } else {
      const i1 = Math.round(netPayable * 0.4);
      const i2 = Math.round(netPayable * 0.3);
      const i3 = netPayable - i1 - i2;

      await prisma.installmentSchedule.createMany({
        data: [
          {
            feeAssignmentId: feeAssignment.id,
            installmentNo: 1,
            title: "Installment 1 (Admission + Study Material + Q1 Tuition)",
            category: "ADMISSION_AND_TUITION",
            dueDate: "2026-11-05",
            amount: i1,
            status: "PENDING",
          },
          {
            feeAssignmentId: feeAssignment.id,
            installmentNo: 2,
            title: "Installment 2 (Mid-Term Tuition Fee)",
            category: "TUITION",
            dueDate: "2027-01-10",
            amount: i2,
            status: "PENDING",
          },
          {
            feeAssignmentId: feeAssignment.id,
            installmentNo: 3,
            title: "Installment 3 (Final Term Tuition & Exam Fee)",
            category: "TUITION",
            dueDate: "2027-03-15",
            amount: i3,
            status: "PENDING",
          },
        ],
      });
    }

    await prisma.notification.create({
      data: {
        userId: studentUser.id,
        roleTarget: "STUDENT",
        title: `Admission Confirmed! Welcome to VidyaVikas (${studentCode})`,
        message: `Your admission (${admissionNumber}) for ${course.title} is confirmed. Student Portal Login: ${student.email} | Default Password: Pass@123`,
        category: "ADMISSION",
        channel: "IN_APP",
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "ADMISSION_CONFIRMED_AND_ENROLLED",
      entityType: "ADMISSION",
      entityId: admission.id,
      details: `Enrolled student ${student.fullName} (${studentCode} / ${admissionNumber}) in course ${course.code}`,
    });

    return NextResponse.json({
      success: true,
      admission,
      student,
      feeAssignment,
      message: `Admission confirmed! Student ID ${studentCode} and Admission No ${admissionNumber} generated.`,
    });
  } catch (err: any) {
    console.error("Admission conversion error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to confirm admission." },
      { status: 500 }
    );
  }
}

