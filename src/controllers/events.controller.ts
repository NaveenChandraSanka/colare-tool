import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { generateSlug } from "../utils/slug";
import * as geminiService from "../services/gemini";
import * as loopsService from "../services/loops";
import type { CreateEventInput, UpdateEventInput } from "../schemas/event.schema";
import type { EmailSeriesStep } from "../types/api";

export async function list(_req: Request, res: Response): Promise<void> {
  const { data: events, error } = await supabase
    .from("events")
    .select("*, attendees(count)")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error({ err: error }, "Failed to list events");
    res.status(500).json({ error: "Failed to list events" });
    return;
  }

  const result = events.map((e: any) => ({
    ...e,
    attendee_count: e.attendees?.[0]?.count ?? 0,
    attendees: undefined,
  }));

  res.json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: event, error } = await supabase
    .from("events")
    .select("*, attendees(count)")
    .eq("id", id)
    .single();

  if (error || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json({
    ...event,
    attendee_count: (event as any).attendees?.[0]?.count ?? 0,
    attendees: undefined,
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateEventInput;
  const slug = generateSlug(input.name);

  const { data: event, error } = await supabase
    .from("events")
    .insert({ ...input, slug })
    .select()
    .single();

  if (error) {
    logger.error({ err: error }, "Failed to create event");
    res.status(500).json({ error: "Failed to create event" });
    return;
  }

  res.status(201).json(event);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const input = req.body as UpdateEventInput;

  const { data: event, error } = await supabase
    .from("events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(event);
}

export async function getAttendees(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: attendees, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("event_id", id)
    .order("registered_at", { ascending: false });

  if (error) {
    logger.error({ err: error }, "Failed to get attendees");
    res.status(500).json({ error: "Failed to get attendees" });
    return;
  }

  // Get engagement data for each attendee
  const attendeeIds = attendees.map((a: any) => a.id);

  const { data: emailEvents } = await supabase
    .from("email_events")
    .select("attendee_id, event_type")
    .in("attendee_id", attendeeIds);

  const engagementMap = new Map<string, { delivered: number; opened: number; clicked: number }>();
  for (const ee of emailEvents || []) {
    const current = engagementMap.get(ee.attendee_id) || { delivered: 0, opened: 0, clicked: 0 };
    if (ee.event_type === "delivered") current.delivered++;
    if (ee.event_type === "opened") current.opened++;
    if (ee.event_type === "clicked") current.clicked++;
    engagementMap.set(ee.attendee_id, current);
  }

  const result = attendees.map((a: any) => {
    const engagement = engagementMap.get(a.id) || { delivered: 0, opened: 0, clicked: 0 };
    return {
      ...a,
      emails_delivered: engagement.delivered,
      emails_opened: engagement.opened,
      emails_clicked: engagement.clicked,
    };
  });

  res.json(result);
}

export async function previewSequence(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { attendee_id } = req.body;

  if (!attendee_id) {
    res.status(400).json({ error: "attendee_id is required" });
    return;
  }

  const { data: attendee, error: attendeeError } = await supabase
    .from("attendees")
    .select("*")
    .eq("id", attendee_id)
    .eq("event_id", id)
    .single();

  if (attendeeError || !attendee) {
    res.status(404).json({ error: "Attendee not found" });
    return;
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const personalized = await geminiService.generatePersonalizedEmail(
    {
      name: attendee.name,
      email: attendee.email,
      company: attendee.company,
      role: attendee.role,
      interests: attendee.interests || [],
    },
    {
      name: event.name,
      description: event.description,
      date: event.date,
      company_name: event.company_name,
    },
    { skipCache: true }
  );

  res.json({
    attendee: {
      name: attendee.name,
      email: attendee.email,
      company: attendee.company,
      role: attendee.role,
      interests: attendee.interests,
      segment: attendee.segment,
    },
    preview: personalized,
  });
}

export async function resyncAttendees(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const { data: attendees, error: attendeesError } = await supabase
    .from("attendees")
    .select("*")
    .eq("event_id", id);

  if (attendeesError) {
    res.status(500).json({ error: "Failed to fetch attendees" });
    return;
  }

  let synced = 0;
  let failed = 0;

  for (const attendee of attendees || []) {
    try {
      const personalized = {
        personalized_intro: attendee.personalized_intro || geminiService.DEFAULT_PERSONALIZATION.personalized_intro,
        personalized_cta: attendee.personalized_cta || geminiService.DEFAULT_PERSONALIZATION.personalized_cta,
        personalized_subject_line: attendee.personalized_subject || geminiService.DEFAULT_PERSONALIZATION.personalized_subject_line,
      };

      await loopsService.createOrUpdateContact(
        {
          name: attendee.name,
          email: attendee.email,
          company: attendee.company,
          role: attendee.role,
          interests: attendee.interests || [],
          segment: attendee.segment || undefined,
          event_name: event.name,
          event_slug: event.slug,
        },
        personalized
      );

      await supabase
        .from("attendees")
        .update({ loops_contact_synced: true })
        .eq("id", attendee.id);

      synced++;

      // 100ms spacing to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      logger.error({ err, attendeeId: attendee.id }, "Resync failed for attendee");
      failed++;
    }
  }

  res.json({
    total: attendees?.length ?? 0,
    synced,
    failed,
  });
}

export async function generateSeriesForAttendee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { attendee_id } = req.body;

  try {
    if (!attendee_id) {
      res.status(400).json({ error: "attendee_id is required" });
      return;
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select("*")
      .eq("id", attendee_id)
      .eq("event_id", id)
      .single();

    if (attendeeError || !attendee) {
      res.status(404).json({ error: "Attendee not found" });
      return;
    }

    // Clear existing series for this attendee
    await supabase
      .from("email_series")
      .delete()
      .eq("attendee_id", attendee_id);

    const series = await geminiService.generateEmailSeries(
      {
        name: attendee.name,
        email: attendee.email,
        company: attendee.company,
        role: attendee.role,
        interests: attendee.interests || [],
      },
      {
        name: event.name,
        description: event.description,
        date: event.date,
        company_name: event.company_name,
      }
    );

    const rows = series.map((step) => ({
      attendee_id: attendee.id,
      event_id: id,
      step: step.step,
      subject: step.subject,
      body: step.body,
      cta: step.cta,
      send_day: step.send_day,
      status: "draft",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("email_series")
      .insert(rows)
      .select();

    if (insertError) {
      logger.error({ err: insertError }, "Failed to insert email series");
      res.status(500).json({ error: "Failed to save email series", message: insertError.message });
      return;
    }

    res.json(inserted);
  } catch (err) {
    logger.error({ err }, "Failed to generate series for attendee");
    res.status(500).json({ error: "Failed to generate email series", message: (err as Error).message });
  }
}

export async function getSeries(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data: series, error } = await supabase
    .from("email_series")
    .select("*, attendees(name, email, company, role, interests, segment)")
    .eq("event_id", id)
    .order("step", { ascending: true });

  if (error) {
    logger.error({ err: error }, "Failed to fetch email series");
    res.status(500).json({ error: "Failed to fetch email series" });
    return;
  }

  // Group by attendee
  const grouped: Record<string, { attendee: any; emails: any[] }> = {};
  for (const row of series || []) {
    const attendeeId = row.attendee_id;
    if (!grouped[attendeeId]) {
      grouped[attendeeId] = {
        attendee: (row as any).attendees,
        emails: [],
      };
    }
    const { attendees: _, ...emailData } = row as any;
    grouped[attendeeId].emails.push(emailData);
  }

  res.json(Object.entries(grouped).map(([attendeeId, data]) => ({
    attendee_id: attendeeId,
    ...data,
  })));
}

export async function getAttendeeSeries(req: Request, res: Response): Promise<void> {
  const { id, attendeeId } = req.params;

  const { data: series, error } = await supabase
    .from("email_series")
    .select("*")
    .eq("event_id", id)
    .eq("attendee_id", attendeeId)
    .order("step", { ascending: true });

  if (error) {
    logger.error({ err: error }, "Failed to fetch attendee series");
    res.status(500).json({ error: "Failed to fetch attendee series" });
    return;
  }

  res.json(series || []);
}
