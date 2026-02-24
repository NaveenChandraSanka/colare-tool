import crypto from "node:crypto";
import { Webhook } from "svix";
import { env } from "../config/env";

export function verifyResendWebhook(
  rawBody: Buffer,
  headers: Record<string, string>
): any {
  if (!env.RESEND_WEBHOOK_SECRET) {
    throw new Error("RESEND_WEBHOOK_SECRET not configured");
  }

  const wh = new Webhook(env.RESEND_WEBHOOK_SECRET);
  return wh.verify(rawBody.toString(), {
    "svix-id": headers["svix-id"],
    "svix-timestamp": headers["svix-timestamp"],
    "svix-signature": headers["svix-signature"],
  });
}

export function verifyLoopsWebhook(
  rawBody: Buffer,
  headers: Record<string, string>
): boolean {
  if (!env.LOOPS_WEBHOOK_SECRET) {
    throw new Error("LOOPS_WEBHOOK_SECRET not configured");
  }

  const msgId = headers["webhook-id"];
  const timestamp = headers["webhook-timestamp"];
  const signature = headers["webhook-signature"];

  if (!msgId || !timestamp || !signature) {
    return false;
  }

  const signedContent = `${msgId}.${timestamp}.${rawBody.toString()}`;

  const secret = env.LOOPS_WEBHOOK_SECRET.startsWith("whsec_")
    ? env.LOOPS_WEBHOOK_SECRET.slice(6)
    : env.LOOPS_WEBHOOK_SECRET;

  const secretBytes = Buffer.from(secret, "base64");
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const providedSigs = signature
    .split(" ")
    .map((s) => s.replace("v1,", ""));

  return providedSigs.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSig)
      );
    } catch {
      return false;
    }
  });
}
