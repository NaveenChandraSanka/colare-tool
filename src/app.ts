import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { supabaseAnon } from "./config/supabase";
import { validate } from "./middleware/validate";
import { env } from "./config/env";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL || true }));

  // Raw body for webhooks — MUST come before express.json()
  app.use(
    "/api/webhooks",
    express.raw({ type: "application/json" })
  );

  // JSON parsing for everything else
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth login endpoint
  app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  });

  // Auth token refresh endpoint
  app.post("/api/auth/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      res.status(400).json({ error: "refresh_token is required" });
      return;
    }

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      res.status(401).json({ error: error?.message || "Failed to refresh session" });
      return;
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user!.id,
        email: data.user!.email,
      },
    });
  });

  // API routes
  app.use("/api", routes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
