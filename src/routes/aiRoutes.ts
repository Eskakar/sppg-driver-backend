import { Router } from "express";
import { chatController } from "../controller/aiController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/chat", requireAuth, chatController);

export default router;