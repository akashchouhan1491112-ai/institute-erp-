import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regNumber = searchParams.get("regNumber");
    const phone = searchParams.get("phone");

    // Public tracking lookup by regNumber or phone
    if (regNumber || phone) {
      const registration = await prisma.registration.findFirst({
        where: {
          ...(regNumber ? { regNumber: regNumber.trim().toUpperCase() } : {}),
          ...(phone ? { phone: phone.trim().replace(/\D/g, "").slice(-10) } : {}),
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              duration: true,
              baseFee: true,
              registrationFee: true,
            },
          },
          preferredBatch: {
            select: { id: true, name: true, timing: true, days: true, mode: true },
          },
          documents: true,
          admission: {
            include: {
              student: {
                select: {
                  id: true,
                  studentCode: true,
                  admissionNumber: true,
                  email: true,
                  status: true,
                },
              },
              batch: { select: { name: true, timing: true, days: true, room: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!registration) {
        return NextResponse.json(
          { error: "No registration record found with the provided details." },
          { status: 404 }
        );
      }

      return NextResponse.json({ registration });
    }

    // Admin list all registrations
    const user = await getSessionUser(req);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const registrations = await prisma.registration.findMany({
      include: {
        course: { select: { id: true, title: true, code: true, baseFee: true } },
        preferredBatch: { select: { id: true, name: true, timing: true } },
        documents: true,
        admission: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      dob,
      gender,
      phone,
      email,
      photoUrl,
      address,
      city,
      state,
      pinCode,
      fatherName,
      motherName,
      parentPhone,
      occupation,
      emergencyPhone,
      qualification,
      previousSchool,
      academicDetails,
      courseId,
      preferredBatchId,
      status = "SUBMITTED",
      regFeePaid = true,
      regPaymentRef,
      parentConsent = true,
      documents = [],
    } = body;

    if (
      !fullName ||
      !dob ||
      !gender ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !state ||
      !pinCode ||
      !fatherName ||
      !motherName ||
      !parentPhone ||
      !qualification ||
      !previousSchool ||
      !courseId
    ) {
      return NextResponse.json(
        { error: "Please fill in all required personal, parent, and academic fields." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Student mobile number must be a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { error: "Selected course does not exist." },
        { status: 404 }
      );
    }

    // Generate unique registration number
    const count = await prisma.registration.count();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const regNumber = `REG-2026-${5000 + count + 1}-${randomSuffix}`;

    const registration = await prisma.registration.create({
      data: {
        regNumber,
        status: status === "DRAFT" ? "DRAFT" : "SUBMITTED",
        fullName: fullName.trim(),
        dob,
        gender,
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        photoUrl: photoUrl || `/uploads/docs/student_photo.jpg`,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: String(pinCode).trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        parentPhone: String(parentPhone).replace(/\D/g, "").slice(-10),
        occupation: occupation || "Private Service",
        emergencyPhone: String(emergencyPhone || parentPhone).replace(/\D/g, "").slice(-10),
        qualification,
        previousSchool,
        academicDetails: academicDetails || qualification,
        courseId: course.id,
        preferredBatchId: preferredBatchId || null,
        regFeeAmount: course.registrationFee,
        regFeePaid: Boolean(regFeePaid),
        regPaymentRef: regPaymentRef || `RZP_REG_${Date.now()}`,
        parentConsent: Boolean(parentConsent),
      },
      include: {
        course: true,
        preferredBatch: true,
      },
    });

    const docEntries =
      Array.isArray(documents) && documents.length > 0
        ? documents.map((d: any) => ({
            registrationId: registration.id,
            docType: d.docType || "OTHER",
            title: d.title || "Uploaded Document",
            fileName: d.fileName || "document.pdf",
            fileUrl: d.fileUrl || `/uploads/docs/${d.fileName || "document.pdf"}`,
            mimeType: d.mimeType || "application/pdf",
            verified: false,
          }))
        : [
            {
              registrationId: registration.id,
              docType: "PHOTO",
              title: "Student Photograph",
              fileName: "student_photo.jpg",
              fileUrl: "/uploads/docs/student_photo.jpg",
              mimeType: "image/jpeg",
              verified: false,
            },
            {
              registrationId: registration.id,
              docType: "ID_PROOF",
              title: "Identity Proof (Aadhaar / School ID)",
              fileName: "identity_proof.pdf",
              fileUrl: "/uploads/docs/identity_proof.pdf",
              mimeType: "application/pdf",
              verified: false,
            },
            {
              registrationId: registration.id,
              docType: "MARKSHEET",
              title: "Previous Academic Marksheet",
              fileName: "previous_marksheet.pdf",
              fileUrl: "/uploads/docs/previous_marksheet.pdf",
              mimeType: "application/pdf",
              verified: false,
            },
          ];

    await prisma.document.createMany({ data: docEntries });

    await prisma.notification.create({
      data: {
        roleTarget: "ADMIN",
        title: `New Online Registration: ${registration.regNumber}`,
        message: `${registration.fullName} registered for ${course.title} (Status: ${registration.status}).`,
        category: "REGISTRATION",
        channel: "IN_APP",
      },
    });

    await logAudit({
      actorName: registration.fullName,
      actorRole: "APPLICANT",
      action: "REGISTRATION_SUBMITTED",
      entityType: "REGISTRATION",
      entityId: registration.id,
      details: `Submitted online registration ${registration.regNumber} for course ${course.code}`,
    });

    return NextResponse.json({
      success: true,
      registration,
      message: `Registration submitted successfully! Your Registration Number is ${registration.regNumber}.`,
    });
  } catch (error: any) {
    console.error("Create registration error:", error);
    return NextResponse.json(
      { error: "Failed to submit registration." },
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
    const { id, status, reviewNotes, verifyAllDocs } = body;

    if (!id) {
      return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });
    }

    if (verifyAllDocs) {
      await prisma.document.updateMany({
        where: { registrationId: id },
        data: { verified: true, verifiedBy: user.name },
      });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(reviewNotes !== undefined ? { reviewNotes } : {}),
        reviewedBy: user.name,
        reviewedAt: new Date(),
      },
      include: {
        course: true,
        preferredBatch: true,
        documents: true,
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: `REGISTRATION_${status || "UPDATED"}`,
      entityType: "REGISTRATION",
      entityId: updated.id,
      details: `Updated registration ${updated.regNumber} to status ${updated.status}. Notes: ${reviewNotes || "N/A"}`,
    });

    return NextResponse.json({
      success: true,
      registration: updated,
    });
  } catch (err) {
    console.error("Update registration error:", err);
    return NextResponse.json(
      { error: "Failed to update registration." },
      { status: 500 }
    );
  }
}

