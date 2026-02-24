import { Router } from "express";
import { validate } from "../middleware/validate";
import { registrationLimiter } from "../middleware/rateLimiter";
import { registrationSchema } from "../schemas/registration.schema";
import * as registrationController from "../controllers/registration.controller";

const router = Router();

// Public: get event info for registration page
router.get("/:slug/public", registrationController.getPublicEvent);

router.post(
  "/:slug/register",
  registrationLimiter,
  validate(registrationSchema),
  registrationController.register
);

export default router;
