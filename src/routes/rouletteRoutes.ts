import { Router } from "express";
import { spinController, getSpinController, addSpinToken } from "../controller/rouletteController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/spin", requireAuth, getSpinController);
router.post("/spin", requireAuth, spinController);
//khusus dev
router.post("/spin/add", requireAuth, addSpinToken);

export default router;