import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import type { PersonalizedFields, EmailSeriesStep } from "../types/api";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

interface AttendeeData {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  interests: string[];
}

interface EventData {
  name: string;
  description?: string | null;
  date: string;
  company_name: string;
}

const COLARE_CONTEXT = `About Colare (the company hosting this event):
Colare is the first platform built to assess real-world skills in hardtech. We use AI-powered, simulation-based assessments — like CAD modeling challenges, printed circuit board design tasks, and real-world engineering problem-solving scenarios — to help engineering teams hire faster and smarter with zero engineering overhead.

Instead of resumes and generic coding tests, Colare lets employers see exactly how candidates think, build, and solve before they're hired. Our AI evaluates how candidates interpret problems and execute solutions, measuring the exact skills engineers use on the job.

Key value props to weave into emails naturally:
- Simulation-based assessments that mirror real engineering work
- Cuts technical mis-hires by evaluating actual hands-on skills
- Saves engineering teams hours of manual candidate evaluation
- Handles everything from scenario design to candidate ranking
- Built for hardware, manufacturing, aerospace, and other hardtech industries

Target audience: engineering hiring managers, heads of talent, VPs of Engineering, CTOs at hardware/manufacturing/aerospace/robotics companies.`;

const DEFAULT_PERSONALIZATION: PersonalizedFields = {
  personalized_intro:
    "Thank you for attending our event! We loved having you there.",
  personalized_cta:
    "We'd love to continue the conversation — reply to this email and let us know how we can help.",
  personalized_subject_line: "Great connecting with you at the event!",
};

const responseSchema = {
  type: "OBJECT" as const,
  properties: {
    personalized_intro: {
      type: "STRING" as const,
      description: "A warm 1-2 sentence opener referencing their role or company",
    },
    personalized_cta: {
      type: "STRING" as const,
      description: "A specific call-to-action tailored to their interest segment",
    },
    personalized_subject_line: {
      type: "STRING" as const,
      description: "A short, curiosity-driven subject line under 60 chars",
    },
  },
  required: [
    "personalized_intro",
    "personalized_cta",
    "personalized_subject_line",
  ],
};

const seriesResponseSchema = {
  type: "ARRAY" as const,
  items: {
    type: "OBJECT" as const,
    properties: {
      step: { type: "INTEGER" as const, description: "Step number: 1, 2, or 3" },
      send_day: { type: "INTEGER" as const, description: "Day offset: 0, 3, or 7" },
      subject: { type: "STRING" as const, description: "Email subject line under 60 chars" },
      body: { type: "STRING" as const, description: "Email body, 2-3 short paragraphs" },
      cta: { type: "STRING" as const, description: "Closing call-to-action line" },
    },
    required: ["step", "send_day", "subject", "body", "cta"],
  },
};

