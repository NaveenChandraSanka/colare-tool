import { apiFetch } from './client';
import type {
  EventWithCount,
  Event,
  AttendeeWithEngagement,
  CreateEventInput,
  UpdateEventInput,
  PersonalizedPreview,
  ResyncResult,
  AttendeeEmailSeries,
  EmailSeriesStep,
} from '@/types';

export const fetchEvents = () =>
  apiFetch<EventWithCount[]>('/api/events');

export const fetchEvent = (id: string) =>
  apiFetch<EventWithCount>(`/api/events/${id}`);

export const createEvent = (input: CreateEventInput) =>
  apiFetch<Event>('/api/events', { method: 'POST', body: input });

export const updateEvent = (id: string, input: UpdateEventInput) =>
  apiFetch<Event>(`/api/events/${id}`, { method: 'PUT', body: input });

export const fetchAttendees = (eventId: string) =>
  apiFetch<AttendeeWithEngagement[]>(`/api/events/${eventId}/attendees`);

export const previewSequence = (eventId: string, attendeeId: string) =>
  apiFetch<PersonalizedPreview>(
    `/api/events/${eventId}/sequences/preview`,
    { method: 'POST', body: { attendee_id: attendeeId } },
  );

export const resyncAttendees = (eventId: string) =>
  apiFetch<ResyncResult>(`/api/events/${eventId}/resync`, {
    method: 'POST',
  });

export const generateSeriesForAttendee = (eventId: string, attendeeId: string) =>
  apiFetch<EmailSeriesStep[]>(`/api/events/${eventId}/series/generate`, {
    method: 'POST',
    body: { attendee_id: attendeeId },
  });

export const fetchSeries = (eventId: string) =>
  apiFetch<AttendeeEmailSeries[]>(`/api/events/${eventId}/series`);

export const fetchAttendeeSeries = (eventId: string, attendeeId: string) =>
  apiFetch<EmailSeriesStep[]>(`/api/events/${eventId}/series/${attendeeId}`);
