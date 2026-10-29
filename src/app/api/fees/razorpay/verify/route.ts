import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      feeAssignmentId,
      installmentId,
      amount,
      paymentMethod = "RAZORPAY_UPI",
      feeCategory = "TUITION",
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !feeAssignmentId ||
      !amount
    ) {
      return NextResponse.json(
        { error: "Missing Razorpay verification parameters." },
        { status: 400 }
      );
    }

    // 1. Strict Server-Side Cryptographic HMAC-SHA256 Signature Check
    const isAuthentic = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isAuthentic) {
      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "PAYMENT_SIGNATURE_VERIFICATION_FAILED",
        entityType: "PAYMENT",
        entityId: razorpay_order_id,
        details: `Rejected forged or invalid Razorpay signature for order ${razorpay_order_id}`,
      });

      return NextResponse.json(
        { error: "Payment signature verification failed on server. Transaction rejected." },
        { status: 400 }
      );
    }

    // 2. Idempotency / Duplicate Payment Prevention
    const existing = await prisma.payment.findFirst({
      where: {
        OR: [
          { razorpayPaymentId: razorpay_payment_id },
          { razorpayOrderId: razorpay_order_id },
          { transactionRef: razorpay_payment_id },
        ],
      },
      include: { receipt: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        idempotentReplay: true,
        payment: existing,
        receipt: existing.receipt,
        message: "Payment already verified and recorded.",
      });
    }

    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: feeAssignmentId },
      include: {
        student: {
          include: {
            course: true,
            batches: { include: { batch: true } },
          },
        },
        installments: { orderBy: { installmentNo: "asc" } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Fee assignment not found." }, { status: 404 });
    }

    const payAmount = Number(amount);
    const newPaidAmount = assignment.paidAmount + payAmount;
    const newBalanceAmount = Math.max(0, assignment.netPayable - newPaidAmount);
    const newStatus = newBalanceAmount === 0 ? "PAID" : "PARTIAL";
    const taxPortion = Math.round(
      payAmount - payAmount / (1 + assignment.gstPercent / 100)
    );

    const payment = await prisma.payment.create({
      data: {
        studentId: assignment.studentId,
        feeAssignmentId: assignment.id,
        installmentId: installmentId || null,
        feeCategory,
        amount: payAmount,
        taxAmount: taxPortion,
        paymentMethod,
        isOnline: true,
        transactionRef: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        verifiedBy: "Razorpay HMAC Server Verification",
        verifiedAt: new Date(),
        notes: `Online payment verified via Razorpay (${paymentMethod})`,
      },
    });

    await prisma.studentFeeAssignment.update({
      where: { id: assignment.id },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      },
    });

    if (installmentId) {
      const inst = assignment.installments.find((i) => i.id === installmentId);
      if (inst) {
        const instPaid = inst.paidAmount + payAmount;
        await prisma.installmentSchedule.update({
          where: { id: inst.id },
          data: {
            paidAmount: instPaid,
            status: instPaid >= inst.amount ? "PAID" : "PARTIAL",
            paidAt: new Date(),
          },
        });
      }
    } else {
      let rem = payAmount;
      for (const inst of assignment.installments) {
        if (inst.status === "PAID" || rem <= 0) continue;
        const needed = Math.max(0, inst.amount - inst.paidAmount);
        const applied = Math.min(needed, rem);
        if (applied > 0) {
          const updatedInstPaid = inst.paidAmount + applied;
          rem -= applied;
          await prisma.installmentSchedule.update({
            where: { id: inst.id },
            data: {
              paidAmount: updatedInstPaid,
              status: updatedInstPaid >= inst.amount ? "PAID" : "PARTIAL",
              paidAt: new Date(),
            },
          });
        }
      }
    }

    const receiptCount = await prisma.receipt.count();
    const receiptNumber = `RCP-2026-${String(receiptCount + 1).padStart(4, "0")}-${Math.floor(10 + Math.random() * 89)}`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        paymentId: payment.id,
        studentName: assignment.student.fullName,
        studentCode: assignment.student.studentCode,
        courseTitle: assignment.student.course?.title || "Coaching Program",
        batchName:
          assignment.student.batches[0]?.batch?.name || "Regular Classroom Batch",
        feeCategory,
        amountPaid: payAmount,
        taxAmount: taxPortion,
        paymentMethod,
        transactionRef: razorpay_payment_id,
        balanceRemaining: newBalanceAmount,
        issuedBy: "Razorpay Online Gateway",
      },
    });

    await prisma.notification.create({
      data: {
        userId: assignment.student.userId,
        roleTarget: "STUDENT",
        title: `Online Fee Payment Successful (${receiptNumber})`,
        message: `₹${payAmount.toLocaleString("en-IN")} received via ${paymentMethod} (Ref: ${razorpay_payment_id}). Receipt ${receiptNumber} is ready for download.`,
        category: "FEE",
        channel: "IN_APP",
      },
    });

    await logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "ONLINE_PAYMENT_VERIFIED",
      entityType: "PAYMENT",
      entityId: payment.id,
      details: `Verified online Razorpay payment ${razorpay_payment_id} of ₹${payAmount} for ${assignment.student.studentCode}. Receipt: ${receiptNumber}`,
    });

    return NextResponse.json({
      success: true,
      payment,
      receipt,
      message: `Online payment of ₹${payAmount.toLocaleString("en-IN")} verified! Receipt ${receiptNumber} generated.`,
    });
  } catch (err: any) {
    console.error("Verify Razorpay payment error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify online payment." },
      { status: 500 }
    );
  }
}