export async function generatePersonalizedEmail(
  attendee: AttendeeData,
  event: EventData,
  options?: { skipCache?: boolean }
): Promise<PersonalizedFields> {
  try {
    // Check for cached personalization in Supabase
    if (!options?.skipCache) {
      const { data: existing } = await supabase
        .from("attendees")
        .select("personalized_intro, personalized_cta, personalized_subject")
        .eq("email", attendee.email)
        .not("personalized_intro", "is", null)
        .limit(1)
        .single();

      if (existing?.personalized_intro) {
        logger.info({ email: attendee.email }, "Using cached Gemini personalization");
        return {
          personalized_intro: existing.personalized_intro,
          personalized_cta: existing.personalized_cta,
          personalized_subject_line: existing.personalized_subject,
        };
      }
    }

    const prompt = `You are a friendly sales development rep at Colare writing follow-up emails after a ${event.name} hosted by ${event.company_name}.

${COLARE_CONTEXT}

Attendee info:
- Name: ${attendee.name}
- Company: ${attendee.company || "Unknown"}
- Role: ${attendee.role || "Unknown"}
- Interests: ${attendee.interests.join(", ") || "General"}
- Event: ${event.name} on ${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Generate the following as a JSON object:
{
  "personalized_intro": "A warm 1-2 sentence opener that references something specific about their role or company and connects it to Colare's platform. Do NOT be generic — mention how simulation-based assessments or hardtech hiring relates to their work.",
  "personalized_cta": "A specific, low-friction call to action tailored to their interest segment. For 'demo' → suggest a 15-min walkthrough of Colare's assessment platform. For 'partnership' → suggest a collab brainstorm on integrating assessments into their hiring. For 'learn-more' → offer a relevant case study or resource about simulation-based hiring.",
  "personalized_subject_line": "A short, curiosity-driven subject line that references the event and feels personal. No clickbait."
}

Return ONLY valid JSON, no markdown, no explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      logger.warn("Gemini returned empty response, using defaults");
      return DEFAULT_PERSONALIZATION;
    }

    const result: PersonalizedFields = JSON.parse(text);
    return result;
  } catch (error) {
    logger.warn({ err: error }, "Gemini personalization failed, using defaults");
    return DEFAULT_PERSONALIZATION;
  }
}

export async function generateEmailSeries(
  attendee: AttendeeData,
  event: EventData
): Promise<Omit<EmailSeriesStep, "id" | "attendee_id" | "event_id" | "status" | "created_at">[]> {
  try {
    const prompt = `You are a friendly sales development rep at Colare writing a 3-email drip sequence for an attendee after ${event.name}.

${COLARE_CONTEXT}

Attendee info:
- Name: ${attendee.name}
- Company: ${attendee.company || "Unknown"}
- Role: ${attendee.role || "Unknown"}
- Interests: ${attendee.interests.join(", ") || "General"}
- Event: ${event.name} on ${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
${event.description ? `- Event description: ${event.description}` : ""}

Generate a 3-email sequence as a JSON array. Each email should feel like a natural continuation, not repetitive. Reference Colare's actual product (simulation-based assessments for hardtech hiring) naturally — don't be salesy, be helpful and conversational.

Email 1 (step: 1, send_day: 0) — "Thank You & Recap"
- Warm thank-you for attending, brief event highlight
- Subtly mention one thing about Colare that relates to their role/company
- Keep it short (2 paragraphs max)

Email 2 (step: 2, send_day: 3) — "Value Follow-up"
- Reference their specific interests or role
- Share a concrete insight about how simulation-based assessments help teams like theirs
- Include a soft mention of a resource, case study, or relevant stat

Email 3 (step: 3, send_day: 7) — "Direct CTA"
- Acknowledge the conversation arc (they attended, you followed up)
- Make a direct but low-pressure ask based on their interest segment:
  - 'demo' interest → suggest a 15-min platform walkthrough
  - 'partnership' interest → propose a quick call to explore integration
  - 'learn-more' interest → offer to send a tailored case study or schedule an intro call
  - general → friendly open-ended "how can we help?"

For each email return: step (1/2/3), send_day (0/3/7), subject (under 60 chars), body (2-3 short paragraphs, conversational tone), cta (one closing call-to-action sentence).

Return ONLY a valid JSON array of 3 objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: seriesResponseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      logger.warn("Gemini returned empty series response");
      return getDefaultSeries(attendee.name, event.name);
    }

    const result = JSON.parse(text);
    return result;
  } catch (error) {
    logger.warn({ err: error }, "Gemini series generation failed, using defaults");
    return getDefaultSeries(attendee.name, event.name);
  }
}

function getDefaultSeries(
  attendeeName: string,
  eventName: string
): Omit<EmailSeriesStep, "id" | "attendee_id" | "event_id" | "status" | "created_at">[] {
  return [
    {
      step: 1,
      send_day: 0,
      subject: `Great meeting you at ${eventName}!`,
      body: `Hi ${attendeeName},\n\nThank you for attending ${eventName}! It was great connecting with so many people passionate about engineering talent.\n\nAt Colare, we're building the future of hardtech hiring with simulation-based assessments. We'd love to keep the conversation going.`,
      cta: "Reply to this email if you'd like to learn more — we'd love to hear from you.",
    },
    {
      step: 2,
      send_day: 3,
      subject: "How top engineering teams are rethinking hiring",
      body: `Hi ${attendeeName},\n\nFollowing up from ${eventName} — I wanted to share something we've been hearing from engineering leaders: traditional interviews miss the skills that actually matter on the job.\n\nThat's why we built Colare's simulation-based assessments. Instead of whiteboard puzzles, candidates solve real-world challenges — CAD modeling, PCB design, system-level engineering problems — so you see exactly how they think and build.`,
      cta: "Would it be helpful if I sent over a case study relevant to your team?",
    },
    {
      step: 3,
      send_day: 7,
      subject: "Quick question for you",
      body: `Hi ${attendeeName},\n\nI hope the week's been great since ${eventName}. I wanted to follow up one more time — is improving your engineering hiring process something your team is actively thinking about?\n\nIf so, I'd love to show you how Colare's platform works in a quick 15-minute walkthrough. No pressure at all — just a chance to see if it's a fit.`,
      cta: "Would any day next week work for a brief call? Happy to work around your schedule.",
    },
  ];
}

export { DEFAULT_PERSONALIZATION, COLARE_CONTEXT };
