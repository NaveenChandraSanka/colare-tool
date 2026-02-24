import { env } from "../config/env";
import { withRetry } from "../utils/retry";
import { logger } from "../utils/logger";
import type { PersonalizedFields } from "../types/api";

const LOOPS_BASE_URL = "https://app.loops.so/api";

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.LOOPS_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function loopsFetch(
  path: string,
  options: { method: string; body?: string }
): Promise<any> {
  const url = `${LOOPS_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(),
    redirect: "error",
  });

  if (response.status === 429) {
    throw new Error("Loops rate limit exceeded");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Loops API returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Loops API error: ${response.status}`);
  }

  return data;
}

interface AttendeeContactData {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  interests: string[];
  segment?: string;
  event_name?: string;
  event_slug?: string;
}

export async function createOrUpdateContact(
  attendeeData: AttendeeContactData,
  personalizedFields: PersonalizedFields
): Promise<void> {
  const [firstName, ...lastParts] = attendeeData.name.split(" ");
  const lastName = lastParts.join(" ");

  const payload: Record<string, unknown> = {
    email: attendeeData.email,
    firstName,
    lastName: lastName || undefined,
    source: "event_registration",
    userGroup: attendeeData.segment || undefined,
    company: attendeeData.company || undefined,
    role: attendeeData.role || undefined,
    interests: attendeeData.interests.join(", "),
    personalizedIntro: personalizedFields.personalized_intro,
    personalizedCta: personalizedFields.personalized_cta,
    personalizedSubject: personalizedFields.personalized_subject_line,
    eventName: attendeeData.event_name || undefined,
    eventSlug: attendeeData.event_slug || undefined,
  };

  // Remove undefined values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  await withRetry(
    () =>
      loopsFetch("/v1/contacts/update", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );

  logger.info({ email: attendeeData.email }, "Contact synced to Loops");
}

export async function fireEvent(
  email: string,
  eventName: string,
  eventProperties?: Record<string, string | number | boolean>
): Promise<void> {
  await withRetry(
    () =>
      loopsFetch("/v1/events/send", {
        method: "POST",
        body: JSON.stringify({ email, eventName, eventProperties }),
      }),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );

  logger.info({ email, eventName }, "Event fired in Loops");
}

export async function deleteContact(email: string): Promise<void> {
  await withRetry(
    () =>
      loopsFetch("/v1/contacts/delete", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );

  logger.info({ email }, "Contact deleted from Loops");
}
