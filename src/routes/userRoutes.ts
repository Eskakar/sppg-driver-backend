import { Router } from "express";
import { me } from "../controller/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", requireAuth, me);

export default router;