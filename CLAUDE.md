# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Colare is a post-event email automation backend built with Node.js, Express 5, and TypeScript. It automates personalized email outreach for event attendees by:
- Accepting public registrations via REST API
- Generating personalized email content using Google Gemini AI
- Syncing contacts to Loops.so for drip email sequences
- Sending confirmation emails via Resend
- Tracking email engagement (opens, clicks, bounces) via webhooks

## Build & Development Commands

```bash
npm run dev        # Start dev server with hot reload (tsx watch)
npm run build      # Compile TypeScript to dist/
npm run start      # Run compiled dist/index.js in production
npm run seed       # Populate sample event & attendees
npm run lint       # Run ESLint on src/
```

No `.eslintrc` config file currently exists — the lint script calls `eslint src/` directly.

Database migrations are in `supabase/migrations/` (001–004) and must be applied manually via Supabase SQL Editor or `supabase db push`.

## Architecture

### Request Flow

Routes (`src/routes/`) → Validation middleware (`src/middleware/validate.ts` + Zod schemas) → Controllers (`src/controllers/`) → Services (`src/services/`)

### Key Directories

- **`src/config/`** — Zod-validated env vars (`env.ts`) and Supabase client init (`supabase.ts`)
- **`src/middleware/`** — Auth (Supabase JWT bearer tokens), rate limiting (10/min per IP), Zod validation, global error handler
- **`src/routes/`** — Express route definitions for events, registration, webhooks, analytics
- **`src/controllers/`** — Business logic orchestration
- **`src/services/`** — External API integrations (Gemini, Loops, Resend) and the failed sync retry processor
- **`src/schemas/`** — Zod validation schemas for all API inputs
- **`src/types/`** — TypeScript interfaces for DB tables and API responses
- **`src/utils/`** — Logger (Pino), exponential backoff retry, webhook signature verification, slug generation

### Registration Flow (the core feature)

`POST /api/events/:slug/register` orchestrates: validate → lookup event by slug → save attendee to Supabase → generate AI personalization (non-blocking) → sync to Loops (non-blocking, queued on failure) → fire Loops event (non-blocking) → send Resend confirmation (non-blocking) → return 201.

All external service calls are non-blocking — registration succeeds even if Gemini, Loops, or Resend fail. Failed Loops syncs are queued in `failed_syncs` table and retried by a background processor (every 60s, exponential backoff, max 10 attempts).

### Database (Supabase/PostgreSQL)

Four tables: `events`, `attendees`, `email_events`, `failed_syncs`. Attendee uniqueness is enforced at DB level via `(event_id, email)` unique constraint. Migrations are sequential SQL files in `supabase/migrations/`.

### External Integrations

| Service | Purpose | Config Env Var |
|---------|---------|---------------|
| Supabase | Auth + Database | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Google Gemini | AI personalization (JSON mode) | `GEMINI_API_KEY` |
| Loops.so | Contact sync + drip sequences | `LOOPS_API_KEY` |
| Resend | Transactional confirmation emails | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |

### Key Patterns

- **Zod everywhere**: All API inputs validated via Zod schemas in `src/schemas/`
- **Resilient registration**: External calls never block the registration response
- **Exponential backoff with jitter**: `src/utils/retry.ts` wraps flaky API calls; `src/services/sync.ts` retries failed syncs from the DB queue
- **Segment derivation**: Attendee segment is derived from interests array at registration time (priority: demo > partnership > learn-more > first item > general)
- **Webhook verification**: Svix for Resend webhooks, custom HMAC-SHA256 for Loops — both optional (only if secret env vars are set)
- **Admin auth**: Bearer token verified as Supabase JWT; required on all `/api/events` admin routes
- **Slug generation**: Lowercase + sanitize + nanoid suffix for uniqueness (`src/utils/slug.ts`)

### Deployment

- **Vercel**: `vercel.json` routes all requests to `dist/index.js`
- **Railway**: `railway.toml` runs `npm run build && npm start`
