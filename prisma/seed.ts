import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing clean production database state...");

  // Clear all transactional and sample records
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.studyMaterial.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.examMark.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installmentSchedule.deleteMany();
  await prisma.studentFeeAssignment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.document.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.studentBatch.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.role.deleteMany();
  await prisma.websiteContent.deleteMany();
  await prisma.instituteSetting.deleteMany();

  // 1. Default Institute Settings (Configurable from Admin -> Settings)
  await prisma.instituteSetting.create({
    data: {
      instituteName: "National Institute of Academic Studies",
      tagline: "Classroom & Integrated Preparation for Competitive Examinations",
      logoText: "NIAS",
      address: "Academic Block, Institutional Area, New Delhi - 110016",
      phone: "+91 11 2650 0000",
      whatsapp: "911126500000",
      email: "office@institute.edu.in",
      website: "https://www.institute.edu.in",
      academicSession: "2026-2027",
      gstNumber: "07AAACN0000A1Z5",
      defaultGstPercent: 18,
      enableOnlinePayment: true,
      enableEmailAlerts: true,
      enableSmsAlerts: true,
      enableWhatsappAlerts: true,
    },
  });

  // 2. System Roles (RBAC)
  await prisma.role.createMany({
    data: [
      {
        name: "SUPER_ADMIN",
        displayName: "System Administrator",
        permissionsJson: JSON.stringify(["ALL"]),
      },
      {
        name: "ADMIN",
        displayName: "Admissions & Accounts Officer",
        permissionsJson: JSON.stringify([
          "STUDENTS",
          "REGISTRATIONS",
          "ADMISSIONS",
          "FEES",
          "COURSES",
          "BATCHES",
          "ATTENDANCE",
          "EXAMS",
          "ENQUIRIES",
          "REPORTS",
          "CMS",
        ]),
      },
      {
        name: "TEACHER",
        displayName: "Faculty Member",
        permissionsJson: JSON.stringify([
          "ASSIGNED_BATCHES",
          "MARK_ATTENDANCE",
          "UPLOAD_MATERIALS",
          "CREATE_ASSIGNMENTS",
          "ENTER_MARKS",
          "POST_ANNOUNCEMENTS",
        ]),
      },
      {
        name: "STUDENT",
        displayName: "Enrolled Student",
        permissionsJson: JSON.stringify([
          "OWN_PROFILE",
          "PAY_FEES",
          "VIEW_ATTENDANCE",
          "VIEW_MATERIALS",
          "VIEW_RESULTS",
        ]),
      },
      {
        name: "PARENT",
        displayName: "Parent / Guardian",
        permissionsJson: JSON.stringify([
          "WARD_PROFILE",
          "PAY_FEES",
          "VIEW_ATTENDANCE",
          "VIEW_RESULTS",
        ]),
      },
    ],
  });

  // 3. Primary Campus Branch
  const mainBranch = await prisma.branch.create({
    data: {
      code: "MAIN-01",
      name: "Main Academic Campus",
      city: "New Delhi",
      state: "Delhi",
      address: "Academic Block, Institutional Area, New Delhi - 110016",
      phone: "+91 11 2650 0000",
      email: "office@institute.edu.in",
      gstNumber: "07AAACN0000A1Z5",
      isMain: true,
    },
  });

  // 4. Bootstrap System Administrator Account
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@institute.edu.in",
      phone: "9000000001",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });

  // 5. Clean Website CMS Defaults
  await prisma.websiteContent.createMany({
    data: [
      {
        section: "HERO",
        title: "Structured Academic Coaching & Institutional ERP Platform",
        subtitle:
          "Centralized portal for online registrations, admissions, fee management, attendance tracking, and examination evaluation.",
        contentJson: JSON.stringify({
          badge: "Academic Session 2026–2027",
          primaryCtaText: "Online Registration",
          primaryCtaLink: "/register",
          secondaryCtaText: "View Courses",
          secondaryCtaLink: "/courses",
          stats: [
            { label: "Academic Session", value: "2026–27" },
            { label: "Class Modes", value: "Offline & Hybrid" },
            { label: "Student Portal", value: "24×7 Access" },
            { label: "Fee Receipts", value: "GST Compliant" },
          ],
        }),
      },
      {
        section: "ANNOUNCEMENTS",
        title: "Official Notices & Circulars",
        subtitle: "Updates published from the Administration Desk",
        contentJson: JSON.stringify([]),
      },
      {
        section: "ACHIEVEMENTS",
        title: "Academic Results & Selections",
        subtitle: "Verified institutional examination records",
        contentJson: JSON.stringify([]),
      },
      {
        section: "TESTIMONIALS",
        title: "Student & Parent Feedback",
        subtitle: "Institutional feedback archive",
        contentJson: JSON.stringify([]),
      },
    ],
  });

  console.log("✅ Clean production bootstrap completed.");
  console.log("   Administrator Login: admin@institute.edu.in / Admin@123");
}

main()
  .catch((e) => {
    console.error("Bootstrap error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
