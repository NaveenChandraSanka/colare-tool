export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  company_name: string;
  loops_event_name: string;
  interest_options: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface EventWithCount extends Event {
  attendee_count: number;
}

export interface PublicEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  company_name: string;
  status: string;
  interest_options: string[];
}

export interface Attendee {
  id: string;
  event_id: string;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  interests: string[];
  segment: string | null;
  personalized_intro: string | null;
  personalized_cta: string | null;
  personalized_subject: string | null;
  loops_contact_synced: boolean;
  loops_event_fired: boolean;
  registered_at: string;
}

export interface AttendeeWithEngagement extends Attendee {
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
}

export interface EventAnalytics {
  total_registered: number;
  loops_synced: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  open_rate: number;
  click_rate: number;
  top_performing_segment: string | null;
  emails_by_step: Record<string, number>;
  registrations_by_segment: Record<string, number>;
}

export interface PersonalizedPreview {
  attendee: {
    name: string;
    email: string;
    company: string | null;
    role: string | null;
    interests: string[];
    segment: string | null;
  };
  preview: {
    personalized_intro: string;
    personalized_cta: string;
    personalized_subject_line: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email: string };
}

export interface CreateEventInput {
  name: string;
  description?: string;
  date: string;
  company_name: string;
  loops_event_name: string;
  interest_options?: string[];
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  date?: string;
  company_name?: string;
  loops_event_name?: string;
  interest_options?: string[];
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface RegistrationInput {
  name: string;
  email: string;
  company?: string;
  role?: string;
  interests: string[];
}

export interface ResyncResult {
  total: number;
  synced: number;
  failed: number;
}

export interface EmailSeriesStep {
  id: string;
  attendee_id: string;
  event_id: string;
  step: number;
  subject: string;
  body: string;
  cta: string;
  send_day: number;
  status: 'draft' | 'queued' | 'sent';
  created_at: string;
}

export interface AttendeeEmailSeries {
  attendee_id: string;
  attendee: {
    name: string;
    email: string;
    company: string | null;
    role: string | null;
    interests: string[];
    segment: string | null;
  };
  emails: EmailSeriesStep[];
}

export interface GenerateSeriesResult {
  total: number;
  generated: number;
  failed: number;
}
