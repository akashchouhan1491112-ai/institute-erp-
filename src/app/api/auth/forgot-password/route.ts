import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, logAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, resetToken, newPassword } = body;

    if (action === "REQUEST_TOKEN") {
      if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (!user) {
        return NextResponse.json(
          { error: "No account found with that email address." },
          { status: 404 }
        );
      }
      const token = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpires: expires },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Password Reset OTP Generated",
          message: `Your password reset verification code is ${token} (valid for 30 minutes).`,
          category: "SECURITY",
          channel: "IN_APP",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password reset verification code generated.",
        demoResetToken: token, // Provided in response for instant testing without external SMTP
      });
    }

    if (action === "RESET_PASSWORD") {
      if (!email || !resetToken || !newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Email, valid verification token, and password (min 6 chars) are required." },
          { status: 400 }
        );
      }
      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (
        !user ||
        user.resetToken !== resetToken ||
        !user.resetExpires ||
        user.resetExpires < new Date()
      ) {
        return NextResponse.json(
          { error: "Invalid or expired reset token." },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetExpires: null },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "PASSWORD_RESET",
        entityType: "USER",
        entityId: user.id,
        details: `Password reset completed for ${user.email}`,
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully. You may now sign in.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to process password reset." }, { status: 500 });
  }
}

