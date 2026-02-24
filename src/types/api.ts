export interface PersonalizedFields {
  personalized_intro: string;
  personalized_cta: string;
  personalized_subject_line: string;
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

export interface AttendeeWithEngagement {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  interests: string[];
  segment: string | null;
  loops_contact_synced: boolean;
  loops_event_fired: boolean;
  registered_at: string;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
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
  status: "draft" | "queued" | "sent";
  created_at: string;
}
