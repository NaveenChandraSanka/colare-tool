import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string().datetime(),
  company_name: z.string().min(1),
  loops_event_name: z.string().min(1).max(100),
  interest_options: z.array(z.string().max(100)).max(20).default([]),
  status: z
    .enum(["draft", "active", "completed", "archived"])
    .default("draft"),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
