import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  getRazorpayPublicKey,
  computeRazorpayPaymentSignature,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { feeAssignmentId, installmentId, amount, paymentMethod = "RAZORPAY_UPI" } = body;

    const payAmount = Number(amount);
    if (!feeAssignmentId || !payAmount || payAmount <= 0) {
      return NextResponse.json(
        { error: "Valid fee assignment and positive payment amount are required." },
        { status: 400 }
      );
    }

    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: feeAssignmentId },
      include: { student: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Fee assignment not found." }, { status: 404 });
    }

    // Students can only initiate orders for their own fee ledger
    if (user.role === "STUDENT" && assignment.student.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orderId = `order_VV_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const simulatedPaymentId = `pay_VV_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const simulatedSignature = computeRazorpayPaymentSignature(orderId, simulatedPaymentId);

    return NextResponse.json({
      success: true,
      keyId: getRazorpayPublicKey(),
      order: {
        id: orderId,
        amount: Math.round(payAmount * 100), // in paise
        amountInRupees: payAmount,
        currency: "INR",
        feeAssignmentId: assignment.id,
        installmentId: installmentId || null,
        studentName: assignment.student.fullName,
        studentCode: assignment.student.studentCode,
        studentEmail: assignment.student.email,
        studentPhone: assignment.student.phone,
        paymentMethod,
      },
      // Provided so the integrated Razorpay Sandbox Checkout can sign test transactions for real server HMAC verification
      sandboxTestCredentials: {
        razorpay_order_id: orderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: simulatedSignature,
      },
    });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    return NextResponse.json(
      { error: "Failed to initialize Razorpay order." },
      { status: 500 }
    );
  }
}

