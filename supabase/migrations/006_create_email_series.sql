-- Create email_series table for storing AI-generated drip email sequences
CREATE TABLE email_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  cta TEXT NOT NULL,
  send_day INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attendee_id, step)
);

CREATE INDEX idx_email_series_event ON email_series(event_id);
CREATE INDEX idx_email_series_attendee ON email_series(attendee_id);
