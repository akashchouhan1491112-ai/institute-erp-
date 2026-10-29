import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_vidyavikas_demo_key";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_test_vidyavikas_secret_key_998877";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_vidyavikas_webhook_hmac_secret_2026";

export function getRazorpayPublicKey() {
  return RAZORPAY_KEY_ID;
}

/**
 * Generates a deterministic HMAC-SHA256 signature for Razorpay order + payment verification.
 * Used both by the server verification endpoint and our integrated Razorpay test checkout modal
 * when running in test/sandbox mode.
 */
export function computeRazorpayPaymentSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = computeRazorpayPaymentSignature(orderId, paymentId);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function computeWebhookSignature(rawBody: string): string {
  return crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = computeWebhookSignature(rawBody);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

