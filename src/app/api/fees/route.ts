import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, logAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If student, return only their own fee assignments, payments, and receipts
  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        course: true,
        batches: { include: { batch: true } },
        feeAssignments: {
          include: {
            installments: { orderBy: { installmentNo: "asc" } },
          },
        },
        payments: {
          include: { receipt: true, refunds: true },
          orderBy: { paidAt: "desc" },
        },
      },
    });
    return NextResponse.json({ student });
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [feeAssignments, payments, receipts, refunds, feeStructures] = await Promise.all([
    prisma.studentFeeAssignment.findMany({
      include: {
        student: {
          include: {
            course: { select: { title: true, code: true } },
            batches: { include: { batch: { select: { name: true } } } },
          },
        },
        installments: { orderBy: { installmentNo: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      include: {
        student: { select: { fullName: true, studentCode: true } },
        receipt: true,
        refunds: true,
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.receipt.findMany({
      orderBy: { issuedAt: "desc" },
    }),
    prisma.refund.findMany({
      include: {
        payment: {
          include: { student: { select: { fullName: true, studentCode: true } } },
        },
      },
      orderBy: { processedAt: "desc" },
    }),
    prisma.feeStructure.findMany({
      include: { course: { select: { title: true, code: true } } },
    }),
  ]);

  const totalAssigned = feeAssignments.reduce((acc, f) => acc + f.netPayable, 0);
  const totalCollected = feeAssignments.reduce((acc, f) => acc + f.paidAmount, 0);
  const pendingFees = feeAssignments.reduce((acc, f) => acc + f.balanceAmount, 0);
  const overdueFees = feeAssignments
    .filter((f) => f.status === "OVERDUE")
    .reduce((acc, f) => acc + f.balanceAmount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = todayStr.slice(0, 7);

  const todaysCollection = payments
    .filter((p) => p.status === "SUCCESS" && p.paidAt.toISOString().slice(0, 10) === todayStr)
    .reduce((acc, p) => acc + p.amount, 0);

  const monthlyCollection = payments
    .filter((p) => p.status === "SUCCESS" && p.paidAt.toISOString().slice(0, 7) === monthPrefix)
    .reduce((acc, p) => acc + p.amount, 0);

  return NextResponse.json({
    summary: {
      totalAssigned,
      totalCollected,
      pendingFees,
      overdueFees,
      todaysCollection,
      monthlyCollection,
    },
    feeAssignments,
    payments,
    receipts,
    refunds,
    feeStructures,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Record Verified Offline Payment (Cash, Bank Transfer, Manual UPI, Cheque)
    if (action === "RECORD_OFFLINE_PAYMENT") {
      const {
        feeAssignmentId,
        installmentId,
        amount,
        paymentMethod = "OFFLINE_CASH",
        transactionRef,
        feeCategory = "TUITION",
        notes,
      } = body;

      const payAmount = Number(amount);
      if (!feeAssignmentId || !payAmount || payAmount <= 0) {
        return NextResponse.json(
          { error: "Valid fee assignment and positive payment amount are required." },
          { status: 400 }
        );
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
        return NextResponse.json({ error: "Fee ledger not found." }, { status: 404 });
      }

      const ref =
        transactionRef?.trim() ||
        `OFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // Duplicate check
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionRef: ref },
      });
      if (existingPayment) {
        return NextResponse.json(
          { error: `Duplicate transaction reference (${ref}) detected.` },
          { status: 409 }
        );
      }

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
          isOnline: false,
          transactionRef: ref,
          status: "SUCCESS",
          verifiedBy: user.name,
          verifiedAt: new Date(),
          notes: notes || `Verified offline ${paymentMethod} payment recorded by ${user.name}`,
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

      // Update installment(s)
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
        // Auto-allocate to earliest unpaid installment
        let remainingToAllocate = payAmount;
        for (const inst of assignment.installments) {
          if (inst.status === "PAID" || remainingToAllocate <= 0) continue;
          const needed = Math.max(0, inst.amount - inst.paidAmount);
          const applied = Math.min(needed, remainingToAllocate);
          if (applied > 0) {
            const updatedInstPaid = inst.paidAmount + applied;
            remainingToAllocate -= applied;
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
          transactionRef: ref,
          balanceRemaining: newBalanceAmount,
          issuedBy: user.name,
        },
      });

      await prisma.notification.create({
        data: {
          userId: assignment.student.userId,
          roleTarget: "STUDENT",
          title: `Fee Receipt Generated (${receiptNumber})`,
          message: `We have received ₹${payAmount.toLocaleString("en-IN")} via ${paymentMethod}. Remaining Balance: ₹${newBalanceAmount.toLocaleString("en-IN")}.`,
          category: "FEE",
          channel: "IN_APP",
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "OFFLINE_PAYMENT_VERIFIED",
        entityType: "PAYMENT",
        entityId: payment.id,
        details: `Verified offline payment of ₹${payAmount} (${paymentMethod}) for ${assignment.student.studentCode}. Receipt: ${receiptNumber}`,
      });

      return NextResponse.json({
        success: true,
        payment,
        receipt,
        message: `Offline payment of ₹${payAmount.toLocaleString("en-IN")} verified. Receipt ${receiptNumber} generated!`,
      });
    }

    // 2. Apply Scholarship / Concession or Late Fee Adjustment
    if (action === "ADJUST_CONCESSION_OR_LATE_FEE") {
      const {
        feeAssignmentId,
        discountAmount = 0,
        discountReason = "Special Scholarship Concession",
        lateFeeAmount = 0,
      } = body;

      const assignment = await prisma.studentFeeAssignment.findUnique({
        where: { id: feeAssignmentId },
        include: { student: true },
      });
      if (!assignment) {
        return NextResponse.json({ error: "Fee ledger not found." }, { status: 404 });
      }

      const totalDiscount = assignment.discountAmount + Number(discountAmount);
      const totalLateFee = assignment.lateFeeAmount + Number(lateFeeAmount);
      const gross =
        assignment.baseTuitionFee +
        assignment.registrationFee +
        assignment.admissionFee +
        assignment.studyMaterialFee +
        assignment.examFee;
      const taxable = Math.max(0, gross - totalDiscount);
      const taxAmount = Math.round(taxable * (assignment.gstPercent / 100));
      const netPayable = taxable + taxAmount + totalLateFee;
      const balanceAmount = Math.max(0, netPayable - assignment.paidAmount);

      const updated = await prisma.studentFeeAssignment.update({
        where: { id: assignment.id },
        data: {
          discountAmount: totalDiscount,
          discountReason,
          lateFeeAmount: totalLateFee,
          taxAmount,
          netPayable,
          balanceAmount,
          status: balanceAmount === 0 ? "PAID" : "PARTIAL",
        },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "FEE_LEDGER_ADJUSTED",
        entityType: "FEE_ASSIGNMENT",
        entityId: updated.id,
        details: `Adjusted fee ledger for ${assignment.student.studentCode}: Discount +₹${discountAmount}, Late Fee +₹${lateFeeAmount}. New Net Payable: ₹${netPayable}`,
      });

      return NextResponse.json({
        success: true,
        feeAssignment: updated,
        message: "Student fee concession / late fee updated and audited.",
      });
    }

    // 3. Process Refund / Reversal
    if (action === "PROCESS_REFUND") {
      const { paymentId, amount, reason, mode = "BANK_TRANSFER" } = body;
      const refundAmount = Number(amount);
      if (!paymentId || !refundAmount || refundAmount <= 0 || !reason) {
        return NextResponse.json(
          { error: "Payment ID, positive refund amount, and reason are required." },
          { status: 400 }
        );
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { feeAssignment: true, student: true },
      });
      if (!payment) {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }

      const refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: refundAmount,
          reason,
          mode,
          referenceNo: `RFN-${Date.now()}`,
          status: "PROCESSED",
          processedBy: user.name,
        },
      });

      const newPaid = Math.max(0, payment.feeAssignment.paidAmount - refundAmount);
      const newRefunded = payment.feeAssignment.refundedAmount + refundAmount;
      const newBalance = Math.max(0, payment.feeAssignment.netPayable - newPaid);

      await prisma.studentFeeAssignment.update({
        where: { id: payment.feeAssignmentId },
        data: {
          paidAmount: newPaid,
          refundedAmount: newRefunded,
          balanceAmount: newBalance,
          status: newBalance > 0 ? "PARTIAL" : "PAID",
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      await logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "PAYMENT_REFUND_PROCESSED",
        entityType: "REFUND",
        entityId: refund.id,
        details: `Processed refund of ₹${refundAmount} for payment ${payment.transactionRef} (${payment.student.studentCode}). Reason: ${reason}`,
      });

      return NextResponse.json({
        success: true,
        refund,
        message: `Refund of ₹${refundAmount.toLocaleString("en-IN")} processed and ledger updated.`,
      });
    }

    // 4. Send Fee Due Reminder Notification
    if (action === "SEND_FEE_REMINDER") {
      const { studentId, channel = "IN_APP_AND_WHATSAPP" } = body;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { feeAssignments: true },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }
      const balance = student.feeAssignments[0]?.balanceAmount || 0;

      await prisma.notification.create({
        data: {
          userId: student.userId,
          roleTarget: "STUDENT",
          title: "Fee Installment Due Reminder",
          message: `Dear ${student.fullName} (${student.studentCode}), your outstanding fee balance is ₹${balance.toLocaleString("en-IN")}. Please clear your installment via the Student Fee Portal.`,
          category: "FEE",
          channel,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Fee reminder dispatched to ${student.fullName} (${student.phone}).`,
      });
    }

    return NextResponse.json({ error: "Invalid fee action." }, { status: 400 });
  } catch (err: any) {
    console.error("Fee management POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process fee operation." },
      { status: 500 }
    );
  }
}

