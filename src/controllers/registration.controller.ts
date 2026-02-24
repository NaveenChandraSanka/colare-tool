import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import * as geminiService from "../services/gemini";
import * as loopsService from "../services/loops";
import * as resendService from "../services/resend";
import type { RegistrationInput } from "../schemas/registration.schema";
import type { Event } from "../types/database";
import type { PersonalizedFields } from "../types/api";

function deriveSegment(interests: string[]): string {
  if (interests.includes("demo")) return "demo";
  if (interests.includes("partnership")) return "partnership";
  if (interests.includes("learn-more")) return "learn-more";
  return interests[0] || "general";
}

export async function getPublicEvent(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, slug, description, date, company_name, status, interest_options")
    .eq("slug", slug)
    .single();

  if (error || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(event);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const input = req.body as RegistrationInput;

  // 1. Look up event by slug
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const typedEvent = event as Event;

  if (typedEvent.status !== "active") {
    res.status(400).json({ error: "Event is not currently accepting registrations" });
    return;
  }

  // 2. Derive segment and save attendee
  const segment = deriveSegment(input.interests);

  const { data: attendee, error: insertError } = await supabase
    .from("attendees")
    .insert({
      event_id: typedEvent.id,
      name: input.name,
      email: input.email,
      company: input.company || null,
      role: input.role || null,
      interests: input.interests,
      segment,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      res.status(409).json({ error: "You are already registered for this event" });
      return;
    }
    logger.error({ err: insertError }, "Failed to insert attendee");
    res.status(500).json({ error: "Failed to register" });
    return;
  }

  // 3. Generate AI personalization (non-critical)
  let personalized: PersonalizedFields = geminiService.DEFAULT_PERSONALIZATION;
  try {
    personalized = await geminiService.generatePersonalizedEmail(
      {
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        interests: input.interests,
      },
      {
        name: typedEvent.name,
        description: typedEvent.description,
        date: typedEvent.date,
        company_name: typedEvent.company_name,
      }
    );

    await supabase
      .from("attendees")
      .update({
        personalized_intro: personalized.personalized_intro,
        personalized_cta: personalized.personalized_cta,
        personalized_subject: personalized.personalized_subject_line,
      })
      .eq("id", attendee.id);
  } catch (err) {
    logger.warn(
      { err, attendeeId: attendee.id },
      "Gemini personalization failed, using defaults"
    );
  }

  // 4. Sync to Loops (non-critical — queue for retry on failure)
  try {
    await loopsService.createOrUpdateContact(
      {
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        interests: input.interests,
        segment,
        event_name: typedEvent.name,
        event_slug: typedEvent.slug,
      },
      personalized
    );

    await supabase
      .from("attendees")
      .update({ loops_contact_synced: true })
      .eq("id", attendee.id);
  } catch (err) {
    logger.error({ err, attendeeId: attendee.id }, "Loops contact sync failed");
    await recordFailedSync(attendee.id, "loops_contact_sync", {
      attendeeData: {
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        interests: input.interests,
        event_name: typedEvent.name,
        event_slug: typedEvent.slug,
      },
      personalizedFields: personalized,
    }, String(err));
  }

  // 5. Fire Loops event (non-critical)
  try {
    await loopsService.fireEvent(input.email, typedEvent.loops_event_name, {
      eventName: typedEvent.name,
      eventSlug: typedEvent.slug,
      segment,
    });

    await supabase
      .from("attendees")
      .update({ loops_event_fired: true })
      .eq("id", attendee.id);
  } catch (err) {
    logger.error({ err, attendeeId: attendee.id }, "Loops event fire failed");
    await recordFailedSync(attendee.id, "loops_event_fire", {
      email: input.email,
      eventName: typedEvent.loops_event_name,
      eventProperties: {
        eventName: typedEvent.name,
        eventSlug: typedEvent.slug,
        segment,
      },
    }, String(err));
  }

  // 6. Send confirmation email via Resend (non-critical)
  try {
    await resendService.sendConfirmation({
      attendeeName: input.name,
      attendeeEmail: input.email,
      eventName: typedEvent.name,
      eventDate: typedEvent.date,
      companyName: typedEvent.company_name,
      personalizedSubject: personalized.personalized_subject_line,
    });
  } catch (err) {
    logger.error({ err, attendeeId: attendee.id }, "Resend confirmation failed");
  }

  res.status(201).json({
    success: true,
    attendeeId: attendee.id,
    message: "Registration successful",
  });
}

async function recordFailedSync(
  attendeeId: string,
  operation: string,
  payload: Record<string, unknown>,
  error: string
): Promise<void> {
  try {
    await supabase.from("failed_syncs").insert({
      attendee_id: attendeeId,
      operation,
      payload,
      error,
      next_retry_at: new Date(Date.now() + 60_000).toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to record failed sync");
  }
}
