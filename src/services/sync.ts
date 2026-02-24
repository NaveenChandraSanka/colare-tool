import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import * as loopsService from "./loops";
import type { FailedSync } from "../types/database";

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 60_000; // 1 minute

export async function processFailedSyncs(): Promise<void> {
  const { data: pendingSyncs, error } = await supabase
    .from("failed_syncs")
    .select("*")
    .is("resolved_at", null)
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(10);

  if (error) {
    logger.error({ err: error }, "Failed to query pending syncs");
    return;
  }

  if (!pendingSyncs || pendingSyncs.length === 0) return;

  logger.info({ count: pendingSyncs.length }, "Processing failed syncs");

  for (const sync of pendingSyncs as FailedSync[]) {
    await retrySync(sync);
  }
}

async function retrySync(sync: FailedSync): Promise<void> {
  try {
    const payload = sync.payload as Record<string, any>;

    switch (sync.operation) {
      case "loops_contact_sync": {
        await loopsService.createOrUpdateContact(
          payload.attendeeData,
          payload.personalizedFields
        );
        break;
      }
      case "loops_event_fire": {
        await loopsService.fireEvent(
          payload.email,
          payload.eventName,
          payload.eventProperties
        );
        break;
      }
      default:
        logger.warn({ operation: sync.operation }, "Unknown sync operation");
        return;
    }

    // Mark as resolved
    await supabase
      .from("failed_syncs")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", sync.id);

    // Update attendee flags
    if (sync.operation === "loops_contact_sync") {
      await supabase
        .from("attendees")
        .update({ loops_contact_synced: true })
        .eq("id", sync.attendee_id);
    } else if (sync.operation === "loops_event_fire") {
      await supabase
        .from("attendees")
        .update({ loops_event_fired: true })
        .eq("id", sync.attendee_id);
    }

    logger.info({ syncId: sync.id, operation: sync.operation }, "Sync resolved");
  } catch (error) {
    const newRetryCount = sync.retry_count + 1;

    if (newRetryCount >= MAX_RETRIES) {
      logger.error(
        { syncId: sync.id, operation: sync.operation },
        "Max retries reached, giving up"
      );
      await supabase
        .from("failed_syncs")
        .update({
          retry_count: newRetryCount,
          error: String(error),
          resolved_at: new Date().toISOString(),
        })
        .eq("id", sync.id);
      return;
    }

    const nextDelay = BASE_DELAY_MS * Math.pow(2, newRetryCount);
    const nextRetryAt = new Date(Date.now() + nextDelay).toISOString();

    await supabase
      .from("failed_syncs")
      .update({
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt,
        error: String(error),
      })
      .eq("id", sync.id);

    logger.warn(
      { syncId: sync.id, retryCount: newRetryCount, nextRetryAt },
      "Sync retry scheduled"
    );
  }
}

let intervalId: NodeJS.Timeout | null = null;

export function startSyncProcessor(intervalMs = 60_000): void {
  if (intervalId) return;
  logger.info("Starting failed sync processor");
  intervalId = setInterval(processFailedSyncs, intervalMs);
}

export function stopSyncProcessor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Stopped failed sync processor");
  }
}
