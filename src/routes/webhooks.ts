import { Router } from "express";
import * as webhooksController from "../controllers/webhooks.controller";

const router = Router();

router.post("/loops", webhooksController.handleLoops);
router.post("/resend", webhooksController.handleResend);

export default router;
