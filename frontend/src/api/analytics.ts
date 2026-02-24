import { apiFetch } from './client';
import type { EventAnalytics } from '@/types';

export const fetchAnalytics = (eventId: string) =>
  apiFetch<EventAnalytics>(`/api/events/${eventId}/analytics`);
