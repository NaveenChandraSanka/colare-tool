import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  interests: z.array(z.string().max(100)).max(10).default([]),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
