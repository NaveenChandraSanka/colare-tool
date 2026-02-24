import { z } from "zod";

export const loopsWebhookSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.string(),
  version: z.string().optional(),
  data: z.object({
    sourceType: z.string().optional(),
    contactIdentity: z
      .object({
        contactId: z.string().optional(),
        email: z.string().optional(),
        userId: z.string().optional(),
      })
      .optional(),
    email: z
      .object({
        id: z.string().optional(),
        subject: z.string().optional(),
      })
      .optional(),
  }),
});

export const resendWebhookSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    from: z.string().optional(),
    to: z.array(z.string()).optional(),
    subject: z.string().optional(),
  }),
});

export type LoopsWebhookPayload = z.infer<typeof loopsWebhookSchema>;
export type ResendWebhookPayload = z.infer<typeof resendWebhookSchema>;
