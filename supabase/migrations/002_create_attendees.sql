CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  interests TEXT[] DEFAULT '{}',
  segment TEXT,
  personalized_intro TEXT,
  personalized_cta TEXT,
  personalized_subject TEXT,
  loops_contact_synced BOOLEAN NOT NULL DEFAULT false,
  loops_event_fired BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(event_id, email)
);

CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_email ON attendees(email);
