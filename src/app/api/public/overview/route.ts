import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [settings, courses, batches, teachers, cmsBlocks, branches, publicMaterials] =
      await Promise.all([
        prisma.instituteSetting.findFirst(),
        prisma.course.findMany({
          where: { status: "ACTIVE" },
          include: {
            batches: {
              where: { status: "ACTIVE" },
              include: {
                teacher: { select: { fullName: true, qualification: true } },
                _count: { select: { enrollments: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.batch.findMany({
          where: { status: "ACTIVE" },
          include: {
            course: { select: { title: true, code: true } },
            teacher: { select: { fullName: true } },
            _count: { select: { enrollments: true } },
          },
        }),
        prisma.teacher.findMany({
          where: { isPublic: true, status: "ACTIVE" },
          orderBy: { experienceYears: "desc" },
        }),
        prisma.websiteContent.findMany({
          where: { isActive: true },
        }),
        prisma.branch.findMany(),
        prisma.studyMaterial.findMany({
          where: { isPublic: true },
          include: { course: { select: { title: true } } },
        }),
      ]);

    const cmsMap: Record<string, any> = {};
    for (const block of cmsBlocks) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(block.contentJson);
      } catch {
        parsed = {};
      }
      cmsMap[block.section] = {
        id: block.id,
        title: block.title,
        subtitle: block.subtitle,
        data: parsed,
      };
    }

    return NextResponse.json({
      settings,
      courses,
      batches,
      teachers,
      cms: cmsMap,
      branches,
      publicMaterials,
    });
  } catch (error) {
    console.error("Public overview API error:", error);
    return NextResponse.json(
      { error: "Failed to load institute overview." },
      { status: 500 }
    );
  }
}

