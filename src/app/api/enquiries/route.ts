import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ enquiries });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, courseInterest, message, source } = body;

    if (!name || !phone || !courseInterest) {
      return NextResponse.json(
        { error: "Name, mobile number, and interested course are required." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        phone: cleanPhone.slice(-10),
        email: (email || "visitor@vidyavikas.edu.in").trim(),
        courseInterest,
        message: message || "Interested in admission and scholarship counselling.",
        source: source || "WEBSITE",
        status: "NEW",
      },
    });

    await prisma.notification.create({
      data: {
        roleTarget: "ADMIN",
        title: `New Admission Enquiry from ${enquiry.name}`,
        message: `${enquiry.name} (${enquiry.phone}) enquired about ${enquiry.courseInterest}.`,
        category: "ENQUIRY",
        channel: "IN_APP",
      },
    });

    return NextResponse.json({
      success: true,
      enquiry,
      message: "Thank you! Our academic counsellor will contact you shortly.",
    });
  } catch (err) {
    console.error("Create enquiry error:", err);
    return NextResponse.json(
      { error: "Could not submit enquiry." },
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
    const { id, status, followUpDate, notes, assignedTo } = body;
    if (!id) {
      return NextResponse.json({ error: "Enquiry ID required." }, { status: 400 });
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(followUpDate !== undefined ? { followUpDate } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "ENQUIRY_UPDATED",
      entityType: "ENQUIRY",
      entityId: updated.id,
      details: `Updated enquiry ${updated.name} to status ${updated.status}`,
    });

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (err) {
    console.error("Update enquiry error:", err);
    return NextResponse.json({ error: "Failed to update enquiry." }, { status: 500 });
  }
}

