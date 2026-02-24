import { Router } from "express";
import eventsRouter from "./events";
import registrationRouter from "./registration";
import webhooksRouter from "./webhooks";
import analyticsRouter from "./analytics";

const router = Router();

router.use("/events", eventsRouter);
router.use("/events", registrationRouter);
router.use("/events", analyticsRouter);
router.use("/webhooks", webhooksRouter);

export default router;
