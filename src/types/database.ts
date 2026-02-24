export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  company_name: string;
  loops_event_name: string;
  interest_options: string[];
  status: "draft" | "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
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

export interface EmailEvent {
  id: string;
  attendee_id: string | null;
  event_type: string;
  email_step: string | null;
  source: "loops" | "resend";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FailedSync {
  id: string;
  attendee_id: string;
  operation: string;
  payload: Record<string, unknown>;
  error: string;
  retry_count: number;
  next_retry_at: string | null;
  resolved_at: string | null;
  created_at: string;
}
