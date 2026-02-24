import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema";
import * as eventsController from "../controllers/events.controller";

const router = Router();

router.get("/", requireAuth, eventsController.list);
router.get("/:id", requireAuth, eventsController.getById);
router.post("/", requireAuth, validate(createEventSchema), eventsController.create);
router.put("/:id", requireAuth, validate(updateEventSchema), eventsController.update);
router.get("/:id/attendees", requireAuth, eventsController.getAttendees);
router.post("/:id/sequences/preview", requireAuth, eventsController.previewSequence);
router.post("/:id/resync", requireAuth, eventsController.resyncAttendees);
router.post("/:id/series/generate", requireAuth, eventsController.generateSeriesForAttendee);
router.get("/:id/series", requireAuth, eventsController.getSeries);
router.get("/:id/series/:attendeeId", requireAuth, eventsController.getAttendeeSeries);

export default router;
