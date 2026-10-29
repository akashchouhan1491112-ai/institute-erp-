import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings, cmsBlocks, teachers, notifications, auditLogs] = await Promise.all([
    prisma.instituteSetting.findFirst(),
    prisma.websiteContent.findMany(),
    prisma.teacher.findMany({
      include: { batches: { select: { id: true, name: true, code: true } } },
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    settings,
    cmsBlocks,
    teachers,
    notifications,
    auditLogs,
  });
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

    // 1. Broadcast Notification / Announcement
    if (action === "SEND_NOTIFICATION") {
      const {
        roleTarget = "ALL",
        batchId,
        title,
        message,
        category = "ANNOUNCEMENT",
        channel = "IN_APP",
      } = body;

      if (!title || !message) {
        return NextResponse.json(
          { error: "Title and message are required." },
          { status: 400 }
        );
      }

      const notif = await prisma.notification.create({
        data: {
          roleTarget,
          batchId: batchId || null,
          title: title.trim(),
          message: message.trim(),
          category,
          channel,
        },
      });

      return NextResponse.json({
        success: true,
        notification: notif,
        message: "Announcement broadcasted successfully!",
      });
    }

    // Admin-only actions below
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Add New Teacher / Faculty
    if (action === "ADD_TEACHER") {
      const {
        fullName,
        email,
        phone,
        designation,
        specialization,
        qualification,
        experienceYears = 8,
        bio,
      } = body;

      if (!fullName || !email || !phone || !specialization) {
        return NextResponse.json(
          { error: "Full name, email, phone, and specialization are required." },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword("Pass@123");
      const count = await prisma.teacher.count();
      const employeeCode = `FAC-2026-0${count + 1}${Math.floor(10 + Math.random() * 89)}`;

      const tUser = await prisma.user.create({
        data: {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: String(phone).slice(-10),
          passwordHash,
          role: "TEACHER",
        },
      });

      const teacher = await prisma.teacher.create({
        data: {
          userId: tUser.id,
          employeeCode,
          fullName: fullName.trim(),
          designation: designation || "Senior Faculty",
          specialization: specialization.trim(),
          qualification: qualification || "M.Tech / Ph.D.",
          experienceYears: Number(experienceYears) || 8,
          phone: String(phone).slice(-10),
          email: email.trim().toLowerCase(),
          bio: bio || `Experienced mentor specializing in ${specialization}.`,
          isPublic: true,
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "TEACHER_CREATED",
        entityType: "TEACHER",
        entityId: teacher.id,
        details: `Added faculty member ${teacher.fullName} (${teacher.employeeCode})`,
      });

      return NextResponse.json({
        success: true,
        teacher,
        message: `Faculty ${teacher.fullName} (${employeeCode}) added! Login: ${teacher.email} / Pass@123`,
      });
    }

    // 3. Update Website CMS Block
    if (action === "UPDATE_CMS_BLOCK") {
      const { section, title, subtitle, contentJson } = body;
      if (!section || !title) {
        return NextResponse.json(
          { error: "Section and title are required." },
          { status: 400 }
        );
      }

      const serialized =
        typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson || {});

      const block = await prisma.websiteContent.upsert({
        where: { section },
        update: {
          title,
          subtitle: subtitle || "",
          contentJson: serialized,
          updatedBy: user.name,
        },
        create: {
          section,
          title,
          subtitle: subtitle || "",
          contentJson: serialized,
          updatedBy: user.name,
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "CMS_CONTENT_UPDATED",
        entityType: "CMS",
        entityId: block.id,
        details: `Updated public website CMS section: ${section}`,
      });

      return NextResponse.json({
        success: true,
        block,
        message: `Website section "${section}" updated and live on public pages!`,
      });
    }

    // 4. Update Global Institute Settings
    if (action === "UPDATE_SETTINGS") {
      const existing = await prisma.instituteSetting.findFirst();
      const {
        instituteName,
        tagline,
        address,
        phone,
        whatsapp,
        email,
        academicSession,
        gstNumber,
        defaultGstPercent,
        enableOnlinePayment,
        enableEmailAlerts,
        enableSmsAlerts,
        enableWhatsappAlerts,
      } = body;

      const updated = existing
        ? await prisma.instituteSetting.update({
            where: { id: existing.id },
            data: {
              ...(instituteName ? { instituteName } : {}),
              ...(tagline ? { tagline } : {}),
              ...(address ? { address } : {}),
              ...(phone ? { phone } : {}),
              ...(whatsapp ? { whatsapp } : {}),
              ...(email ? { email } : {}),
              ...(academicSession ? { academicSession } : {}),
              ...(gstNumber ? { gstNumber } : {}),
              ...(defaultGstPercent !== undefined
                ? { defaultGstPercent: Number(defaultGstPercent) }
                : {}),
              ...(enableOnlinePayment !== undefined
                ? { enableOnlinePayment: Boolean(enableOnlinePayment) }
                : {}),
              ...(enableEmailAlerts !== undefined
                ? { enableEmailAlerts: Boolean(enableEmailAlerts) }
                : {}),
              ...(enableSmsAlerts !== undefined
                ? { enableSmsAlerts: Boolean(enableSmsAlerts) }
                : {}),
              ...(enableWhatsappAlerts !== undefined
                ? { enableWhatsappAlerts: Boolean(enableWhatsappAlerts) }
                : {}),
            },
          })
        : await prisma.instituteSetting.create({ data: {} });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "INSTITUTE_SETTINGS_UPDATED",
        entityType: "SETTINGS",
        entityId: updated.id,
        details: `Updated institute configuration (${updated.instituteName}, GST: ${updated.defaultGstPercent}%)`,
      });

      return NextResponse.json({
        success: true,
        settings: updated,
        message: "Institute settings saved successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid CMS/Settings action." }, { status: 400 });
  } catch (err: any) {
    console.error("CMS POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process CMS/Settings request." },
      { status: 500 }
    );
  }
}

