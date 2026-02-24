# Colare — Post-Event Email Outbound Automation

A full-stack system that automates personalized post-event email outreach. When attendees register for an event, the system uses Google Gemini AI to generate personalized email content, syncs contacts to Loops.so for drip sequences, and sends immediate confirmations via Resend.

## Tech Stack

- **Backend:** Node.js + Express (TypeScript)
- **Database:** Supabase (Postgres)
- **Email Sequencing:** Loops.so API
- **Transactional Email:** Resend API
- **AI Personalization:** Google Gemini 2.0 Flash
- **Auth:** Supabase Auth (email/password)

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Loops.so](https://loops.so) account
- A [Resend](https://resend.com) account with a verified domain
- A [Google AI Studio](https://aistudio.google.com) API key

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (has full DB access) |
| `SUPABASE_ANON_KEY` | Anon/public key (used for auth) |
| `LOOPS_API_KEY` | API key from Loops.so Settings > API |
| `LOOPS_WEBHOOK_SECRET` | Webhook signing secret from Loops.so Settings > Webhooks |
| `RESEND_API_KEY` | API key from Resend dashboard |
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret from Resend dashboard |
| `RESEND_FROM_EMAIL` | Verified sender email (e.g., `events@yourdomain.com`) |
| `GEMINI_API_KEY` | API key from Google AI Studio |

### 3. Run database migrations

Go to your Supabase dashboard > SQL Editor, and run each migration file in order:

1. `supabase/migrations/001_create_events.sql`
2. `supabase/migrations/002_create_attendees.sql`
3. `supabase/migrations/003_create_email_events.sql`
4. `supabase/migrations/004_create_failed_syncs.sql`

Or if using the Supabase CLI:

```bash
supabase db push
```

### 4. Create an admin user

In the Supabase dashboard > Authentication > Users, create a user with email/password. This user will authenticate via the `/api/auth/login` endpoint.

### 5. Seed sample data

```bash
npm run seed
```

This creates a sample event ("Tech Startup Demo Day 2026") with 5 attendees.

### 6. Start the dev server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

## Configuring Loops.so

### Create Custom Contact Properties

Before syncing attendees, create these custom properties in Loops (Settings > Contact Properties):

| Property | Type |
|---|---|
| `company` | String |
| `role` | String |
| `interests` | String |
| `personalizedIntro` | String |
| `personalizedCta` | String |
| `personalizedSubject` | String |
| `eventName` | String |
| `eventSlug` | String |

### Create an Event-Triggered Loop

1. Go to Loops dashboard > Loops
2. Create a new Loop triggered by an **Event** (e.g., `demo_day_2026.attended`)
3. Build your email sequence using the custom contact properties above
4. Use `{{personalizedIntro}}` in your email body for the AI-generated opener
5. Use `{{personalizedCta}}` for the call-to-action
6. Use `{{personalizedSubject}}` as the subject line (or override it)

### Set Up Webhook Forwarding

1. Go to Settings > Webhooks in Loops
2. Set the endpoint URL to: `https://your-domain.com/api/webhooks/loops`
3. Enable events: Email Sent, Delivered, Opened, Clicked, Bounced
4. Copy the signing secret and set it as `LOOPS_WEBHOOK_SECRET`

### Set Up Resend Webhooks

1. Go to Resend dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/resend`
3. Select events: email.sent, email.delivered, email.opened, email.clicked, email.bounced
4. Copy the signing secret and set it as `RESEND_WEBHOOK_SECRET`

## API Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/events/:slug/register` | Register an attendee (rate limited: 10/min/IP) |
| `POST` | `/api/auth/login` | Admin login, returns JWT |
| `GET` | `/health` | Health check |

### Admin (requires Bearer token)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/events` | List all events with attendee counts |
| `GET` | `/api/events/:id` | Get event details |
| `POST` | `/api/events` | Create a new event |
| `PUT` | `/api/events/:id` | Update an event |
| `GET` | `/api/events/:id/attendees` | List attendees with engagement data |
| `GET` | `/api/events/:id/analytics` | Get event analytics |
| `POST` | `/api/events/:id/sequences/preview` | Preview personalized email for an attendee |
| `POST` | `/api/events/:id/resync` | Re-push all attendees to Loops |

### Webhooks

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/webhooks/loops` | Receives Loops email events |
| `POST` | `/api/webhooks/resend` | Receives Resend email events |

## Registration Flow

When a POST hits `/api/events/:slug/register`:

1. Validates the request body (name, email, company, role, interests)
2. Looks up the event by slug (must be `active`)
3. Saves the attendee to Supabase with a derived segment
4. Calls Gemini AI to generate personalized email fields
5. Syncs the contact to Loops with personalized properties
6. Fires the Loops event to trigger the drip sequence
7. Sends an immediate confirmation email via Resend
8. Returns `201` with the attendee ID

Steps 4-7 are non-blocking — if any fail, the registration still succeeds and failures are queued for retry.

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

Set environment variables in the Vercel dashboard.

### Railway

Connect your GitHub repo. Railway auto-detects the `railway.toml` config. Set environment variables in the Railway dashboard.

## Development

```bash
npm run dev     # Start dev server with hot reload
npm run build   # Build TypeScript
npm run seed    # Seed sample data
npm run lint    # Lint source code
```
