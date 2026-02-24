import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import type { EventAnalytics } from "../types/api";

export async function getEventAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  // Verify event exists
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  // Get attendees for this event
  const { data: attendees, error: attendeesError } = await supabase
    .from("attendees")
    .select("id, segment, loops_contact_synced")
    .eq("event_id", id);

  if (attendeesError) {
    logger.error({ err: attendeesError }, "Failed to fetch attendees for analytics");
    res.status(500).json({ error: "Failed to fetch analytics" });
    return;
  }

  const attendeeIds = (attendees || []).map((a) => a.id);
  const totalRegistered = attendeeIds.length;
  const loopsSynced = (attendees || []).filter((a) => a.loops_contact_synced).length;

  // Get email events for these attendees
  const { data: emailEvents } = await supabase
    .from("email_events")
    .select("attendee_id, event_type, email_step")
    .in("attendee_id", attendeeIds.length > 0 ? attendeeIds : ["none"]);

  // Count unique attendees per event type
  const deliveredSet = new Set<string>();
  const openedSet = new Set<string>();
  const clickedSet = new Set<string>();
  const bouncedSet = new Set<string>();
  const emailsByStep: Record<string, number> = {};

  for (const ee of emailEvents || []) {
    if (ee.attendee_id) {
      if (ee.event_type === "delivered") deliveredSet.add(ee.attendee_id);
      if (ee.event_type === "opened") openedSet.add(ee.attendee_id);
      if (ee.event_type === "clicked") clickedSet.add(ee.attendee_id);
      if (ee.event_type === "bounced") bouncedSet.add(ee.attendee_id);
    }
    if (ee.email_step) {
      emailsByStep[ee.email_step] = (emailsByStep[ee.email_step] || 0) + 1;
    }
  }

  // Registrations by segment
  const registrationsBySegment: Record<string, number> = {};
  for (const a of attendees || []) {
    const seg = a.segment || "unknown";
    registrationsBySegment[seg] = (registrationsBySegment[seg] || 0) + 1;
  }

  // Find top performing segment (highest open rate)
  let topSegment: string | null = null;
  let topOpenRate = 0;

  const segmentAttendees = new Map<string, string[]>();
  for (const a of attendees || []) {
    const seg = a.segment || "unknown";
    const list = segmentAttendees.get(seg) || [];
    list.push(a.id);
    segmentAttendees.set(seg, list);
  }

  for (const [segment, ids] of segmentAttendees) {
    const segOpened = ids.filter((id) => openedSet.has(id)).length;
    const rate = ids.length > 0 ? segOpened / ids.length : 0;
    if (rate > topOpenRate) {
      topOpenRate = rate;
      topSegment = segment;
    }
  }

  const analytics: EventAnalytics = {
    total_registered: totalRegistered,
    loops_synced: loopsSynced,
    emails_delivered: deliveredSet.size,
    emails_opened: openedSet.size,
    emails_clicked: clickedSet.size,
    emails_bounced: bouncedSet.size,
    open_rate:
      deliveredSet.size > 0
        ? Math.round((openedSet.size / deliveredSet.size) * 10000) / 100
        : 0,
    click_rate:
      deliveredSet.size > 0
        ? Math.round((clickedSet.size / deliveredSet.size) * 10000) / 100
        : 0,
    top_performing_segment: topSegment,
    emails_by_step: emailsByStep,
    registrations_by_segment: registrationsBySegment,
  };

  res.json(analytics);
}
