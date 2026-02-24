import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { verifyLoopsWebhook, verifyResendWebhook } from "../utils/webhook-verify";
import { env } from "../config/env";

export async function handleLoops(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;

  // Verify signature if secret is configured
  if (env.LOOPS_WEBHOOK_SECRET) {
    const isValid = verifyLoopsWebhook(rawBody, req.headers as Record<string, string>);
    if (!isValid) {
      logger.warn("Invalid Loops webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const eventType = payload.type;
  if (!eventType) {
    res.status(200).json({ received: true });
    return;
  }

  // Extract email from webhook payload
  const email = payload.data?.contactIdentity?.email;
  if (!email) {
    logger.warn({ type: eventType }, "Loops webhook missing contact email");
    res.status(200).json({ received: true });
    return;
  }

  // Look up attendee
  const { data: attendee } = await supabase
    .from("attendees")
    .select("id")
    .eq("email", email)
    .limit(1)
    .single();

  // Map Loops event types to our format
  const typeMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.unsubscribed": "unsubscribed",
  };

  const normalizedType = typeMap[eventType] || eventType;

  // Extract email step info
  const emailStep = payload.data?.sourceType || null;

  await supabase.from("email_events").insert({
    attendee_id: attendee?.id || null,
    event_type: normalizedType,
    email_step: emailStep,
    source: "loops",
    metadata: {
      original_type: eventType,
      email_subject: payload.data?.email?.subject,
      webhook_id: payload.id,
    },
  });

  logger.info(
    { type: normalizedType, email, attendeeId: attendee?.id },
    "Loops webhook processed"
  );

  res.status(200).json({ received: true });
}

export async function handleResend(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;

  // Verify signature if secret is configured
  if (env.RESEND_WEBHOOK_SECRET) {
    try {
      verifyResendWebhook(rawBody, req.headers as Record<string, string>);
    } catch (err) {
      logger.warn({ err }, "Invalid Resend webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const eventType = payload.type;
  if (!eventType) {
    res.status(200).json({ received: true });
    return;
  }

  // Extract recipient email
  const toEmails: string[] = payload.data?.to || [];
  const email = toEmails[0];

  // Look up attendee
  let attendeeId: string | null = null;
  if (email) {
    const { data: attendee } = await supabase
      .from("attendees")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();

    attendeeId = attendee?.id || null;
  }

  // Map Resend event types
  const typeMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.delivery_delayed": "delayed",
  };

  const normalizedType = typeMap[eventType] || eventType;

  await supabase.from("email_events").insert({
    attendee_id: attendeeId,
    event_type: normalizedType,
    email_step: "confirmation",
    source: "resend",
    metadata: {
      original_type: eventType,
      email_id: payload.data?.email_id,
      subject: payload.data?.subject,
    },
  });

  logger.info(
    { type: normalizedType, email, attendeeId },
    "Resend webhook processed"
  );

  res.status(200).json({ received: true });
}
