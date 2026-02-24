import { apiFetch } from './client';
import type { PublicEvent, RegistrationInput } from '@/types';

export const fetchPublicEvent = (slug: string) =>
  apiFetch<PublicEvent>(`/api/events/${slug}/public`, {
    requireAuth: false,
  });

export const registerForEvent = (
  slug: string,
  input: RegistrationInput,
) =>
  apiFetch<{ success: boolean; attendeeId: string; message: string }>(
    `/api/events/${slug}/register`,
    { method: 'POST', body: input, requireAuth: false },
  );
