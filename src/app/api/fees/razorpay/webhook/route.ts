import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { logAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.id || req.headers.get("x-razorpay-event-id");

    if (!eventId) {
      return NextResponse.json({ error: "Missing webhook event ID." }, { status: 400 });
    }

    // Idempotency check
    const alreadyProcessed = await prisma.payment.findUnique({
      where: { webhookEventId: eventId },
    });
    if (alreadyProcessed) {
      return NextResponse.json({ status: "already_processed", paymentId: alreadyProcessed.id });
    }

    if (event.event === "payment.captured") {
      const entity = event.payload?.payment?.entity;
      const razorpayPaymentId = entity?.id;
      if (razorpayPaymentId) {
        const existingPayment = await prisma.payment.findUnique({
          where: { razorpayPaymentId },
        });
        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: { webhookEventId: eventId, status: "SUCCESS" },
          });
        }
      }

      await logAudit({
        actorName: "Razorpay Webhook",
        actorRole: "SYSTEM",
        action: "WEBHOOK_PAYMENT_CAPTURED",
        entityType: "PAYMENT",
        entityId: eventId,
        details: `Processed idempotent webhook event ${eventId}`,
      });
    }

    return NextResponse.json({ status: "ok", eventId });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }
}

