import { Router } from "express";
import { chatController } from "../controller/aiController";
import { requireAuth } from "../middlewares/authMiddleware";
import { uploadProofHandler } from "../controller/aiController";
const router = Router();
import { upload } from "../services/uploadService";

router.post("/chat", requireAuth, chatController);
router.post("/validate-proof",requireAuth,upload.single("image"),uploadProofHandler);

export default router;